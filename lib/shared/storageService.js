import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const BUCKET_NAME = 'correos-adjuntos';

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL y SUPABASE_SECRET_KEY deben estar configurados');
  }
  return createClient(url, key);
}

/**
 * Subir un archivo a Supabase Storage.
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
    .from(BUCKET_NAME)
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
 * Generar una URL firmada temporal para descargar un archivo.
 *
 * @param {string} path - Path del archivo en Storage
 * @param {number} expirySeconds - Segundos de validez (default: 3600 = 1 hora)
 * @returns {Promise<string>} URL firmada
 */
export async function getAttachmentUrl(path, expirySeconds = 3600) {
  const supabase = getSupabase();
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, expirySeconds);

  if (error) throw error;
  return data.signedUrl;
}

/**
 * Eliminar un archivo de Supabase Storage.
 *
 * @param {string} path - Path del archivo en Storage
 */
export async function deleteAttachment(path) {
  const supabase = getSupabase();
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([path]);

  if (error) throw error;
  return { deleted: true };
}

export default { uploadAttachment, getAttachmentUrl, deleteAttachment };
