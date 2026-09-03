import { tokenUtils } from '@/shared/utils/tokenUtils';
import { getDniUrl as getUsuarioDniUrl } from '@/features/usuarios/services/usuariosStorageService';

const API_URL = '/api/storage';

/**
 * Tipos de archivo de docente soportados.
 */
export const DOCENTE_ARCHIVO_TIPOS = {
  GRADO_ACADEMICO: 'grado_academico',
  CONSTANCIA_SUNEDU_DRE: 'constancia_sunedu_dre'
};

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
 * Sube un archivo de docente (grado, título, constancia) al bucket usuarios-adjuntos.
 * @param {number} idUsuario - ID del usuario asociado al docente
 * @param {File} file - Archivo a subir
 * @param {string} tipoDoc - Tipo: 'grado_academico' | 'titulo_profesional' | 'constancia_sunedu_dre'
 * @returns {Promise<{ path: string, filename: string, contentType: string, size: number }>}
 */
export async function uploadDocenteFile(idUsuario, file, tipoDoc) {
  const fileBase64 = await fileToBase64(file);
  return requestStorage('upload', {
    domain: 'usuarios',
    id: idUsuario,
    filename: file.name,
    contentType: file.type,
    file: fileBase64,
    tipo: tipoDoc,
  });
}

/**
 * Genera una URL firmada temporal para ver un archivo de docente.
 * @param {string} path - Path del archivo en Storage
 * @param {number} expirySeconds - Segundos de validez (default: 3600 = 1 hora)
 * @returns {Promise<string>} URL firmada
 */
export async function getDocenteFileUrl(path, expirySeconds = 3600) {
  const data = await requestStorage('url', {
    bucket: 'usuarios-adjuntos',
    path,
    expirySeconds,
  });
  return data.url;
}

/**
 * Elimina un archivo de docente del bucket usuarios-adjuntos.
 * @param {string} path - Path del archivo en Storage
 */
export async function deleteDocenteFile(path) {
  return requestStorage('delete', {
    bucket: 'usuarios-adjuntos',
    path,
  });
}

/**
 * Reexporta getDniUrl desde usuariosStorageService para el DNI del docente.
 */
export const getDniUrl = getUsuarioDniUrl;

export default {
  uploadDocenteFile,
  getDocenteFileUrl,
  deleteDocenteFile,
  getDniUrl,
  DOCENTE_ARCHIVO_TIPOS,
};
