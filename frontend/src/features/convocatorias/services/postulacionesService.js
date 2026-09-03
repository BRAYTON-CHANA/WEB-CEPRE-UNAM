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
 * para insertBatch en POSTULACION_DOCUMENTOS.
 *
 * @param {Object} adjuntosData - JSON del input { contextLabel, grupos }
 * @param {number} idPostulacion
 * @returns {Promise<Array<Object>>} filas para POSTULACION_DOCUMENTOS
 */
async function procesarAdjuntosTabla(adjuntosData, idPostulacion) {
  if (!adjuntosData || typeof adjuntosData !== 'object') return [];
  if (!adjuntosData.grupos) return [];

  const filas = [];

  for (const [clasificacion, grupo] of Object.entries(adjuntosData.grupos)) {
    // Un archivo por clasificación
    let archivoPath = null;
    let archivoFilename = null;
    let archivoContentType = null;
    let archivoSize = null;
    let archivoSubidoEn = null;

    if (grupo.archivo) {
      if (grupo.archivo.file instanceof File) {
        const uploaded = await subirArchivoRequisitoPostulacion(
          idPostulacion, clasificacion, 'req', clasificacion, grupo.archivo.file
        );
        archivoPath = uploaded.path;
        archivoFilename = uploaded.filename;
        archivoContentType = uploaded.contentType;
        archivoSize = uploaded.size;
        archivoSubidoEn = grupo.archivo.subidoEn || nowPeruISO();
      } else if (grupo.archivo.path) {
        // Archivo ya subido (edición): conservar metadata
        archivoPath = grupo.archivo.path;
        archivoFilename = grupo.archivo.filename;
        archivoContentType = grupo.archivo.contentType;
        archivoSize = grupo.archivo.size;
        archivoSubidoEn = grupo.archivo.subidoEn || null;
      }
    }

    // NOMBRE: snapshot del nombre de la clasificación (VARCHAR(200)).
    // Los nombres de los documentos informativos individuales no se almacenan
    // aquí porque pueden exceder el límite de 200 caracteres al concatenarlos;
    // además, el schema define NOMBRE como snapshot de la CLASIFICACION.
    const nombreSnapshot = clasificacion;

    filas.push({
      ID_POSTULACION: idPostulacion,
      CLASIFICACION: clasificacion,
      TIPO: 'req',
      NOMBRE: nombreSnapshot,
      OBLIGATORIO: grupo.obligatorio ?? false,
      PLANTILLA_RUTA: null,
      PLANTILLA_FILENAME: null,
      ARCHIVO_PATH: archivoPath,
      ARCHIVO_FILENAME: archivoFilename,
      ARCHIVO_CONTENT_TYPE: archivoContentType,
      ARCHIVO_SIZE: archivoSize,
      ARCHIVO_SUBIDO_EN: archivoSubidoEn,
    });
  }

  return filas;
}

/**
 * Procesa PREGUNTAS_DATA y construye un array de filas
 * para insertBatch en POSTULACION_RESPUESTAS.
 *
 * @param {Object} preguntasData - { contextLabel, grupos: { [clas]: { preguntas: [...] } } }
 * @param {number} idPostulacion
 * @returns {Array<Object>} filas para POSTULACION_RESPUESTAS
 */
function procesarRespuestasTabla(preguntasData, idPostulacion) {
  if (!preguntasData || typeof preguntasData !== 'object') return [];
  if (!preguntasData.grupos) return [];

  const filas = [];
  for (const [clas, grupo] of Object.entries(preguntasData.grupos)) {
    for (const p of (grupo.preguntas || [])) {
      filas.push({
        ID_POSTULACION: idPostulacion,
        CLASIFICACION: clas,
        TIPO: 'req',
        ID_PREGUNTA: p.id ?? p.idPregunta ?? null,
        NOMBRE: p.nombre,
        OBLIGATORIO: !!p.obligatorio,
        TIPO_RESPUESTA: p.tipoRespuesta || 'texto',
        OPCIONES: p.opciones ? JSON.stringify(p.opciones) : null,
        RESPUESTA: p.respuesta ?? null,
      });
    }
  }

  return filas;
}

/**
 * Carga las respuestas de una postulación desde POSTULACION_RESPUESTAS
 * y reconstruye el JSON que espera el PredefinedQuestionsInput en modo edit.
 *
 * @param {number} idPostulacion
 * @param {string|null} contextLabel - condición laboral snapshot (de POSTULACION_PLAZA)
 * @returns {Promise<{ contextLabel: string|null, grupos: Object } | null>}
 */
export async function loadRespuestasPostulacion(idPostulacion, contextLabel = null) {
  if (!idPostulacion) return null;
  const filas = await db.select('POSTULACION_RESPUESTAS', { ID_POSTULACION: idPostulacion });
  if (!filas || filas.length === 0) return null;

  const grupos = {};
  for (const f of filas) {
    const clas = f.CLASIFICACION;
    if (!grupos[clas]) grupos[clas] = { preguntas: [] };
    let opciones = f.OPCIONES;
    if (typeof opciones === 'string') {
      try { opciones = JSON.parse(opciones); } catch { opciones = null; }
    }
    grupos[clas].preguntas.push({
      id: f.ID_PREGUNTA,
      nombre: f.NOMBRE,
      obligatorio: !!f.OBLIGATORIO,
      tipoRespuesta: f.TIPO_RESPUESTA,
      opciones,
      respuesta: f.RESPUESTA
    });
  }

  return { contextLabel, grupos };
}

/**
 * Carga los adjuntos de una postulación desde POSTULACION_DOCUMENTOS
 * y reconstruye el JSON que espera el PredefinedFilesInput en modo edit.
 *
 * @param {number} idPostulacion
 * @param {string|null} contextLabel - condición laboral snapshot (de POSTULACION_PLAZA)
 * @returns {Promise<{ contextLabel: string|null, grupos: Object } | null>}
 */
export async function loadAdjuntosPostulacion(idPostulacion, contextLabel = null) {
  if (!idPostulacion) return null;
  const filas = await db.select('POSTULACION_DOCUMENTOS', { ID_POSTULACION: idPostulacion });
  if (!filas || filas.length === 0) return null;

  const grupos = {};
  for (const f of filas) {
    const clas = f.CLASIFICACION;

    const archivo = f.ARCHIVO_PATH ? {
      path: f.ARCHIVO_PATH,
      filename: f.ARCHIVO_FILENAME,
      contentType: f.ARCHIVO_CONTENT_TYPE,
      size: f.ARCHIVO_SIZE,
      subidoEn: f.ARCHIVO_SUBIDO_EN,
    } : null;

    // Nueva estructura: un archivo por clasificación
    grupos[clas] = {
      documentos: [], // No se reconstruyen los documentos informativos desde el snapshot
      obligatorio: !!f.OBLIGATORIO,
      archivo
    };
  }

  return { contextLabel, grupos };
}

/**
 * Crea una postulación y persiste los adjuntos en POSTULACION_DOCUMENTOS.
 * @param {Object} data - Datos limpios del formulario (sin ADJUNTOS_DATA).
 * @param {Object} formData - FormData con campos ignoreField (incluye ADJUNTOS_DATA).
 */
export async function createPostulacion(data, formData) {
  // Validar obligatorios pendientes antes de insertar
  const adjuntosData = formData?.ADJUNTOS_DATA;
  if (adjuntosData?.grupos) {
    const faltantes = [];
    for (const [clas, g] of Object.entries(adjuntosData.grupos)) {
      if (g.obligatorio && !g.archivo) {
        faltantes.push(clas);
      }
    }
    if (faltantes.length > 0) {
      throw new Error(`Documentos obligatorios pendientes: ${faltantes.join(', ')}`);
    }
  }

  // Validar preguntas obligatorias
  const preguntasData = formData?.PREGUNTAS_DATA;
  if (preguntasData?.grupos) {
    const faltantesPreg = [];
    for (const [clas, g] of Object.entries(preguntasData.grupos)) {
      for (const p of (g.preguntas || [])) {
        if (p.obligatorio && (p.respuesta === null || p.respuesta === undefined || p.respuesta === '')) {
          faltantesPreg.push(`${clas} → ${p.nombre}`);
        }
      }
    }
    if (faltantesPreg.length > 0) {
      throw new Error(`Preguntas obligatorias sin responder: ${faltantesPreg.join(', ')}`);
    }
  }

  const payload = {
    ...data,
    FECHA_POSTULACION: nowPeruISO(),
    APTO: false,
    ACTIVO: true,
  };

  // Snapshot de condición laboral para contextualizar adjuntos sin reconsultar
  if (adjuntosData?.contextLabel || adjuntosData?.condicionLaboral) {
    payload.SNAP_CONDICION_LABORAL = adjuntosData.contextLabel || adjuntosData.condicionLaboral;
  }

  // En el nuevo modelo, la postulación se asocia a una convocatoria_curso,
  // En el nuevo modelo, la postulación se asocia a una convocatoria_curso,
  // no a una plaza individual. La asignación de plaza se hace desde PLAZA_DOCENTE.
  delete payload.ID_PLAZA_DOCENTE;

  const insertResult = await db.insert('POSTULACION_PLAZA', payload);

  const record = Array.isArray(insertResult) ? insertResult[0] : insertResult;
  const id = record?.ID_POSTULACION;
  if (!id) throw new Error('No se pudo obtener el ID de la postulación creada');

  // Procesar ADJUNTOS_DATA → subir archivos + insertar filas en POSTULACION_DOCUMENTOS
  if (adjuntosData && adjuntosData.grupos) {
    const filas = await procesarAdjuntosTabla(adjuntosData, id);
    if (filas.length > 0) {
      await db.insertBatch('POSTULACION_DOCUMENTOS', filas);
    }
  }

  // Procesar PREGUNTAS_DATA → insertar filas en POSTULACION_RESPUESTAS
  if (preguntasData && preguntasData.grupos) {
    const filasResp = procesarRespuestasTabla(preguntasData, id);
    if (filasResp.length > 0) {
      await db.insertBatch('POSTULACION_RESPUESTAS', filasResp);
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

  // Validar obligatorios pendientes (por clasificación)
  const faltantes = [];
  for (const [clas, g] of Object.entries(adjuntosData.grupos)) {
    if (g.obligatorio && !g.archivo) {
      faltantes.push(clas);
    }
  }
  if (faltantes.length > 0) {
    throw new Error(`Documentos obligatorios pendientes: ${faltantes.join(', ')}`);
  }

  // Eliminar filas anteriores
  await db.delete('POSTULACION_DOCUMENTOS', idPostulacion, 'ID_POSTULACION');

  // Insertar nuevas
  const filas = await procesarAdjuntosTabla(adjuntosData, idPostulacion);
  if (filas.length > 0) {
    await db.insertBatch('POSTULACION_DOCUMENTOS', filas);
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
    FECHA_POSTULACION: nowPeruISO(),
    APTO: false,
    ACTIVO: true,
  }));

  await db.insertBatch('POSTULACION_PLAZA', payload);

  return { success: true, count: nuevos.length, message: `${nuevos.length} docentes cargados` };
}

/**
 * Copia un archivo dentro del bucket usuarios-adjuntos via el endpoint 'copy' de /api/storage.
 * @param {string} sourcePath - Path origen
 * @param {string} destPath - Path destino
 * @returns {Promise<{ path: string, filename: string }>}
 */
async function copyStorageFile(sourcePath, destPath) {
  const token = tokenUtils.getToken();
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ action: 'copy', sourcePath, destPath }),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.message || 'Error copiando archivo en storage');
  return result.data;
}

/**
 * Copia los archivos del docente/usuario a la carpeta snapshot de la postulación.
 * Path destino: postulaciones/{idPostulacion}/snapshot/{tipo}/{timestamp}-{filename}
 *
 * @param {number} idPostulacion
 * @param {Object} paths - { dni, grado, titulo, constancia } (paths originales en usuarios-adjuntos)
 * @returns {Promise<Object>} - { SNAP_DNI_STORAGE_PATH, SNAP_DNI_FILENAME, ... }
 */
export async function copiarArchivosSnapshot(idPostulacion, paths = {}) {
  const timestamp = Date.now();
  const result = {};

  const mapping = [
    { key: 'dni',       snapPath: 'SNAP_DNI_STORAGE_PATH',                     snapFilename: 'SNAP_DNI_FILENAME',                     subfolder: 'dni' },
    { key: 'grado',     snapPath: 'SNAP_GRADO_ACADEMICO_STORAGE_PATH',         snapFilename: 'SNAP_GRADO_ACADEMICO_FILENAME',         subfolder: 'grado' },
    { key: 'constancia',snapPath: 'SNAP_CONSTANCIA_SUNEDU_DRE_STORAGE_PATH',   snapFilename: 'SNAP_CONSTANCIA_SUNEDU_DRE_FILENAME',   subfolder: 'constancia' },
  ];

  for (const m of mapping) {
    const sourcePath = paths[m.key];
    if (!sourcePath) continue;
    try {
      const originalFilename = sourcePath.split('/').pop() || `archivo-${m.key}`;
      const destPath = `postulaciones/${idPostulacion}/snapshot/${m.subfolder}/${timestamp}-${originalFilename}`;
      const copied = await copyStorageFile(sourcePath, destPath);
      result[m.snapPath] = copied.path;
      result[m.snapFilename] = copied.filename || originalFilename;
    } catch (err) {
      console.error(`[copiarArchivosSnapshot] Error copiando ${m.key}:`, err);
      // No fallar todo el snapshot si un archivo no se puede copiar
    }
  }

  return result;
}

/**
 * Crea una postulación con snapshot completo de datos del docente + usuario.
 * 1. Inserta POSTULACION_PLAZA con datos de texto snapshot.
 * 2. Copia archivos del docente a carpeta snapshot de la postulación.
 * 3. Update POSTULACION_PLAZA con paths de copias.
 * 4. Procesa adjuntos de postulación (requisitos).
 *
 * @param {number} idConvocatoriaCurso
 * @param {number} idDocente
 * @param {Object} snapshotTexto - { SNAP_DNI, SNAP_APELLIDO_PATERNO, ... } (datos de texto)
 * @param {Object} snapshotPaths - { dni, grado, constancia } (paths originales en Storage)
 * @param {Object} adjuntosData - JSON del PredefinedFilesInput
 * @param {Object} preguntasData - JSON del PredefinedQuestionsInput
 * @returns {Promise<Object>} - { success, data }
 */
export async function createPostulacionConDocente(idConvocatoriaCurso, idDocente, snapshotTexto = {}, snapshotPaths = {}, adjuntosData = null, preguntasData = null) {
  // Validar adjuntos obligatorios pendientes antes de insertar
  if (adjuntosData?.grupos) {
    const faltantes = [];
    for (const [clas, g] of Object.entries(adjuntosData.grupos)) {
      if (g.obligatorio && !g.archivo) {
        faltantes.push(clas);
      }
    }
    if (faltantes.length > 0) {
      throw new Error(`Documentos obligatorios pendientes: ${faltantes.join(', ')}`);
    }
  }

  // Validar preguntas obligatorias
  if (preguntasData?.grupos) {
    const faltantesPreg = [];
    for (const [clas, g] of Object.entries(preguntasData.grupos)) {
      for (const p of (g.preguntas || [])) {
        if (p.obligatorio && (p.respuesta === null || p.respuesta === undefined || p.respuesta === '')) {
          faltantesPreg.push(`${clas} → ${p.nombre}`);
        }
      }
    }
    if (faltantesPreg.length > 0) {
      throw new Error(`Preguntas obligatorias sin responder: ${faltantesPreg.join(', ')}`);
    }
  }

  // 1. Insertar POSTULACION_PLAZA con snapshot de texto
  const payload = {
    ID_CONVOCATORIA_CURSO: idConvocatoriaCurso,
    ID_DOCENTE: idDocente,
    FECHA_POSTULACION: nowPeruISO(),
    APTO: false,
    ACTIVO: true,
    ...snapshotTexto,
  };

  // Snapshot de condición laboral
  if (adjuntosData?.contextLabel || adjuntosData?.condicionLaboral) {
    payload.SNAP_CONDICION_LABORAL = adjuntosData.contextLabel || adjuntosData.condicionLaboral;
  }

  const insertResult = await db.insert('POSTULACION_PLAZA', payload);
  const record = Array.isArray(insertResult) ? insertResult[0] : insertResult;
  const idPostulacion = record?.ID_POSTULACION;
  if (!idPostulacion) throw new Error('No se pudo obtener el ID de la postulación creada');

  // 2. Copiar archivos del docente a carpeta snapshot de la postulación
  const archivosSnapshot = await copiarArchivosSnapshot(idPostulacion, snapshotPaths);

  // 3. Update POSTULACION_PLAZA con paths de copias (si se copiaron archivos)
  const pathsToUpdate = Object.keys(archivosSnapshot);
  if (pathsToUpdate.length > 0) {
    await db.update('POSTULACION_PLAZA', idPostulacion, archivosSnapshot, 'ID_POSTULACION');
  }

  // 4. Procesar adjuntos de postulación (documentos)
  if (adjuntosData && adjuntosData.grupos) {
    const filas = await procesarAdjuntosTabla(adjuntosData, idPostulacion);
    if (filas.length > 0) {
      await db.insertBatch('POSTULACION_DOCUMENTOS', filas);
    }
  }

  // 5. Procesar respuestas a preguntas
  if (preguntasData && preguntasData.grupos) {
    const filasResp = procesarRespuestasTabla(preguntasData, idPostulacion);
    if (filasResp.length > 0) {
      await db.insertBatch('POSTULACION_RESPUESTAS', filasResp);
    }
  }

  return { success: true, data: record };
}

/**
 * Crea múltiples postulaciones en batch para el mismo docente.
 * Optimización: en lugar de N × (insert + update + insertBatch + insertBatch)
 * hace 4 llamadas DB totales + storage paralelo.
 *
 * Flujo:
 *  1. insertBatch POSTULACION_PLAZA (todas las filas) → obtiene IDs.
 *  2. insertBatch POSTULACION_RESPUESTAS (todas las respuestas para todas las postulaciones).
 *  3. Paralelo por postulación: copiar snapshot + update paths + subir adjuntos.
 *  4. insertBatch POSTULACION_DOCUMENTOS (todas las filas de todas las postulaciones).
 *
 * @param {number[]} idsCc - Lista de ID_CONVOCATORIA_CURSO (sin duplicados ya postulados).
 * @param {number} idDocente
 * @param {Object} snapshotTexto - { SNAP_DNI, SNAP_APELLIDO_PATERNO, ... }
 * @param {Object} snapshotPaths - { dni, grado, constancia }
 * @param {Object|null} adjuntosData - JSON del PredefinedFilesInput
 * @param {Object|null} preguntasData - JSON del PredefinedQuestionsInput
 * @returns {Promise<{ success: true, count: number, postulaciones: Object[] }>}
 */
export async function createPostulacionesBatch(idsCc, idDocente, snapshotTexto = {}, snapshotPaths = {}, adjuntosData = null, preguntasData = null) {
  if (!idsCc || idsCc.length === 0) {
    return { success: true, count: 0, postulaciones: [] };
  }

  // ── Validar adjuntos obligatorios (una sola vez, son los mismos para todas) ──
  if (adjuntosData?.grupos) {
    const faltantes = [];
    for (const [clas, g] of Object.entries(adjuntosData.grupos)) {
      if (g.obligatorio && !g.archivo) faltantes.push(clas);
    }
    if (faltantes.length > 0) {
      throw new Error(`Documentos obligatorios pendientes: ${faltantes.join(', ')}`);
    }
  }

  // ── Validar preguntas obligatorias (una sola vez) ──
  if (preguntasData?.grupos) {
    const faltantesPreg = [];
    for (const [clas, g] of Object.entries(preguntasData.grupos)) {
      for (const p of (g.preguntas || [])) {
        if (p.obligatorio && (p.respuesta === null || p.respuesta === undefined || p.respuesta === '')) {
          faltantesPreg.push(`${clas} → ${p.nombre}`);
        }
      }
    }
    if (faltantesPreg.length > 0) {
      throw new Error(`Preguntas obligatorias sin responder: ${faltantesPreg.join(', ')}`);
    }
  }

  const fechaPostulacion = nowPeruISO();
  const snapCondicionLaboral = adjuntosData?.contextLabel || adjuntosData?.condicionLaboral || null;

  // ── 1. insertBatch POSTULACION_PLAZA (todas las filas a la vez) ──
  const payloadsPlaza = idsCc.map(idCc => ({
    ID_CONVOCATORIA_CURSO: idCc,
    ID_DOCENTE: idDocente,
    FECHA_POSTULACION: fechaPostulacion,
    APTO: false,
    ACTIVO: true,
    ...snapshotTexto,
    ...(snapCondicionLaboral ? { SNAP_CONDICION_LABORAL: snapCondicionLaboral } : {}),
  }));

  const insertResult = await db.insertBatch('POSTULACION_PLAZA', payloadsPlaza);
  const postulaciones = Array.isArray(insertResult) ? insertResult : [insertResult];
  if (!postulaciones.length) throw new Error('No se pudo crear las postulaciones');

  // Mapear ID_CONVOCATORIA_CURSO → ID_POSTULACION (Supabase no garantiza orden)
  const mapaPostulaciones = {};
  for (const p of postulaciones) {
    if (p.ID_POSTULACION && p.ID_CONVOCATORIA_CURSO != null) {
      mapaPostulaciones[p.ID_CONVOCATORIA_CURSO] = p;
    }
  }

  // ── 2. insertBatch POSTULACION_RESPUESTAS (todas las respuestas para todas las postulaciones) ──
  let totalRespuestas = [];
  if (preguntasData && preguntasData.grupos) {
    for (const p of postulaciones) {
      const idPost = p.ID_POSTULACION;
      if (!idPost) continue;
      const filasResp = procesarRespuestasTabla(preguntasData, idPost);
      totalRespuestas = totalRespuestas.concat(filasResp);
    }
    if (totalRespuestas.length > 0) {
      await db.insertBatch('POSTULACION_RESPUESTAS', totalRespuestas);
    }
  }

  // ── 3. Paralelo por postulación: snapshot copies + update paths + subir adjuntos ──
  const todasFilasDocs = [];
  const trabajosParalelos = postulaciones.map(async (p) => {
    const idPost = p.ID_POSTULACION;
    if (!idPost) return;

    // 3a. Copiar archivos snapshot del docente a la carpeta de la postulación
    const archivosSnapshot = await copiarArchivosSnapshot(idPost, snapshotPaths);

    // 3b. Update POSTULACION_PLAZA con paths de copias (si se copiaron archivos)
    const pathsToUpdate = Object.keys(archivosSnapshot);
    if (pathsToUpdate.length > 0) {
      await db.update('POSTULACION_PLAZA', idPost, archivosSnapshot, 'ID_POSTULACION');
    }

    // 3c. Procesar adjuntos de postulación (sube archivos y devuelve filas)
    if (adjuntosData && adjuntosData.grupos) {
      const filas = await procesarAdjuntosTabla(adjuntosData, idPost);
      // Acumular de forma segura (cada promesa tiene su propio array local)
      for (const f of filas) todasFilasDocs.push(f);
    }
  });
  await Promise.all(trabajosParalelos);

  // ── 4. insertBatch POSTULACION_DOCUMENTOS (todas las filas de todas las postulaciones) ──
  if (todasFilasDocs.length > 0) {
    await db.insertBatch('POSTULACION_DOCUMENTOS', todasFilasDocs);
  }

  return { success: true, count: postulaciones.length, postulaciones };
}
