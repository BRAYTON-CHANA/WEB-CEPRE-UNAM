import { db } from '@/shared/api';
import { tokenUtils } from '@/shared/utils/tokenUtils';

const API_URL = '/api/storage';

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Error leyendo el archivo'));
    reader.readAsDataURL(file);
  });
}

function getFilesFromFormData(formData) {
  if (!formData) return [];
  const archivos = formData.ARCHIVOS;
  if (Array.isArray(archivos)) {
    return archivos.filter((f) => f instanceof File);
  }
  if (archivos instanceof File) return [archivos];
  return [];
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

async function subirArchivoPostulacion(idPostulacion, file) {
  const fileBase64 = await fileToBase64(file);
  const data = await requestStorage('upload', {
    domain: 'postulaciones',
    id: idPostulacion,
    filename: file.name,
    contentType: file.type,
    file: fileBase64,
    tipo: 'anexos',
  });
  return {
    path: data.path,
    filename: data.filename,
    contentType: data.contentType,
    size: data.size ?? file.size,
  };
}

/**
 * Crea una postulación para una plaza y sube los archivos adjuntos.
 * @param {Object} data - Datos limpios del formulario (sin ARCHIVOS).
 */
export async function createPostulacion(data, formData) {
  const payload = {
    ...data,
    FECHA_POSTULACION: new Date().toISOString(),
    ACEPTADO: false,
    CONTRATO_FIRMADO: false,
    ENTREVISTA_REALIZADA: false,
    ACTIVO: true,
    ADJUNTOS: '{}',
  };

  // Limpiar fechas vacías
  if (!payload.FECHA_ENTREVISTA) payload.FECHA_ENTREVISTA = null;

  const insertResult = await db.insert('POSTULACION_PLAZA', payload);

  const record = Array.isArray(insertResult) ? insertResult[0] : insertResult;
  const id = record?.ID_POSTULACION;
  if (!id) throw new Error('No se pudo obtener el ID de la postulación creada');

  const files = getFilesFromFormData(formData);
  if (files.length > 0) {
    const uploaded = await Promise.all(files.map((file) => subirArchivoPostulacion(id, file)));
    const adjuntos = { archivos: uploaded.map((f) => ({ ...f, subidoEn: new Date().toISOString() })) };
    await db.update('POSTULACION_PLAZA', id, { ADJUNTOS: JSON.stringify(adjuntos) }, 'ID_POSTULACION');
  }

  return { success: true, data: record };
}

/**
 * Inserta postulaciones para todos los docentes activos que aún no postulan a la plaza.
 * @param {number} idPlazaDocente
 */
export async function cargarTodosLosDocentes(idPlazaDocente) {
  const [docentes, existentes] = await Promise.all([
    db.select('VW_DOCENTES', { ACTIVO: true }),
    db.select('POSTULACION_PLAZA', { ID_PLAZA_DOCENTE: idPlazaDocente }),
  ]);

  const existentesIds = new Set(existentes.map((p) => p.ID_DOCENTE));
  const nuevos = (docentes || []).filter((d) => !existentesIds.has(d.ID_DOCENTE));

  if (nuevos.length === 0) {
    return { success: true, count: 0, message: 'No hay docentes nuevos para cargar' };
  }

  const payload = nuevos.map((d) => ({
    ID_PLAZA_DOCENTE: idPlazaDocente,
    ID_DOCENTE: d.ID_DOCENTE,
    ESTADO: 'postulado',
    FECHA_POSTULACION: new Date().toISOString(),
    ACEPTADO: false,
    CONTRATO_FIRMADO: false,
    ENTREVISTA_REALIZADA: false,
    ACTIVO: true,
    ADJUNTOS: '{}',
  }));

  await db.insertBatch('POSTULACION_PLAZA', payload);

  return { success: true, count: nuevos.length, message: `${nuevos.length} docentes cargados` };
}
