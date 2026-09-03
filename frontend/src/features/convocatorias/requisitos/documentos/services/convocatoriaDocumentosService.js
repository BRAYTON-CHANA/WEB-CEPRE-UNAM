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

async function subirArchivoDocumento(idDocumento, file) {
  const fileBase64 = await fileToBase64(file);
  const data = await requestStorage('upload', {
    domain: 'requisitos',
    id: idDocumento,
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
 * @param {number} idDocumento
 * @param {File} file
 * @returns {Promise<{path, filename, contentType, size}>}
 */
export async function subirArchivoDocumentoInline(idDocumento, file) {
  const { path, filename, contentType, size } = await subirArchivoDocumento(idDocumento, file);
  await db.update('CONVOCATORIA_DOCUMENTOS', idDocumento, {
    STORAGE_PATH: path,
    FILENAME: filename,
    CONTENT_TYPE: contentType,
    TAMAÑO_BYTES: size,
  }, 'ID_DOCUMENTO');
  return { path, filename, contentType, size };
}

/**
 * Crea una clasificación por condición laboral.
 * Inserta una fila en CONVOCATORIA_DOCUMENTOS_CLASIFICACION por cada condición.
 * Valida unicidad (CONDICION_LABORAL + NOMBRE) antes de insertar.
 *
 * @param {Object} data - { CONDICION_LABORAL, NOMBRE, OBLIGATORIO, ACTIVO }
 * @returns {Promise<{success: boolean, data: Array}>}
 */
export async function createClasificacion(data) {
  const { CONDICION_LABORAL, NOMBRE, OBLIGATORIO = false, ACTIVO = true } = data;
  if (!CONDICION_LABORAL || !NOMBRE) {
    throw new Error('Condición laboral y nombre son obligatorios');
  }
  const insertResult = await db.insert('CONVOCATORIA_DOCUMENTOS_CLASIFICACION', {
    CONDICION_LABORAL,
    NOMBRE,
    OBLIGATORIO,
    ACTIVO
  });
  const record = Array.isArray(insertResult) ? insertResult[0] : insertResult;
  return { success: true, data: record };
}

/**
 * Crea un documento docente (dos tablas, FK invertido):
 *  1. Busca la clasificación en CONVOCATORIA_DOCUMENTOS_CLASIFICACION
 *     por (CONDICION_LABORAL + NOMBRE).
 *  2. Inserta el documento en CONVOCATORIA_DOCUMENTOS con FK ID_CLASIFICACION + ORDEN.
 *  3. Sube archivo si existe.
 *
 * @param {Object} data - { CONDICION_LABORAL, CLASIFICACION, NOMBRE, DESCRIPCION, OBLIGATORIO, ACTIVO, ORDEN, _clasificacionesRecords }
 */
export async function createDocumento(data, _id, formData) {
  const condicionLaboral = data.CONDICION_LABORAL;
  const nombreClasificacion = data.CLASIFICACION;
  const clasificacionesRecords = data._clasificacionesRecords || [];

  // 1. Buscar clasificación existente por (condición + nombre)
  let clasificacion = clasificacionesRecords.find(
    c => c.CONDICION_LABORAL === condicionLaboral && c.NOMBRE === nombreClasificacion
  );

  // Si no existe, crearla
  if (!clasificacion) {
    const clasifResult = await db.insert('CONVOCATORIA_DOCUMENTOS_CLASIFICACION', {
      CONDICION_LABORAL: condicionLaboral,
      NOMBRE: nombreClasificacion,
      OBLIGATORIO: data.OBLIGATORIO ?? false,
      ACTIVO: true
    });
    clasificacion = Array.isArray(clasifResult) ? clasifResult[0] : clasifResult;
  }

  const idClasificacion = clasificacion?.ID_CLASIFICACION;
  if (!idClasificacion) throw new Error('No se pudo obtener el ID de la clasificación');

  // 2. Calcular ORDEN desde la BD (máximo ORDEN + 1 dentro de la clasificación)
  const existingDocs = await db.select('VW_CONVOCATORIA_DOCUMENTOS', { ID_CLASIFICACION: idClasificacion });
  const maxOrden = (Array.isArray(existingDocs) ? existingDocs : [])
    .reduce((max, r) => Math.max(max, Number(r.ORDEN ?? 0)), 0);
  const orden = maxOrden + 1;

  // 3. Insertar documento con FK + ORDEN
  const insertResult = await db.insert('CONVOCATORIA_DOCUMENTOS', {
    ID_CLASIFICACION: idClasificacion,
    NOMBRE: data.NOMBRE,
    DESCRIPCION: data.DESCRIPCION || null,
    ORDEN: orden,
    ACTIVO: data.ACTIVO ?? true
  });
  const record = Array.isArray(insertResult) ? insertResult[0] : insertResult;
  const id = record?.ID_DOCUMENTO;

  if (!id) throw new Error('No se pudo obtener el ID del documento creado');

  // 4. Subir archivo si existe
  const file = getFileFromFormData(formData);
  if (file) {
    const { path, filename, contentType, size } = await subirArchivoDocumento(id, file);
    await db.update('CONVOCATORIA_DOCUMENTOS', id, {
      STORAGE_PATH: path,
      FILENAME: filename,
      CONTENT_TYPE: contentType,
      TAMAÑO_BYTES: size,
    }, 'ID_DOCUMENTO');
  }

  return { success: true, data: record };
}

/**
 * Actualiza un documento docente, reemplaza el archivo si se seleccionó uno nuevo.
 */
export async function updateDocumento(id, data, formData, originalRecord) {
  await db.update('CONVOCATORIA_DOCUMENTOS', id, data, 'ID_DOCUMENTO');

  const file = getFileFromFormData(formData);
  if (file) {
    const { path, filename, contentType, size } = await subirArchivoDocumento(id, file);
    await db.update('CONVOCATORIA_DOCUMENTOS', id, {
      STORAGE_PATH: path,
      FILENAME: filename,
      CONTENT_TYPE: contentType,
      TAMAÑO_BYTES: size,
    }, 'ID_DOCUMENTO');
  }

  return { success: true, data: originalRecord };
}

/**
 * Genera URL firmada temporal para descargar el archivo asociado.
 */
export async function getDocumentoUrl(path) {
  const data = await requestStorage('url', { bucket: 'usuarios-adjuntos', path });
  return data.url;
}

/**
 * Calcula el siguiente ORDEN para una clasificación (condición + nombre).
 * Busca el máximo ORDEN existente en tableRecords para esa combinación y retorna +1.
 *
 * @param {Array} tableRecords - records de VW_CONVOCATORIA_DOCUMENTOS
 * @param {string} condicionLaboral - 'CONTRATADO' | 'EXTERNO' | 'ORDINARIO'
 * @param {string} clasificacion - nombre de la clasificación
 * @returns {number} siguiente ORDEN disponible
 */
export function getNextOrdenForDocumento(tableRecords, condicionLaboral, clasificacion) {
  const maxOrden = (tableRecords || [])
    .filter(r => r.CONDICION_LABORAL === condicionLaboral && r.CLASIFICACION === clasificacion)
    .reduce((max, r) => Math.max(max, Number(r.ORDEN ?? 0)), 0);
  return maxOrden + 1;
}

/**
 * Loader para PredefinedFilesInput: carga los documentos predefinidos de un docente
 * según su CONDICION_LABORAL, agrupados por CLASIFICACION.
 *
 * @param {Object} formData - Datos del formulario (debe incluir ID_DOCENTE).
 * @returns {Promise<{ contextLabel: string, grupos: Object } | null>}
 */
export async function loadDocumentosForDocente(formData) {
  // Aceptar CONDICION_LABORAL directamente (modo crear) o consultar DOCENTES (modo seleccionar)
  let cond = formData?.CONDICION_LABORAL;
  const idDocente = formData?.ID_DOCENTE;

  if (!cond && idDocente) {
    const docente = await db.getById('DOCENTES', idDocente, 'ID_DOCENTE');
    cond = docente?.CONDICION_LABORAL || docente?.condicion_laboral;
  }

  if (!cond) return null;

  // Cargar clasificaciones por condición laboral
  const clasificaciones = await db.select('VW_CONVOCATORIA_DOCUMENTOS_CLASIFICACION', { CONDICION_LABORAL: cond, ACTIVO: true });
  // Cargar documentos (plantillas instructivas)
  const documentos = await db.select('VW_CONVOCATORIA_DOCUMENTOS', { CONDICION_LABORAL: cond, ACTIVO: true });

  const grupos = {};
  // Inicializar cada clasificación
  for (const c of clasificaciones) {
    const clas = c.NOMBRE;
    if (!grupos[clas]) {
      grupos[clas] = {
        idClasificacion: c.ID_CLASIFICACION,
        documentos: [],
        obligatorio: !!c.OBLIGATORIO,
        archivo: null
      };
    }
  }
  // Asignar documentos a su clasificación (informativos/plantillas)
  for (const d of documentos) {
    const clas = d.CLASIFICACION;
    if (!grupos[clas]) continue; // safety
    grupos[clas].documentos.push({
      id: d.ID_DOCUMENTO,
      nombre: d.NOMBRE,
      descripcion: d.DESCRIPCION || null,
      orden: Number(d.ORDEN ?? 0),
      plantilla: d.STORAGE_PATH
        ? { rutaPlantilla: d.STORAGE_PATH, filename: d.FILENAME || d.STORAGE_PATH.split('/').pop() }
        : null
    });
  }

  return { contextLabel: cond, grupos };
}

/**
 * Intercambia el ORDEN de dos documentos respetando la restricción
 * UNIQUE ("ID_CLASIFICACION", "ORDEN") en CONVOCATORIA_DOCUMENTOS.
 * Estrategia de 3 pasos con valor temporal:
 *   1. A -> ORDEN = 999999 (temporal)
 *   2. B -> ORDEN = A.ORDEN
 *   3. A -> ORDEN = B.ORDEN
 *
 * @param {Object} documentoA - registro de vista (tiene ID_DOCUMENTO y ORDEN)
 * @param {Object} documentoB - registro adyacente (tiene ID_DOCUMENTO y ORDEN)
 * @param {Function} [onError] - callback opcional para reportar errores
 * @returns {Promise<boolean>} true si tuvo exito
 */
export async function swapOrdenDocumentos(documentoA, documentoB, onError) {
  if (!documentoA?.ID_DOCUMENTO || !documentoB?.ID_DOCUMENTO) return false;
  if (documentoA.ORDEN === documentoB.ORDEN) return true;
  try {
    await db.update('CONVOCATORIA_DOCUMENTOS', documentoA.ID_DOCUMENTO, { ORDEN: 999999 }, 'ID_DOCUMENTO');
    await db.update('CONVOCATORIA_DOCUMENTOS', documentoB.ID_DOCUMENTO, { ORDEN: documentoA.ORDEN }, 'ID_DOCUMENTO');
    await db.update('CONVOCATORIA_DOCUMENTOS', documentoA.ID_DOCUMENTO, { ORDEN: documentoB.ORDEN }, 'ID_DOCUMENTO');
    return true;
  } catch (err) {
    console.error('[swapOrdenDocumentos] Error:', err);
    onError?.(err);
    return false;
  }
}
