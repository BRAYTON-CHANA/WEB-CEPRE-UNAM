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

function createTransporterFromEnv(pool = false) {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.office365.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: false,
    pool,
    tls: { rejectUnauthorized: false },
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Obtener la cuenta SMTP por ID explícito o la cuenta por defecto.
 * @param {number|null} idCuenta - ID explícito de CUENTAS_SMTP o null
 * @returns {Promise<{ host, port, user, pass, from } | null>}
 */
async function getSmtpAccount(idCuenta = null) {
  let cuenta;

  if (idCuenta) {
    cuenta = await DatabaseManager.getById('CUENTAS_SMTP', idCuenta, 'ID_CUENTA');
    if (!cuenta || !cuenta.ACTIVO) return null;
  } else {
    // Buscar la cuenta marcada como default (para correos automáticos)
    const defaults = await DatabaseManager.select('CUENTAS_SMTP', { ES_CUENTA_DEFAULT: true, ACTIVO: true });
    if (!defaults || defaults.length === 0) return null;
    cuenta = defaults[0];
  }

  const password = decrypt(
    cuenta.SMTP_PASS_ENCRYPTED,
    cuenta.SMTP_PASS_IV,
    cuenta.SMTP_PASS_TAG
  );

  return {
    idCuenta: cuenta.ID_CUENTA,
    host: cuenta.SMTP_HOST,
    port: cuenta.SMTP_PORT,
    user: cuenta.SMTP_USER,
    pass: password,
    from: cuenta.SMTP_USER,
  };
}

/**
 * Crear un transporter dinámico según la cuenta SMTP.
 * Si no se especifica idCuenta, usa la cuenta por defecto.
 * Si no encuentra cuenta en BD, usa las variables de entorno (fallback).
 */
async function createTransporterDynamic(idCuenta = null, { pool = false } = {}) {
  const account = await getSmtpAccount(idCuenta);

  if (account) {
    return {
      transporter: nodemailer.createTransport({
        host: account.host,
        port: parseInt(account.port, 10),
        secure: false,
        pool,
        tls: { rejectUnauthorized: false },
        auth: { user: account.user, pass: account.pass },
      }),
      from: account.from,
    };
  }

  // Fallback a .env
  return {
    transporter: createTransporterFromEnv(pool),
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
  };
}

/**
 * Construir la fila de CORREOS a insertar. Compartida entre createEmail
 * (correo individual) y createMassEmail (batch de correos personalizados).
 */
function buildCorreoRow({ to, cc = [], bcc = [], subject, html, text, adjuntosMeta = [], prioridad = 'normal', fechaProgramada = null, metadatos = {}, creadoPor, idCreador = null, idCuentaSmtp = null, envioAutomatico = false, personalizado = false, remitente }) {
  const tipo = envioAutomatico
    ? 'automatico'
    : (personalizado ? 'personalizado' : 'correo');

  return {
    DESTINATARIOS: Array.isArray(to) ? to : [to],
    CC: Array.isArray(cc) ? cc : (cc ? [cc] : []),
    BCC: Array.isArray(bcc) ? bcc : (bcc ? [bcc] : []),
    ASUNTO: subject,
    CUERPO_HTML: html,
    CUERPO_TEXTO: text || html.replace(/<[^>]*>/g, ''),
    ADJUNTOS: JSON.stringify(adjuntosMeta),
    ESTADO: 'pendiente',
    PRIORIDAD: prioridad,
    FECHA_PROGRAMADA: fechaProgramada,
    INTENTOS: 0,
    METADATOS: JSON.stringify(metadatos),
    CREADO_POR: creadoPor || 'sistema',
    ID_CREADOR: idCreador || null,
    ID_CUENTA_SMTP: idCuentaSmtp,
    ENVIO_AUTOMATICO: envioAutomatico,
    BLOQUEADO: false,
    PERSONALIZADO: Boolean(personalizado),
    TIPO: tipo,
    REMITENTE: remitente,
  };
}

/**
 * Crear un correo en la cola.
 * Si envioAutomatico=TRUE o forceSend=TRUE, se envía inmediatamente.
 */
export async function createEmail({ to, cc = [], bcc = [], subject, html, text, attachments = [], creadoPor, idCreador = null, prioridad = 'normal', fechaProgramada = null, metadatos = {}, idCuenta = null, envioAutomatico = false, forceSend = false, personalizado = false }) {
  await DatabaseManager.connect();

  // Resolver cuenta y remitente: preferir cuenta explícita, luego default, luego env
  const finalMetadatos = { ...metadatos };

  const account = await getSmtpAccount(idCuenta);
  const finalIdCuenta = idCuenta || (envioAutomatico ? account?.idCuenta : null);
  const finalRemitente = account
    ? account.from
    : (process.env.SMTP_FROM || process.env.SMTP_USER || 'CEPRE UNAM');

  if (finalIdCuenta) finalMetadatos.id_cuenta = finalIdCuenta;

  const insertData = buildCorreoRow({
    to, cc, bcc, subject, html, text,
    adjuntosMeta: [],
    prioridad, fechaProgramada,
    metadatos: finalMetadatos,
    creadoPor, idCreador,
    idCuentaSmtp: finalIdCuenta,
    envioAutomatico, personalizado,
    remitente: finalRemitente,
  });

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
    const sendResult = await sendEmailNow(idCorreo, correoRecord);
    return { idCorreo, estado: sendResult.estado };
  }

  return { idCorreo, estado: result[0].ESTADO || 'pendiente' };
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
export async function sendEmailNow(idCorreo, correo = null, idEnviador = null, opts = {}) {
  await DatabaseManager.connect();
  const { transport = null, urlCache = null } = opts;

  if (!correo) correo = await DatabaseManager.getById('CORREOS', idCorreo, 'ID_CORREO');
  if (!correo) throw new Error('Correo no encontrado');
  if (correo.BLOQUEADO) throw new Error('Correo bloqueado, no se puede enviar');

  // Transporter compartido (batch) o dinámico según ID_CUENTA_SMTP (o cuenta default)
  const { transporter, from } = transport || await createTransporterDynamic(correo.ID_CUENTA_SMTP || null);

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
      // En batch, archivos idénticos entre correos (adjunto común copiado por
      // correo) reusan la misma signed URL por firma nombre+tamaño+tipo.
      const firma = `${adj.filename}|${adj.size ?? ''}|${adj.contentType}`;
      let url = urlCache?.get(firma);
      if (!url) {
        url = await getAttachmentUrl(adj.path);
        urlCache?.set(firma, url);
      }
      att.path = url;
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
      ID_ENVIADOR: idEnviador,
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
  const { transporter, from } = await createTransporterDynamic(); // usa cuenta default
  const info = await transporter.sendMail({
    from,
    to, subject, html,
    text: text || html.replace(/<[^>]*>/g, ''),
    cc, bcc, attachments,
  });
  return { messageId: info.messageId, response: info.response };
}

function escapeHtml(text) {
  if (text == null) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const HTML_ENTITIES = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&#x27;': "'",
  '&#x2F;': '/',
  '&nbsp;': ' ',
};

function decodeHtmlEntities(text) {
  return text.replace(/&(?:amp|lt|gt|quot|#39|#x27|#x2F|nbsp);/g, (entity) => HTML_ENTITIES[entity] || entity);
}

function htmlToPlainText(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p\s*>/gi, '\n')
    .replace(/<\/div\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&(?:#[0-9]+|#x[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (entity) => decodeHtmlEntities(entity))
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Captura spans merge-field sin depender del orden de atributos.
const MERGE_FIELD_REGEX = /<span\b(?=[^>]*\bclass=["']merge-field["'])(?=[^>]*\bdata-field=["']([^"']+)["'])[^>]*>[\s\S]*?<\/span>/gi;

/**
 * Crear correos personalizados masivos: un correo por destinatario del view,
 * reemplazando los merge fields (spans con data-field) por los valores del view.
 */
export async function createMassEmail({ viewName, idField = 'ID_USUARIO', recipients, cc = [], bcc = [], subject, html, text, attachments = [], creadoPor, idCreador = null, prioridad = 'normal', fechaProgramada = null, metadatos = {}, idCuenta = null, remitente, personalizado = false, forceSend = false }) {
  await DatabaseManager.connect();

  // Cuenta SMTP resuelta una sola vez para todo el lote
  const smtpAccount = await getSmtpAccount(idCuenta);
  const finalRemitente = smtpAccount
    ? smtpAccount.from
    : (process.env.SMTP_FROM || process.env.SMTP_USER || 'CEPRE UNAM');

  const finalMetadatos = { ...metadatos };
  if (idCuenta) finalMetadatos.id_cuenta = idCuenta;

  // Datos del view en batch: 1 query por cada 100 ids en vez de 1 por destinatario
  const rowById = new Map();
  if (viewName) {
    const ids = [...new Set(recipients.map(r => r.id).filter(id => id != null))];
    for (let i = 0; i < ids.length; i += 100) {
      try {
        const rows = await DatabaseManager.select(viewName, [
          { field: idField, op: 'in', value: ids.slice(i, i + 100) },
        ]);
        for (const r of rows) rowById.set(String(r[idField]), r);
      } catch (e) {
        console.error(`[createMassEmail] Error consultando view ${viewName}:`, e.message);
      }
    }
  }

  // Adjuntos subidos antes del insert. Carpeta del lote con copia por
  // destinatario (cada correo conserva su propio archivo, no compartido).
  const batchDir = `lote-${Date.now()}`;
  const rows = [];
  for (const [idx, recipient] of recipients.entries()) {
    const rowData = rowById.get(String(recipient.id)) || recipient.rowData || {};

    // Sin view se conserva el HTML original. En modo personalizado con view,
    // reemplazar merge fields por los datos propios de este destinatario.
    const personalizedHtml = personalizado && viewName
      ? html.replace(MERGE_FIELD_REGEX, (_match, field) => escapeHtml(rowData[field]))
      : html;

    const adjuntosMeta = [];
    // Adjuntos comunes + adjuntos personalizados del destinatario (si hay).
    for (const att of [...attachments, ...(recipient.adjuntos || [])]) {
      const buffer = att.buffer || (att.content ? Buffer.from(att.content, 'base64') : null);
      if (!buffer) continue;
      const meta = await uploadAttachment(buffer, att.filename, att.contentType, `${batchDir}/${idx}`);
      adjuntosMeta.push({ ...meta, cid: att.cid });
    }

    rows.push(buildCorreoRow({
      to: [recipient.email],
      cc,
      bcc,
      subject,
      html: personalizedHtml,
      text: text || htmlToPlainText(personalizedHtml),
      adjuntosMeta,
      prioridad,
      fechaProgramada,
      metadatos: finalMetadatos,
      creadoPor,
      idCreador,
      idCuentaSmtp: idCuenta || null,
      personalizado,
      remitente: finalRemitente,
    }));
  }

  // Una sola inserción multi-row para todo el lote
  if (rows.length === 0) return [];
  const inserted = await DatabaseManager.insertBatch('CORREOS', rows);

  if (forceSend) {
    const transport = await createTransporterDynamic(idCuenta || smtpAccount?.idCuenta || null, { pool: true });
    const urlCache = new Map();
    const results = [];
    try {
      for (const row of inserted) {
        try {
          results.push(await sendEmailNow(row.ID_CORREO, row, null, { transport, urlCache }));
        } catch (e) {
          results.push({ idCorreo: row.ID_CORREO, estado: 'fallido', error: e.message });
        }
      }
    } finally {
      transport.transporter.close?.();
    }
    return results;
  }

  return inserted.map(r => ({ idCorreo: r.ID_CORREO, estado: r.ESTADO || 'pendiente' }));
}

/**
 * Enviar un lote de correos pendientes por IDs.
 * Fetch batch de correos, un transporter por cuenta SMTP única (pool) y
 * cache de signed URLs por firma de archivo (adjuntos comunes = 1 URL).
 */
export async function sendEmailsBatch(ids, idEnviador = null) {
  await DatabaseManager.connect();

  const correos = await DatabaseManager.select('CORREOS', [
    { field: 'ID_CORREO', op: 'in', value: ids.map(Number) },
  ]);
  const correoById = new Map(correos.map(c => [c.ID_CORREO, c]));

  const transports = new Map(); // ID_CUENTA_SMTP|'default' → { transporter, from }
  const urlCache = new Map();   // firma adjunto → signedUrl
  const enviados = [];
  const fallidos = [];

  try {
    for (const id of ids) {
      const correo = correoById.get(Number(id));
      if (!correo) {
        fallidos.push({ idCorreo: id, error: 'Correo no encontrado' });
        continue;
      }

      const key = correo.ID_CUENTA_SMTP ?? 'default';
      if (!transports.has(key)) {
        transports.set(key, await createTransporterDynamic(correo.ID_CUENTA_SMTP || null, { pool: true }));
      }

      try {
        enviados.push(await sendEmailNow(correo.ID_CORREO, correo, idEnviador, {
          transport: transports.get(key),
          urlCache,
        }));
      } catch (error) {
        fallidos.push({ idCorreo: id, error: error.message || 'Error enviando el correo' });
      }
    }
  } finally {
    for (const t of transports.values()) t.transporter.close?.();
  }

  return { total: ids.length, enviados, fallidos, errores: fallidos };
}

/**
 * Procesa correos programados cuya fecha ya llegó.
 * Busca correos pendientes con FECHA_PROGRAMADA <= NOW() y los envía.
 * @param {number} limit - Máximo de correos a procesar por ejecución (default 10)
 * @returns {Promise<{ procesados, enviados, fallidos, errores: Array }>}
 */
export async function processScheduledEmails(limit = 10) {
  await DatabaseManager.connect();

  const correos = await DatabaseManager.query(
    `SELECT * FROM "CORREOS"
     WHERE "ESTADO" = 'pendiente'
       AND "FECHA_PROGRAMADA" IS NOT NULL
       AND "FECHA_PROGRAMADA" <= (NOW() AT TIME ZONE 'America/Lima')
       AND "BLOQUEADO" = false
     ORDER BY "FECHA_PROGRAMADA" ASC
     LIMIT $1`,
    limit
  );

  let enviados = 0;
  let fallidos = 0;
  const errores = [];

  // Un transporter (pool) por cuenta SMTP única del lote
  const porCuenta = new Map();
  for (const correo of correos) {
    const key = correo.ID_CUENTA_SMTP ?? 'default';
    if (!porCuenta.has(key)) porCuenta.set(key, []);
    porCuenta.get(key).push(correo);
  }

  const urlCache = new Map();
  for (const [key, grupo] of porCuenta) {
    const transport = await createTransporterDynamic(key === 'default' ? null : key, { pool: true });
    try {
      for (const correo of grupo) {
        try {
          await sendEmailNow(correo.ID_CORREO, correo, null, { transport, urlCache });
          enviados++;
        } catch (err) {
          fallidos++;
          errores.push({ idCorreo: correo.ID_CORREO, error: err.message });
          console.error(`[processScheduledEmails] Error enviando correo ${correo.ID_CORREO}:`, err.message);
        }
      }
    } finally {
      transport.transporter.close?.();
    }
  }

  const resumen = { procesados: correos.length, enviados, fallidos, errores };
  console.log(`[processScheduledEmails] Procesados: ${resumen.procesados}, Enviados: ${resumen.enviados}, Fallidos: ${resumen.fallidos}`);
  return resumen;
}

export default { createEmail, createMassEmail, sendEmailsBatch, updateEmail, sendEmailNow, cancelEmail, retryEmail, sendEmail, processScheduledEmails };
