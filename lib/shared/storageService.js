import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const BUCKET_CORREOS = 'correos-adjuntos';
const BUCKET_USUARIOS = 'usuarios-adjuntos';

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL y SUPABASE_SECRET_KEY deben estar configurados');
  }
  return createClient(url, key);
}

/**
 * Subir un archivo a Supabase Storage (bucket correos-adjuntos).
 *
 * @param {Buffer} fileBuffer - Contenido del archivo
 * @param {string} filename - Nombre original del archivo
 * @param {string} contentType - MIME type del archivo
 * @param {number} idCorreo - ID del correo (para organizar el path)
 * @returns {Promise<{ url: string, path: string, filename: string, contentType: string, size: number }>}
 */
export async function uploadAttachment(fileBuffer, filename, contentType, idCorreo) {
  const supabase = getSupabase();
  const timestamp = Date.now();
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `correos/${idCorreo}/${timestamp}-${safeName}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_CORREOS)
    .upload(path, fileBuffer, {
      contentType,
      upsert: false,
    });

  if (error) throw error;

  return {
    path: data.path,
    filename,
    contentType,
    size: fileBuffer.length,
  };
}

/**
 * Generar una URL firmada temporal para descargar un archivo del bucket correos-adjuntos.
 *
 * @param {string} path - Path del archivo en Storage
 * @param {number} expirySeconds - Segundos de validez (default: 3600 = 1 hora)
 * @returns {Promise<string>} URL firmada
 */
export async function getAttachmentUrl(path, expirySeconds = 3600) {
  const supabase = getSupabase();
  const { data, error } = await supabase.storage
    .from(BUCKET_CORREOS)
    .createSignedUrl(path, expirySeconds);

  if (error) throw error;
  return data.signedUrl;
}

/**
 * Eliminar un archivo del bucket correos-adjuntos.
 *
 * @param {string} path - Path del archivo en Storage
 */
export async function deleteAttachment(path) {
  const supabase = getSupabase();
  const { error } = await supabase.storage
    .from(BUCKET_CORREOS)
    .remove([path]);

  if (error) throw error;
  return { deleted: true };
}

// ============================================
// Postulaciones - bucket usuarios-adjuntos
// ============================================

/**
 * Subir un archivo de postulación (CV o anexos) al bucket usuarios-adjuntos.
 *
 * Modo estructurado (con options): path = postulaciones/{idPostulacion}/{clasificacion}/{tipo}-{itemId}-{timestamp}-{safeName}
 * Modo legacy (sin options): path = postulaciones/{idPostulacion}/{tipo}/{timestamp}-{safeName}
 *
 * @param {Buffer} fileBuffer - Contenido del archivo
 * @param {string} filename - Nombre original del archivo
 * @param {string} contentType - MIME type del archivo
 * @param {number} idPostulacion - ID de la postulación (para organizar el path)
 * @param {string} tipo - 'cv' o 'anexos' (legacy) o 'req'/'ext' (estructurado)
 * @param {Object} [options] - { clasificacion, itemId } para path estructurado
 * @returns {Promise<{ path: string, filename: string, contentType: string, size: number }>}
 */
export async function uploadPostulacionFile(fileBuffer, filename, contentType, idPostulacion, tipo = 'cv', options = {}) {
  const supabase = getSupabase();
  const timestamp = Date.now();
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

  let path;
  if (options && options.clasificacion && options.itemId) {
    // Path estructurado: postulaciones/{id}/{clasificacion}/{tipo}-{itemId}-{ts}-{name}
    const safeClas = String(options.clasificacion).replace(/[^a-zA-Z0-9._-]/g, '_');
    const safeItemId = String(options.itemId).replace(/[^a-zA-Z0-9._-]/g, '_');
    path = `postulaciones/${idPostulacion}/${safeClas}/${tipo}-${safeItemId}-${timestamp}-${safeName}`;
  } else {
    // Path legacy: postulaciones/{id}/{tipo}/{ts}-{name}
    path = `postulaciones/${idPostulacion}/${tipo}/${timestamp}-${safeName}`;
  }

  const { data, error } = await supabase.storage
    .from(BUCKET_USUARIOS)
    .upload(path, fileBuffer, {
      contentType,
      upsert: false,
    });

  if (error) throw error;

  return {
    path: data.path,
    filename,
    contentType,
    size: fileBuffer.length,
  };
}

/**
 * Generar una URL firmada para descargar un archivo del bucket usuarios-adjuntos.
 *
 * @param {string} path - Path del archivo en Storage
 * @param {number} expirySeconds - Segundos de validez (default: 3600 = 1 hora)
 * @returns {Promise<string>} URL firmada
 */
export async function getPostulacionFileUrl(path, expirySeconds = 3600) {
  const supabase = getSupabase();
  const { data, error } = await supabase.storage
    .from(BUCKET_USUARIOS)
    .createSignedUrl(path, expirySeconds);

  if (error) throw error;
  return data.signedUrl;
}

/**
 * Eliminar un archivo del bucket usuarios-adjuntos.
 *
 * @param {string} path - Path del archivo en Storage
 */
export async function deletePostulacionFile(path) {
  const supabase = getSupabase();
  const { error } = await supabase.storage
    .from(BUCKET_USUARIOS)
    .remove([path]);

  if (error) throw error;
  return { deleted: true };
}

// ============================================
// Requisitos Docentes (biblioteca de documentos) - bucket usuarios-adjuntos
// Tabla: REQUISITOS_DOCENTES
// ============================================

/**
 * Subir un documento/plantilla a la biblioteca de requisitos docentes.
 * Path: requisitos/{idRequisito}/{timestamp}-{filename}
 *
 * @param {Buffer} fileBuffer
 * @param {string} filename
 * @param {string} contentType
 * @param {number} idRequisito
 * @returns {Promise<{ path: string, filename: string, contentType: string, size: number }>}
 */
export async function uploadRequisitoFile(fileBuffer, filename, contentType, idRequisito) {
  const supabase = getSupabase();
  const timestamp = Date.now();
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `requisitos/${idRequisito}/${timestamp}-${safeName}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_USUARIOS)
    .upload(path, fileBuffer, {
      contentType,
      upsert: false,
    });

  if (error) throw error;

  return {
    path: data.path,
    filename,
    contentType,
    size: fileBuffer.length,
  };
}

// ============================================
// Documentos de Usuario (DNI, etc.) - bucket usuarios-adjuntos
// ============================================

/**
 * Subir un documento de usuario (DNI, título, certificado, etc.) al bucket usuarios-adjuntos.
 *
 * @param {Buffer} fileBuffer - Contenido del archivo
 * @param {string} filename - Nombre original del archivo
 * @param {string} contentType - MIME type del archivo
 * @param {number} idUsuario - ID del usuario
 * @param {string} tipoDoc - Tipo de documento: 'dni', 'titulo', 'certificado', etc.
 * @returns {Promise<{ path: string, filename: string, contentType: string, size: number }>}
 */
export async function uploadUsuarioDoc(fileBuffer, filename, contentType, idUsuario, tipoDoc = 'dni') {
  const supabase = getSupabase();
  const timestamp = Date.now();
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const safeTipo = String(tipoDoc).replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${safeTipo}/${idUsuario}/${timestamp}-${safeName}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_USUARIOS)
    .upload(path, fileBuffer, {
      contentType,
      upsert: false,
    });

  if (error) throw error;

  return {
    path: data.path,
    filename,
    contentType,
    size: fileBuffer.length,
  };
}

/**
 * Generar una URL firmada para descargar un documento de usuario.
 *
 * @param {string} path - Path del archivo en Storage
 * @param {number} expirySeconds - Segundos de validez (default: 3600 = 1 hora)
 * @returns {Promise<string>} URL firmada
 */
export async function getUsuarioDocUrl(path, expirySeconds = 3600) {
  const supabase = getSupabase();
  const { data, error } = await supabase.storage
    .from(BUCKET_USUARIOS)
    .createSignedUrl(path, expirySeconds);

  if (error) throw error;
  return data.signedUrl;
}

/**
 * Eliminar un documento de usuario del bucket usuarios-adjuntos.
 *
 * @param {string} path - Path del archivo en Storage
 */
export async function deleteUsuarioDoc(path) {
  const supabase = getSupabase();
  const { error } = await supabase.storage
    .from(BUCKET_USUARIOS)
    .remove([path]);

  if (error) throw error;
  return { deleted: true };
}

export default {
  // Correos
  uploadAttachment,
  getAttachmentUrl,
  deleteAttachment,
  // Postulaciones
  uploadPostulacionFile,
  getPostulacionFileUrl,
  deletePostulacionFile,
  // Requisitos Docentes (biblioteca)
  uploadRequisitoFile,
  // Documentos de Usuario (DNI, etc.)
  uploadUsuarioDoc,
  getUsuarioDocUrl,
  deleteUsuarioDoc,
};
