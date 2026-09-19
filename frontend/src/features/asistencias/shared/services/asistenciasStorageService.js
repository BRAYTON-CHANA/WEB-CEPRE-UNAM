import { tokenUtils } from '@/shared/utils/tokenUtils';

const API_URL = '/api/storage';

/**
 * Convierte un File del browser a base64 (Data URL).
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Error leyendo el archivo'));
    reader.readAsDataURL(file);
  });
}

async function requestStorage(action, body) {
  const token = tokenUtils.getToken();
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ action, ...body }),
  });

  const result = await response.json();
  if (!result.success) throw new Error(result.message || 'Error en operación de storage');
  return result.data;
}

/**
 * Sube un archivo de evidencia de una sesión al bucket asistencias.
 * Path resultante: asistencias-docentes/{idSesion}/{timestamp}-{filename}
 * @param {number} idSesion - ID de la sesión agrupada
 * @param {File} file - Archivo a subir (imagen o PDF)
 * @returns {Promise<{ path: string, filename: string, contentType: string, size: number }>}
 */
export async function uploadEvidenciaSesion(idSesion, file) {
  const fileBase64 = await fileToBase64(file);
  return requestStorage('upload', {
    domain: 'asistencias',
    id: idSesion,
    filename: file.name,
    contentType: file.type,
    file: fileBase64,
  });
}

/**
 * Genera una URL firmada temporal para ver la evidencia de una sesión.
 * @param {string} path - Path del archivo en Storage
 * @param {number} expirySeconds - Segundos de validez (default: 3600 = 1 hora)
 * @returns {Promise<string>} URL firmada
 */
export async function getEvidenciaSesionUrl(path, expirySeconds = 3600) {
  const data = await requestStorage('url', {
    bucket: 'asistencias',
    path,
    expirySeconds,
  });
  return data.url;
}

/**
 * Elimina el archivo de evidencia del bucket asistencias.
 * @param {string} path - Path del archivo en Storage
 */
export async function deleteEvidenciaSesion(path) {
  return requestStorage('delete', {
    bucket: 'asistencias',
    path,
  });
}

export default {
  uploadEvidenciaSesion,
  getEvidenciaSesionUrl,
  deleteEvidenciaSesion,
};
