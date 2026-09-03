import {
  getAttachmentUrl,
  getPostulacionFileUrl,
  getUsuarioDocUrl,
  getAsistenciaDocenteUrl,
  uploadAttachment,
  uploadPostulacionFile,
  uploadRequisitoFile,
  uploadUsuarioDoc,
  uploadAsistenciaDocenteFile,
  deleteAttachment,
  deletePostulacionFile,
  deleteUsuarioDoc,
  deleteAsistenciaDocenteFile,
  copyUsuarioDoc,
} from '../lib/shared/storageService.js';
import { withAuth } from '../lib/middleware/auth.js';
import 'dotenv/config';

const ALLOWED_BUCKETS = ['correos-adjuntos', 'usuarios-adjuntos', 'asistencias'];
const ALLOWED_UPLOAD_DOMAINS = ['correos', 'postulaciones', 'requisitos', 'usuarios', 'asistencias'];

function base64ToBuffer(file) {
  if (typeof file !== 'string') {
    throw new Error('El archivo debe enviarse como base64');
  }

  let base64 = file;
  if (file.includes(',')) {
    base64 = file.split(',')[1];
  }

  return Buffer.from(base64, 'base64');
}

async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { action } = req.body || {};

  try {
    if (action === 'url') {
      const { bucket, path, expirySeconds } = req.body || {};

      if (!bucket || !ALLOWED_BUCKETS.includes(bucket)) {
        return res.status(400).json({ success: false, message: 'bucket no válido' });
      }

      if (!path) {
        return res.status(400).json({ success: false, message: 'path es obligatorio' });
      }

      const url =
        bucket === 'correos-adjuntos'
          ? await getAttachmentUrl(path, expirySeconds || 3600)
          : bucket === 'asistencias'
            ? await getAsistenciaDocenteUrl(path, expirySeconds || 3600)
            : await getUsuarioDocUrl(path, expirySeconds || 3600);

      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.json({ success: true, data: { url } });
      return;
    }

    if (action === 'upload') {
      const { domain, id, filename, contentType, file, tipo, clasificacion, itemId } = req.body || {};

      if (!domain || !ALLOWED_UPLOAD_DOMAINS.includes(domain)) {
        return res.status(400).json({ success: false, message: 'domain no válido' });
      }

      if (!id || !filename || !contentType || !file) {
        return res.status(400).json({
          success: false,
          message: 'id, filename, contentType y file son obligatorios'
        });
      }

      const fileBuffer = base64ToBuffer(file);
      let result;

      if (domain === 'correos') {
        result = await uploadAttachment(fileBuffer, filename, contentType, id);
      } else if (domain === 'postulaciones') {
        // Path estructurado si llegan clasificacion + itemId; legacy en caso contrario
        const options = (clasificacion && itemId) ? { clasificacion, itemId } : {};
        result = await uploadPostulacionFile(fileBuffer, filename, contentType, id, tipo || 'cv', options);
      } else if (domain === 'requisitos') {
        result = await uploadRequisitoFile(fileBuffer, filename, contentType, id);
      } else if (domain === 'usuarios') {
        result = await uploadUsuarioDoc(fileBuffer, filename, contentType, id, tipo || 'dni');
      } else if (domain === 'asistencias') {
        result = await uploadAsistenciaDocenteFile(fileBuffer, filename, contentType, id);
      }

      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.json({ success: true, data: result });
      return;
    }

    if (action === 'delete') {
      const { bucket, path } = req.body || {};

      if (!bucket || !ALLOWED_BUCKETS.includes(bucket)) {
        return res.status(400).json({ success: false, message: 'bucket no válido' });
      }

      if (!path) {
        return res.status(400).json({ success: false, message: 'path es obligatorio' });
      }

      const result =
        bucket === 'correos-adjuntos'
          ? await deleteAttachment(path)
          : bucket === 'asistencias'
            ? await deleteAsistenciaDocenteFile(path)
            : await deleteUsuarioDoc(path);

      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.json({ success: true, data: result });
      return;
    }

    if (action === 'copy') {
      // Copia un archivo dentro del bucket usuarios-adjuntos (server-side).
      // Usado para snapshots de archivos al crear postulaciones.
      const { sourcePath, destPath } = req.body || {};

      if (!sourcePath || !destPath) {
        return res.status(400).json({
          success: false,
          message: 'sourcePath y destPath son obligatorios'
        });
      }

      const result = await copyUsuarioDoc(sourcePath, destPath);

      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.json({ success: true, data: result });
      return;
    }

    return res.status(400).json({
      success: false,
      message: 'action no válida. Use "url", "upload", "delete" o "copy"'
    });
  } catch (error) {
    console.error('[storage] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error procesando la operación de storage'
    });
  }
}

export default withAuth(handler);
