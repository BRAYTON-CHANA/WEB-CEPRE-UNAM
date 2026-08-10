import { db } from '@/shared/api';
import { tokenUtils } from '@/shared/utils/tokenUtils';

/**
 * Crea un borrador en CORREOS desde el composer.
 * @param {Object} payload - Campos del correo normalizados
 */
export async function createDraft(payload) {
  const data = {
    TIPO: payload.tipo,
    ID_USUARIOS: payload.idUsuarios,
    DESTINATARIOS: payload.destinatarios,
    CC: payload.cc,
    BCC: payload.bcc,
    ASUNTO: payload.asunto,
    CUERPO_HTML: payload.cuerpoHtml,
    CUERPO_TEXTO: payload.cuerpoHtml.replace(/<[^>]*>/g, ''),
    ADJUNTOS: JSON.stringify(payload.adjuntos || []),
    ESTADO: 'pendiente',
    PRIORIDAD: payload.prioridad || 'normal',
    FECHA_PROGRAMADA: payload.fechaProgramada || null,
    METADATOS: JSON.stringify({ id_cuenta: payload.idCuenta || null }),
    CREADO_POR: payload.creadoPor || 'sistema',
    ENVIO_AUTOMATICO: false,
    BLOQUEADO: false,
    PERSONALIZADO: false,
    REMITENTE: payload.remitente || null,
  };

  return await db.insert('CORREOS', data);
}

/**
 * Guarda y envía un correo inmediatamente vía SMTP.
 * @param {Object} payload - Mismos campos que createDraft
 */
export async function sendAndSave(payload) {
  const token = tokenUtils.getToken();
  const response = await fetch('/api/correos/enviar', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.message || 'Error enviando el correo');
  return result.data;
}

/**
 * Guarda correos masivos personalizados (uno por destinatario del view).
 * @param {Object} payload - Campos del correo + recipients con rowData
 */
export async function saveMassDraft(payload) {
  const token = tokenUtils.getToken();
  const response = await fetch('/api/correos/enviar-masivo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.message || 'Error guardando correos masivos');
  return result.data;
}

/**
 * Envía un correo pendiente por ID vía SMTP.
 * @param {number} idCorreo - ID del correo a enviar
 */
export async function sendEmailById(idCorreo) {
  const token = tokenUtils.getToken();
  const response = await fetch('/api/correos/enviar-id', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ idCorreo }),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.message || 'Error enviando el correo');
  return result.data;
}

/**
 * Obtiene una URL firmada temporal para descargar un adjunto de Supabase Storage.
 * @param {string} path - Path del archivo en el bucket correos-adjuntos
 * @returns {Promise<string>} URL firmada
 */
export async function getAttachmentUrl(path) {
  const token = tokenUtils.getToken();
  const response = await fetch('/api/storage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ action: 'url', bucket: 'correos-adjuntos', path }),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.message || 'Error generando URL del adjunto');
  return result.data.url;
}
