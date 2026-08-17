import { db } from '@/shared/api';
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

function getFileFromFormData(formData) {
  if (!formData) return null;
  const archivo = formData.ARCHIVO;
  if (Array.isArray(archivo) && archivo.length > 0) return archivo[0];
  if (archivo instanceof File) return archivo;
  return null;
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

async function subirArchivoRequisito(idRequisito, file) {
  const fileBase64 = await fileToBase64(file);
  const data = await requestStorage('upload', {
    domain: 'requisitos',
    id: idRequisito,
    filename: file.name,
    contentType: file.type,
    file: fileBase64,
  });
  return {
    path: data.path,
    filename: data.filename,
    contentType: data.contentType,
    size: data.size ?? file.size,
  };
}

/**
 * Wrapper para FileEditableCell: sube el archivo y actualiza metadatos en BD.
 * @param {number} idRequisito
 * @param {File} file
 * @returns {Promise<{path, filename, contentType, size}>}
 */
export async function subirArchivoRequisitoInline(idRequisito, file) {
  const { path, filename, contentType, size } = await subirArchivoRequisito(idRequisito, file);
  await db.update('REQUISITOS_DOCENTES', idRequisito, {
    STORAGE_PATH: path,
    FILENAME: filename,
    CONTENT_TYPE: contentType,
    TAMAÑO_BYTES: size,
  }, 'ID_REQUISITO');
  return { path, filename, contentType, size };
}

/**
 * Crea un requisito docente, sube el archivo si existe y actualiza metadatos.
 */
export async function createRequisito(data, _id, formData) {
  const insertResult = await db.insert('REQUISITOS_DOCENTES', data);
  const record = Array.isArray(insertResult) ? insertResult[0] : insertResult;
  const id = record?.ID_REQUISITO;

  if (!id) throw new Error('No se pudo obtener el ID del requisito creado');

  const file = getFileFromFormData(formData);
  if (file) {
    const { path, filename, contentType, size } = await subirArchivoRequisito(id, file);
    await db.update('REQUISITOS_DOCENTES', id, {
      STORAGE_PATH: path,
      FILENAME: filename,
      CONTENT_TYPE: contentType,
      TAMAÑO_BYTES: size,
    }, 'ID_REQUISITO');
  }

  return { success: true, data: record };
}

/**
 * Actualiza un requisito docente, reemplaza el archivo si se seleccionó uno nuevo.
 */
export async function updateRequisito(id, data, formData, originalRecord) {
  await db.update('REQUISITOS_DOCENTES', id, data, 'ID_REQUISITO');

  const file = getFileFromFormData(formData);
  if (file) {
    const { path, filename, contentType, size } = await subirArchivoRequisito(id, file);
    await db.update('REQUISITOS_DOCENTES', id, {
      STORAGE_PATH: path,
      FILENAME: filename,
      CONTENT_TYPE: contentType,
      TAMAÑO_BYTES: size,
    }, 'ID_REQUISITO');
  }

  return { success: true, data: originalRecord };
}

/**
 * Genera URL firmada temporal para descargar el archivo asociado.
 */
export async function getRequisitoUrl(path) {
  const data = await requestStorage('url', { bucket: 'postulaciones-adjuntos', path });
  return data.url;
}

/**
 * Loader para PredefinedFilesInput: carga los requisitos predefinidos de un docente
 * según su CONDICION_LABORAL, agrupados por CLASIFICACION.
 *
 * @param {Object} formData - Datos del formulario (debe incluir ID_DOCENTE).
 * @returns {Promise<{ contextLabel: string, grupos: Object } | null>}
 */
export async function loadRequisitosForDocente(formData) {
  const idDocente = formData?.ID_DOCENTE;
  if (!idDocente) return null;

  const docente = await db.getById('DOCENTES', idDocente, 'ID_DOCENTE');
  const cond = docente?.CONDICION_LABORAL || docente?.condicion_laboral;
  if (!cond) throw new Error('El docente no tiene condición laboral definida');

  const requisitos = await db.select('VW_REQUISITOS_DOCENTES', { CONDICION_LABORAL: cond, ACTIVO: true });

  const grupos = {};
  for (const r of requisitos) {
    const clas = r.CLASIFICACION;
    if (!grupos[clas]) grupos[clas] = { requisitos: [] };
    grupos[clas].requisitos.push({
      id: r.ID_REQUISITO,
      nombre: r.NOMBRE,
      obligatorio: !!r.OBLIGATORIO,
      plantilla: r.STORAGE_PATH
        ? { rutaPlantilla: r.STORAGE_PATH, filename: r.FILENAME || r.STORAGE_PATH.split('/').pop() }
        : null,
      archivo: null
    });
  }

  return { contextLabel: cond, grupos };
}
