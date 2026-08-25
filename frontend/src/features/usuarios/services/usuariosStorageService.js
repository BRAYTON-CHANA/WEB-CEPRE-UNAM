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
 * Sube un archivo de DNI al bucket usuarios-adjuntos.
 * @param {number} idUsuario - ID del usuario
 * @param {File} file - Archivo a subir
 * @returns {Promise<{ path: string, filename: string, contentType: string, size: number }>}
 */
export async function uploadDniFile(idUsuario, file) {
  const fileBase64 = await fileToBase64(file);
  return requestStorage('upload', {
    domain: 'usuarios',
    id: idUsuario,
    filename: file.name,
    contentType: file.type,
    file: fileBase64,
    tipo: 'dni',
  });
}

/**
 * Genera una URL firmada temporal para ver el archivo de DNI.
 * @param {string} path - Path del archivo en Storage
 * @param {number} expirySeconds - Segundos de validez (default: 3600 = 1 hora)
 * @returns {Promise<string>} URL firmada
 */
export async function getDniUrl(path, expirySeconds = 3600) {
  const data = await requestStorage('url', {
    bucket: 'usuarios-adjuntos',
    path,
    expirySeconds,
  });
  return data.url;
}

/**
 * Elimina un archivo de DNI del bucket usuarios-adjuntos.
 * @param {string} path - Path del archivo en Storage
 */
export async function deleteDniFile(path) {
  return requestStorage('delete', {
    bucket: 'usuarios-adjuntos',
    path,
  });
}
