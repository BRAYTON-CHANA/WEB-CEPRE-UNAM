import { db } from '@/shared/api';
import { tokenUtils } from '@/shared/utils/tokenUtils';
import { formatDateToISO } from '@/shared/components/form/utils/schemaValidator';

/**
 * Devuelve un timestamp ISO (YYYY-MM-DDTHH:mm:ss) en zona horaria de Peru (America/Lima, UTC-5).
 * Evita el offset de `new Date().toISOString()` que devuelve UTC.
 */
function nowPeruISO() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  }).formatToParts(now);
  const get = (type) => parts.find(p => p.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}`;
}

const API_URL = '/api/storage';

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
 * Sube un archivo de postulación con path estructurado.
 * Path resultante: postulaciones/{idPostulacion}/{clasificacion}/{tipo}-{itemId}-{timestamp}-{safeName}
 */
async function subirArchivoRequisitoPostulacion(idPostulacion, clasificacion, tipo, itemId, file) {
  const fileBase64 = await fileToBase64(file);
  const data = await requestStorage('upload', {
    domain: 'postulaciones',
    id: idPostulacion,
    filename: file.name,
    contentType: file.type,
    file: fileBase64,
    tipo: tipo,
    clasificacion,
    itemId: String(itemId),
  });
  return {
    path: data.path,
    filename: data.filename,
    contentType: data.contentType,
    size: data.size ?? file.size,
  };
}

/**
 * Procesa el objeto ADJUNTOS_DATA del formulario (JSON del PredefinedFilesInput):
 * sube los archivos (File) embebidos y construye un array de filas
 * para insertBatch en POSTULACION_ADJUNTOS.
 *
 * @param {Object} adjuntosData - JSON del input { contextLabel, grupos }
 * @param {number} idPostulacion
 * @returns {Promise<Array<Object>>} filas para POSTULACION_ADJUNTOS
 */
async function procesarAdjuntosTabla(adjuntosData, idPostulacion) {
  if (!adjuntosData || typeof adjuntosData !== 'object') return [];
  if (!adjuntosData.grupos) return [];

  const filas = [];

  for (const [clasificacion, grupo] of Object.entries(adjuntosData.grupos)) {
    // Requisitos predefinidos (tipo = 'req')
    for (const req of (grupo.requisitos || [])) {
      let archivoPath = null;
      let archivoFilename = null;
      let archivoContentType = null;
      let archivoSize = null;
      let archivoSubidoEn = null;

      if (req.archivo) {
        if (req.archivo.file instanceof File) {
          const itemId = req.id ?? req.idRequisito;
          const uploaded = await subirArchivoRequisitoPostulacion(
            idPostulacion, clasificacion, 'req', itemId, req.archivo.file
          );
          archivoPath = uploaded.path;
          archivoFilename = uploaded.filename;
          archivoContentType = uploaded.contentType;
          archivoSize = uploaded.size;
          archivoSubidoEn = req.archivo.subidoEn || nowPeruISO();
        } else if (req.archivo.path) {
          // Archivo ya subido (edición): conservar metadata
          archivoPath = req.archivo.path;
          archivoFilename = req.archivo.filename;
          archivoContentType = req.archivo.contentType;
          archivoSize = req.archivo.size;
          archivoSubidoEn = req.archivo.subidoEn || null;
        }
      }

      filas.push({
        ID_POSTULACION: idPostulacion,
        CLASIFICACION: clasificacion,
        TIPO: 'req',
        ID_REQUISITO: req.id ?? req.idRequisito ?? null,
        NOMBRE: req.nombre,
        OBLIGATORIO: req.obligatorio ?? false,
        PLANTILLA_RUTA: req.plantilla?.rutaPlantilla ?? null,
        PLANTILLA_FILENAME: req.plantilla?.filename ?? null,
        ARCHIVO_PATH: archivoPath,
        ARCHIVO_FILENAME: archivoFilename,
        ARCHIVO_CONTENT_TYPE: archivoContentType,
        ARCHIVO_SIZE: archivoSize,
        ARCHIVO_SUBIDO_EN: archivoSubidoEn,
      });
    }
  }

  return filas;
}

/**
 * Carga los adjuntos de una postulación desde POSTULACION_ADJUNTOS
 * y reconstruye el JSON que espera el PredefinedFilesInput en modo edit.
 *
 * @param {number} idPostulacion
 * @param {string|null} contextLabel - condición laboral snapshot (de POSTULACION_PLAZA)
 * @returns {Promise<{ contextLabel: string|null, grupos: Object } | null>}
 */
export async function loadAdjuntosPostulacion(idPostulacion, contextLabel = null) {
  if (!idPostulacion) return null;
  const filas = await db.select('POSTULACION_ADJUNTOS', { ID_POSTULACION: idPostulacion });
  if (!filas || filas.length === 0) return null;

  const grupos = {};
  for (const f of filas) {
    const clas = f.CLASIFICACION;
    if (!grupos[clas]) grupos[clas] = { requisitos: [] };

    const archivo = f.ARCHIVO_PATH ? {
      path: f.ARCHIVO_PATH,
      filename: f.ARCHIVO_FILENAME,
      contentType: f.ARCHIVO_CONTENT_TYPE,
      size: f.ARCHIVO_SIZE,
      subidoEn: f.ARCHIVO_SUBIDO_EN,
    } : null;

    grupos[clas].requisitos.push({
      id: f.ID_REQUISITO,
      nombre: f.NOMBRE,
      obligatorio: f.OBLIGATORIO,
      plantilla: (f.PLANTILLA_RUTA || f.PLANTILLA_FILENAME) ? {
        rutaPlantilla: f.PLANTILLA_RUTA,
        filename: f.PLANTILLA_FILENAME,
      } : null,
      archivo,
    });
  }

  return { contextLabel, grupos };
}

/**
 * Crea una postulación y persiste los adjuntos en POSTULACION_ADJUNTOS.
 * @param {Object} data - Datos limpios del formulario (sin ADJUNTOS_DATA).
 * @param {Object} formData - FormData con campos ignoreField (incluye ADJUNTOS_DATA).
 */
export async function createPostulacion(data, formData) {
  // Validar obligatorios pendientes antes de insertar
  const adjuntosData = formData?.ADJUNTOS_DATA;
  if (adjuntosData?.grupos) {
    const faltantes = [];
    for (const [clas, g] of Object.entries(adjuntosData.grupos)) {
      for (const r of (g.requisitos || [])) {
        if (r.obligatorio && !r.archivo) {
          faltantes.push(`${clas} → ${r.nombre}`);
        }
      }
    }
    if (faltantes.length > 0) {
      throw new Error(`Documentos obligatorios pendientes: ${faltantes.join(', ')}`);
    }
  }

  const payload = {
    ...data,
    FECHA_POSTULACION: nowPeruISO(),
    ACEPTADO: false,
    CONTRATO_FIRMADO: false,
    ENTREVISTA_REALIZADA: false,
    ACTIVO: true,
  };

  // Snapshot de condición laboral para contextualizar adjuntos sin reconsultar
  if (adjuntosData?.contextLabel || adjuntosData?.condicionLaboral) {
    payload.CONDICION_LABORAL_SNAPSHOT = adjuntosData.contextLabel || adjuntosData.condicionLaboral;
  }

  // Convertir fechas DD/MM/YYYY a YYYY-MM-DD (Postgres espera ISO)
  if (payload.FECHA_ENTREVISTA) {
    payload.FECHA_ENTREVISTA = formatDateToISO(payload.FECHA_ENTREVISTA);
  }

  // Limpiar fechas vacías
  if (!payload.FECHA_ENTREVISTA) payload.FECHA_ENTREVISTA = null;

  // En el nuevo modelo, la postulación se asocia a una convocatoria_curso,
  // no a una plaza individual. ID_PLAZA_DOCENTE se asigna después al aceptar.
  delete payload.ID_PLAZA_DOCENTE;

  const insertResult = await db.insert('POSTULACION_PLAZA', payload);

  const record = Array.isArray(insertResult) ? insertResult[0] : insertResult;
  const id = record?.ID_POSTULACION;
  if (!id) throw new Error('No se pudo obtener el ID de la postulación creada');

  // Procesar ADJUNTOS_DATA → subir archivos + insertar filas en POSTULACION_ADJUNTOS
  if (adjuntosData && adjuntosData.grupos) {
    const filas = await procesarAdjuntosTabla(adjuntosData, id);
    if (filas.length > 0) {
      await db.insertBatch('POSTULACION_ADJUNTOS', filas);
    }
  }

  return { success: true, data: record };
}

/**
 * Actualiza los adjuntos de una postulación existente.
 * Elimina las filas anteriores y reinserta con los datos del formulario.
 * @param {number} idPostulacion
 * @param {Object} formData - FormData con ADJUNTOS_DATA
 */
export async function updateAdjuntosPostulacion(idPostulacion, formData) {
  const adjuntosData = formData?.ADJUNTOS_DATA;
  if (!adjuntosData || !adjuntosData.grupos) return;

  // Validar obligatorios pendientes
  const faltantes = [];
  for (const [clas, g] of Object.entries(adjuntosData.grupos)) {
    for (const r of (g.requisitos || [])) {
      if (r.obligatorio && !r.archivo) {
        faltantes.push(`${clas} → ${r.nombre}`);
      }
    }
  }
  if (faltantes.length > 0) {
    throw new Error(`Documentos obligatorios pendientes: ${faltantes.join(', ')}`);
  }

  // Eliminar filas anteriores
  await db.delete('POSTULACION_ADJUNTOS', idPostulacion, 'ID_POSTULACION');

  // Insertar nuevas
  const filas = await procesarAdjuntosTabla(adjuntosData, idPostulacion);
  if (filas.length > 0) {
    await db.insertBatch('POSTULACION_ADJUNTOS', filas);
  }
}

/**
 * Inserta postulaciones para todos los docentes activos que aún no postulan a la convocatoria_curso.
 * @param {number} idConvocatoriaCurso
 */
export async function cargarTodosLosDocentes(idConvocatoriaCurso) {
  const [docentes, existentes] = await Promise.all([
    db.select('VW_DOCENTES', { ACTIVO: true }),
    db.select('POSTULACION_PLAZA', { ID_CONVOCATORIA_CURSO: idConvocatoriaCurso }),
  ]);

  const existentesIds = new Set(existentes.map((p) => p.ID_DOCENTE));
  const nuevos = (docentes || []).filter((d) => !existentesIds.has(d.ID_DOCENTE));

  if (nuevos.length === 0) {
    return { success: true, count: 0, message: 'No hay docentes nuevos para cargar' };
  }

  const payload = nuevos.map((d) => ({
    ID_CONVOCATORIA_CURSO: idConvocatoriaCurso,
    ID_DOCENTE: d.ID_DOCENTE,
    ESTADO: 'postulado',
    FECHA_POSTULACION: nowPeruISO(),
    ACEPTADO: false,
    CONTRATO_FIRMADO: false,
    ENTREVISTA_REALIZADA: false,
    ACTIVO: true,
  }));

  await db.insertBatch('POSTULACION_PLAZA', payload);

  return { success: true, count: nuevos.length, message: `${nuevos.length} docentes cargados` };
}
