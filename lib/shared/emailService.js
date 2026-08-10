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
 * Obtener la cuenta SMTP asignada a un tipo de correo o por ID explícito.
 * @param {string} tipoCorreo - Nombre del tipo de correo
 * @param {number|null} idSede - ID de sede o null (obsoleto, conservado por compatibilidad)
 * @param {number|null} idTipo - ID del tipo de correo o null
 * @param {number|null} idCuenta - ID explícito de CUENTAS_SMTP o null
 * @returns {Promise<{ host, port, user, pass, from } | null>}
 */
async function getSmtpAccount(tipoCorreo, idSede = null, idTipo = null, idCuenta = null) {
  let cuenta;

  if (idCuenta) {
    cuenta = await DatabaseManager.getById('CUENTAS_SMTP', idCuenta, 'ID_CUENTA');
    if (!cuenta || !cuenta.ACTIVO) return null;
  } else {
    // Obtener tipo de correo
    let tipo;
    if (idTipo) {
      const tipos = await DatabaseManager.select('TIPOS_CORREO', { ID_TIPO: idTipo });
      if (!tipos || tipos.length === 0) return null;
      tipo = tipos[0];
    } else {
      const tipos = await DatabaseManager.select('TIPOS_CORREO', { NOMBRE_TIPO: tipoCorreo });
      if (!tipos || tipos.length === 0) return null;
      tipo = tipos[0];
    }

    if (!tipo || !tipo.ID_CUENTA) return null;

    cuenta = await DatabaseManager.getById('CUENTAS_SMTP', tipo.ID_CUENTA, 'ID_CUENTA');
    if (!cuenta || !cuenta.ACTIVO) return null;
  }

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
    from: cuenta.SMTP_USER,
  };
}

/**
 * Crear un transporter dinámico según el tipo de correo y sede.
 * Si no encuentra cuenta en BD, usa las variables de entorno (fallback).
 */
async function createTransporterDynamic(tipoCorreo, metadatos = {}, idTipo = null, idCuenta = null) {
  const idSede = metadatos.id_sede || metadatos.idSede || null;
  const idCuentaFinal = idCuenta || metadatos.id_cuenta || metadatos.idCuenta || null;
  const account = await getSmtpAccount(tipoCorreo, idSede, idTipo, idCuentaFinal);

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
export async function createEmail({ tipo, idUsuarios = [], to, cc = [], bcc = [], subject, html, text, attachments = [], creadoPor, prioridad = 'normal', fechaProgramada = null, metadatos = {}, idCuenta = null, forceSend = false }) {
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

  // Resolver remitente: preferir cuenta explícita, luego default del tipo, luego env
  const finalMetadatos = { ...metadatos };
  if (idCuenta) finalMetadatos.id_cuenta = idCuenta;

  const account = await getSmtpAccount(tipo, null, tipos[0].ID_TIPO, idCuenta);
  const remitente = account ? account.from : (process.env.SMTP_FROM || process.env.SMTP_USER || 'CEPRE UNAM');

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
    METADATOS: JSON.stringify(finalMetadatos),
    CREADO_POR: creadoPor || 'sistema',
    ENVIO_AUTOMATICO: envioAutomatico,
    BLOQUEADO: false,
    PERSONALIZADO: false,
    REMITENTE: remitente,
  };

  const result = await DatabaseManager.insert('CORREOS', insertData);
  const idCorreo = result[0].ID_CORREO;

  let adjuntosMeta = [];
  if (attachments && attachments.length > 0) {
    for (const att of attachments) {
      const buffer = att.buffer || (att.content ? Buffer.from(att.content, 'base64') : null);
      if (!buffer) continue;
      const meta = await uploadAttachment(buffer, att.filename, att.contentType, idCorreo);
      adjuntosMeta.push({ ...meta, cid: att.cid });
    }
    await DatabaseManager.update('CORREOS', idCorreo, { ADJUNTOS: JSON.stringify(adjuntosMeta) }, 'ID_CORREO');
  }

  if (envioAutomatico || forceSend) {
    const correoRecord = { ...insertData, ID_CORREO: idCorreo, ADJUNTOS: JSON.stringify(adjuntosMeta) };
    const sendResult = await sendEmailNow(idCorreo, correoRecord, tipos[0]);
    return { idCorreo, estado: sendResult.estado };
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
 * Convierte imágenes incrustadas como data:image/...;base64,... en adjuntos
 * inline con cid, para que nodemailer las adjunte correctamente.
 */
function convertBase64ImagesToCid(html) {
  const attachments = [];
  let index = 0;
  const processedHtml = html.replace(
    /data:image\/([a-zA-Z0-9+.-]+);base64,([A-Za-z0-9+/=]+)/g,
    (match, mime, b64) => {
      const cid = `inline-img-${index++}`;
      attachments.push({
        filename: `image-${cid}`,
        content: Buffer.from(b64, 'base64'),
        contentType: `image/${mime}`,
        cid,
      });
      return `cid:${cid}`;
    }
  );
  return { html: processedHtml, attachments };
}

/**
 * Enviar un correo pendiente via SMTP.
 * Cambia estado a 'enviado' o 'fallido'.
 */
export async function sendEmailNow(idCorreo, correo = null, tipo = null) {
  await DatabaseManager.connect();

  if (!correo) correo = await DatabaseManager.getById('CORREOS', idCorreo, 'ID_CORREO');
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
  const { transporter, from } = await createTransporterDynamic(correo.TIPO, metadatos, tipo ? tipo.ID_TIPO : null);

  // Nodemailer acepta arrays o strings separados por coma
  const toField = Array.isArray(correo.DESTINATARIOS) ? correo.DESTINATARIOS.join(', ') : correo.DESTINATARIOS;
  const ccField = Array.isArray(correo.CC) ? (correo.CC.length > 0 ? correo.CC.join(', ') : undefined) : (correo.CC || undefined);
  const bccField = Array.isArray(correo.BCC) ? (correo.BCC.length > 0 ? correo.BCC.join(', ') : undefined) : (correo.BCC || undefined);

  // Convertir imágenes base64 del HTML a adjuntos inline con cid
  const { html: htmlWithCid, attachments: inlineAttachments } = convertBase64ImagesToCid(correo.CUERPO_HTML || '');

  const mailOptions = {
    from,
    to: toField,
    cc: ccField,
    bcc: bccField,
    subject: correo.ASUNTO,
    html: htmlWithCid,
    text: correo.CUERPO_TEXTO || correo.CUERPO_HTML.replace(/<[^>]*>/g, ''),
  };

  let adjuntos = [];
  try {
    adjuntos = typeof correo.ADJUNTOS === 'string' ? JSON.parse(correo.ADJUNTOS) : (correo.ADJUNTOS || []);
  } catch (e) {
    adjuntos = [];
  }

  const nodemailerAttachments = [];
  for (const adj of adjuntos) {
    const att = {
      filename: adj.filename,
      contentType: adj.contentType,
    };
    if (adj.content) {
      att.content = Buffer.from(adj.content, 'base64');
    } else if (adj.path) {
      att.path = await getAttachmentUrl(adj.path);
    }
    if (adj.cid) att.cid = adj.cid;
    nodemailerAttachments.push(att);
  }

  const allAttachments = [...nodemailerAttachments, ...inlineAttachments];
  if (allAttachments.length > 0) {
    mailOptions.attachments = allAttachments;
  }

  try {
    const info = await transporter.sendMail(mailOptions);

    await DatabaseManager.update('CORREOS', idCorreo, {
      ESTADO: 'enviado',
      BLOQUEADO: true,
      MESSAGE_ID: info.messageId,
      ENVIADO_EN: new Date().toISOString(),
      REMITENTE: from,
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

/**
 * Crear correos personalizados masivos: un correo por destinatario del view,
 * reemplazando los merge fields (spans con data-field) por los valores del view.
 */
export async function createMassEmail({ tipo, viewName, idField = 'ID_USUARIO', recipients, cc = [], bcc = [], subject, html, text, attachments = [], creadoPor, prioridad = 'normal', fechaProgramada = null, metadatos = {}, idCuenta = null, remitente }) {
  await DatabaseManager.connect();

  const results = [];
  for (const recipient of recipients) {
    // Consultar el view para obtener los datos del destinatario
    let rowData = recipient.rowData || {};
    if (viewName && recipient.id) {
      try {
        const rows = await DatabaseManager.select(viewName, { [idField]: recipient.id });
        if (rows && rows.length > 0) {
          rowData = rows[0];
        }
      } catch (e) {
        console.error(`[createMassEmail] Error consultando view ${viewName} para ${idField}=${recipient.id}:`, e.message);
      }
    }

    // Reemplazar merge fields (regex flexible: tolera atributos extra en cualquier orden)
    const personalizedHtml = html.replace(
      /<span[^>]*class="merge-field"[^>]*data-field="([^"]+)"[^>]*>[^<]*<\/span>/g,
      (match, field) => rowData[field] ?? ''
    );

    const result = await createEmail({
      tipo,
      idUsuarios: [recipient.id],
      to: [recipient.email],
      cc,
      bcc,
      subject,
      html: personalizedHtml,
      text: personalizedHtml.replace(/<[^>]*>/g, ''),
      attachments,
      creadoPor,
      prioridad,
      fechaProgramada,
      metadatos,
      idCuenta,
    });
    results.push(result);
  }
  return results;
}

export default { createEmail, createMassEmail, updateEmail, sendEmailNow, cancelEmail, retryEmail, sendEmail };
