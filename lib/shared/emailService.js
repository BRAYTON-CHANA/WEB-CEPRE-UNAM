import nodemailer from 'nodemailer';
import DatabaseManager from '../database/DatabaseManager.js';
import { uploadAttachment, getAttachmentUrl } from './storageService.js';
import { decrypt } from './cryptoService.js';
import 'dotenv/config';

/**
 * Servicio de correos con cola y aprobación.
 * Usa Nodemailer + SMTP para envío.
 * Las credenciales SMTP se obtienen dinámicamente de CUENTAS_SMTP según tipo+sede.
 *
 * Variables de entorno (fallback si no hay cuenta en BD):
 * - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 * - ENCRYPTION_KEY (para desencriptar passwords de BD)
 */

function createTransporterFromEnv() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.office365.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: false,
    tls: { rejectUnauthorized: false },
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Obtener la cuenta SMTP asignada a un tipo de correo y sede.
 * Busca primero por sede específica, luego por default (ID_SEDE = NULL).
 * @param {string} tipoCorreo - Nombre del tipo de correo
 * @param {number|null} idSede - ID de sede o null
 * @returns {Promise<{ host, port, user, pass, from } | null>}
 */
async function getSmtpAccount(tipoCorreo, idSede = null) {
  // Obtener ID_TIPO_CORREO
  const tipos = await DatabaseManager.select('TIPOS_CORREO', { NOMBRE_TIPO: tipoCorreo });
  if (!tipos || tipos.length === 0) return null;
  const idTipo = tipos[0].ID_TIPO;

  // Buscar asignación por sede específica primero
  let query = `
    SELECT c.* FROM "TIPO_CORREO_CUENTA_SEDE" tccs
    JOIN "CUENTAS_SMTP" c ON tccs."ID_CUENTA" = c."ID_CUENTA"
    WHERE tccs."ID_TIPO_CORREO" = ${idTipo} AND c."ACTIVO" = TRUE
  `;

  if (idSede) {
    query += ` AND (tccs."ID_SEDE" = ${idSede} OR tccs."ID_SEDE" IS NULL)`;
    query += ` ORDER BY tccs."ID_SEDE" DESC NULLS LAST`;
  } else {
    query += ` AND tccs."ID_SEDE" IS NULL`;
  }
  query += ` LIMIT 1`;

  const results = await DatabaseManager.query(query);
  if (!results || results.length === 0) return null;

  const cuenta = results[0];
  const password = decrypt(
    cuenta.SMTP_PASS_ENCRYPTED,
    cuenta.SMTP_PASS_IV,
    cuenta.SMTP_PASS_TAG
  );

  return {
    host: cuenta.SMTP_HOST,
    port: cuenta.SMTP_PORT,
    user: cuenta.SMTP_USER,
    pass: password,
    from: cuenta.SMTP_FROM,
  };
}

/**
 * Crear un transporter dinámico según el tipo de correo y sede.
 * Si no encuentra cuenta en BD, usa las variables de entorno (fallback).
 */
async function createTransporterDynamic(tipoCorreo, metadatos = {}) {
  const idSede = metadatos.id_sede || metadatos.idSede || null;
  const account = await getSmtpAccount(tipoCorreo, idSede);

  if (account) {
    return {
      transporter: nodemailer.createTransport({
        host: account.host,
        port: parseInt(account.port, 10),
        secure: false,
        tls: { rejectUnauthorized: false },
        auth: { user: account.user, pass: account.pass },
      }),
      from: account.from,
    };
  }

  // Fallback a .env
  return {
    transporter: createTransporterFromEnv(),
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
  };
}

/**
 * Crear un correo en la cola.
 * Si el tipo tiene ENVIO_AUTOMATICO=TRUE en TIPOS_CORREO, se envía inmediatamente.
 */
export async function createEmail({ tipo, idUsuarios = [], to, cc = [], bcc = [], subject, html, text, attachments = [], creadoPor, prioridad = 'normal', fechaProgramada = null, metadatos = {} }) {
  await DatabaseManager.connect();

  const tipos = await DatabaseManager.select('TIPOS_CORREO', { NOMBRE_TIPO: tipo });
  if (!tipos || tipos.length === 0) {
    throw new Error(`Tipo de correo '${tipo}' no existe en TIPOS_CORREO`);
  }

  const envioAutomatico = tipos[0].ENVIO_AUTOMATICO;

  // Normalizar a arrays
  const toArray = Array.isArray(to) ? to : [to];
  const ccArray = Array.isArray(cc) ? cc : (cc ? [cc] : []);
  const bccArray = Array.isArray(bcc) ? bcc : (bcc ? [bcc] : []);

  const insertData = {
    TIPO: tipo,
    ID_USUARIOS: idUsuarios,
    DESTINATARIOS: toArray,
    CC: ccArray,
    BCC: bccArray,
    ASUNTO: subject,
    CUERPO_HTML: html,
    CUERPO_TEXTO: text || html.replace(/<[^>]*>/g, ''),
    ADJUNTOS: JSON.stringify([]),
    ESTADO: 'pendiente',
    PRIORIDAD: prioridad,
    FECHA_PROGRAMADA: fechaProgramada,
    INTENTOS: 0,
    METADATOS: JSON.stringify(metadatos),
    CREADO_POR: creadoPor || 'sistema',
    ENVIO_AUTOMATICO: envioAutomatico,
    BLOQUEADO: false,
    PERSONALIZADO: false,
  };

  const result = await DatabaseManager.insert('CORREOS', insertData);
  const idCorreo = result[0].ID_CORREO;

  if (attachments && attachments.length > 0) {
    const adjuntosMeta = [];
    for (const att of attachments) {
      const meta = await uploadAttachment(att.buffer, att.filename, att.contentType, idCorreo);
      adjuntosMeta.push(meta);
    }
    await DatabaseManager.update('CORREOS', idCorreo, { ADJUNTOS: JSON.stringify(adjuntosMeta) }, 'ID_CORREO');
  }

  if (envioAutomatico) {
    await sendEmailNow(idCorreo);
  }

  const updated = await DatabaseManager.getById('CORREOS', idCorreo, 'ID_CORREO');
  return { idCorreo, estado: updated?.ESTADO || 'pendiente' };
}

/**
 * Actualizar el contenido de un correo pendiente (no bloqueado).
 * Marca PERSONALIZADO=TRUE.
 */
export async function updateEmail(idCorreo, { subject, html, text, attachments }) {
  await DatabaseManager.connect();

  const correo = await DatabaseManager.getById('CORREOS', idCorreo, 'ID_CORREO');
  if (!correo) throw new Error('Correo no encontrado');
  if (correo.BLOQUEADO) throw new Error('Correo bloqueado, no se puede editar');
  if (correo.ESTADO !== 'pendiente' && correo.ESTADO !== 'fallido') {
    throw new Error(`No se puede editar un correo en estado '${correo.ESTADO}'`);
  }

  const updateData = { PERSONALIZADO: true };
  if (subject) updateData.ASUNTO = subject;
  if (html) {
    updateData.CUERPO_HTML = html;
    updateData.CUERPO_TEXTO = text || html.replace(/<[^>]*>/g, '');
  }
  if (text) updateData.CUERPO_TEXTO = text;

  if (attachments && attachments.length > 0) {
    const adjuntosMeta = [];
    for (const att of attachments) {
      const meta = await uploadAttachment(att.buffer, att.filename, att.contentType, idCorreo);
      adjuntosMeta.push(meta);
    }
    updateData.ADJUNTOS = JSON.stringify(adjuntosMeta);
  }

  await DatabaseManager.update('CORREOS', idCorreo, updateData, 'ID_CORREO');
  return { idCorreo, personalizado: true };
}

/**
 * Enviar un correo pendiente via SMTP.
 * Cambia estado a 'enviado' o 'fallido'.
 */
export async function sendEmailNow(idCorreo) {
  await DatabaseManager.connect();

  const correo = await DatabaseManager.getById('CORREOS', idCorreo, 'ID_CORREO');
  if (!correo) throw new Error('Correo no encontrado');
  if (correo.BLOQUEADO) throw new Error('Correo bloqueado, no se puede enviar');

  // Obtener metadatos para buscar la sede
  let metadatos = {};
  try {
    metadatos = typeof correo.METADATOS === 'string' ? JSON.parse(correo.METADATOS) : (correo.METADATOS || {});
  } catch (e) {
    metadatos = {};
  }

  // Crear transporter dinámico según tipo + sede
  const { transporter, from } = await createTransporterDynamic(correo.TIPO, metadatos);

  // Nodemailer acepta arrays o strings separados por coma
  const toField = Array.isArray(correo.DESTINATARIOS) ? correo.DESTINATARIOS.join(', ') : correo.DESTINATARIOS;
  const ccField = Array.isArray(correo.CC) ? (correo.CC.length > 0 ? correo.CC.join(', ') : undefined) : (correo.CC || undefined);
  const bccField = Array.isArray(correo.BCC) ? (correo.BCC.length > 0 ? correo.BCC.join(', ') : undefined) : (correo.BCC || undefined);

  const mailOptions = {
    from,
    to: toField,
    cc: ccField,
    bcc: bccField,
    subject: correo.ASUNTO,
    html: correo.CUERPO_HTML,
    text: correo.CUERPO_TEXTO || correo.CUERPO_HTML.replace(/<[^>]*>/g, ''),
  };

  let adjuntos = [];
  try {
    adjuntos = typeof correo.ADJUNTOS === 'string' ? JSON.parse(correo.ADJUNTOS) : (correo.ADJUNTOS || []);
  } catch (e) {
    adjuntos = [];
  }

  if (adjuntos.length > 0) {
    const nodemailerAttachments = [];
    for (const adj of adjuntos) {
      nodemailerAttachments.push({
        filename: adj.filename,
        path: await getAttachmentUrl(adj.path),
        contentType: adj.contentType,
      });
    }
    mailOptions.attachments = nodemailerAttachments;
  }

  try {
    const info = await transporter.sendMail(mailOptions);

    await DatabaseManager.update('CORREOS', idCorreo, {
      ESTADO: 'enviado',
      BLOQUEADO: true,
      MESSAGE_ID: info.messageId,
      ENVIADO_EN: new Date().toISOString(),
      ERROR: null,
    }, 'ID_CORREO');

    return { idCorreo, estado: 'enviado', messageId: info.messageId };
  } catch (error) {
    // Incrementar contador de intentos
    const intentosActuales = (correo.INTENTOS || 0) + 1;
    await DatabaseManager.update('CORREOS', idCorreo, {
      ESTADO: 'fallido',
      ERROR: error.message,
      INTENTOS: intentosActuales,
    }, 'ID_CORREO');
    throw error;
  }
}

/**
 * Cancelar un correo pendiente.
 */
export async function cancelEmail(idCorreo) {
  await DatabaseManager.connect();

  const correo = await DatabaseManager.getById('CORREOS', idCorreo, 'ID_CORREO');
  if (!correo) throw new Error('Correo no encontrado');
  if (correo.BLOQUEADO) throw new Error('Correo bloqueado, no se puede cancelar');

  await DatabaseManager.update('CORREOS', idCorreo, {
    ESTADO: 'cancelado',
    BLOQUEADO: true,
  }, 'ID_CORREO');

  return { idCorreo, estado: 'cancelado' };
}

/**
 * Reintentar envío de un correo fallido.
 */
export async function retryEmail(idCorreo) {
  await DatabaseManager.connect();

  const correo = await DatabaseManager.getById('CORREOS', idCorreo, 'ID_CORREO');
  if (!correo) throw new Error('Correo no encontrado');
  if (correo.ESTADO !== 'fallido') throw new Error('Solo se pueden reintentar correos fallidos');

  return await sendEmailNow(idCorreo);
}

/**
 * Función legacy para envío directo sin cola.
 * @deprecated Usar createEmail() en su lugar.
 */
export async function sendEmail({ to, subject, html, text, cc, bcc, attachments }) {
  const { transporter, from } = await createTransporterDynamic('password_reset');
  const info = await transporter.sendMail({
    from,
    to, subject, html,
    text: text || html.replace(/<[^>]*>/g, ''),
    cc, bcc, attachments,
  });
  return { messageId: info.messageId, response: info.response };
}

export default { createEmail, updateEmail, sendEmailNow, cancelEmail, retryEmail, sendEmail };
