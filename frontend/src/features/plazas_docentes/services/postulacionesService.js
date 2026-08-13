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
 *
 * @param {number} idPostulacion
 * @param {string} clasificacion - Nombre del grupo (CV, ANEXOS, Otros, ...)
 * @param {string} tipo - 'req' (requisito predefinido) o 'ext' (extra)
 * @param {string|number} itemId - idRequisito o id del extra
 * @param {File} file
 * @returns {Promise<{ path, filename, contentType, size }>}
 */
async function subirArchivoRequisitoPostulacion(idPostulacion, clasificacion, tipo, itemId, file) {
  const fileBase64 = await fileToBase64(file);
  const data = await requestStorage('upload', {
    domain: 'postulaciones',
    id: idPostulacion,
    filename: file.name,
    contentType: file.type,
    file: fileBase64,
    tipo: tipo, // retrocompat: si backend no usa options, cae a path viejo con tipo
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
 * Procesa el objeto ADJUNTOS_DATA del formulario:
 * sube todos los archivos (File) embebidos en `archivo.file` y los reemplaza
 * por metadata { path, filename, contentType, size, subidoEn }.
 * No muta el original.
 */
async function procesarAdjuntos(adjuntosData, idPostulacion) {
  if (!adjuntosData || typeof adjuntosData !== 'object') return null;
  if (!adjuntosData.grupos) return null;

  const resultado = {
    contextLabel: adjuntosData.contextLabel || adjuntosData.condicionLaboral || null,
    grupos: {}
  };

  for (const [clasificacion, grupo] of Object.entries(adjuntosData.grupos)) {
    const grupoOut = { requisitos: [], extras: [] };

    // Requisitos predefinidos
    for (const req of (grupo.requisitos || [])) {
      let archivo = null;
      if (req.archivo) {
        if (req.archivo.file instanceof File) {
          // Subir archivo nuevo
          const itemId = req.id ?? req.idRequisito;
          const uploaded = await subirArchivoRequisitoPostulacion(
            idPostulacion, clasificacion, 'req', itemId, req.archivo.file
          );
          archivo = {
            path: uploaded.path,
            filename: uploaded.filename,
            contentType: uploaded.contentType,
            size: uploaded.size,
            subidoEn: req.archivo.subidoEn || nowPeruISO()
          };
        } else if (req.archivo.path) {
          // Archivo ya subido (edición): conservar metadata tal cual
          archivo = { ...req.archivo };
          delete archivo.file;
        }
      }
      grupoOut.requisitos.push({
        id: req.id ?? req.idRequisito,
        nombre: req.nombre,
        plantilla: req.plantilla || null, // inmutable, se conserva
        archivo
      });
    }

    // Extras
    for (const ext of (grupo.extras || [])) {
      let archivo = null;
      if (ext.archivo) {
        if (ext.archivo.file instanceof File) {
          const uploaded = await subirArchivoRequisitoPostulacion(
            idPostulacion, clasificacion, 'ext', ext.id, ext.archivo.file
          );
          archivo = {
            path: uploaded.path,
            filename: uploaded.filename,
            contentType: uploaded.contentType,
            size: uploaded.size,
            subidoEn: ext.archivo.subidoEn || nowPeruISO()
          };
        } else if (ext.archivo.path) {
          archivo = { ...ext.archivo };
          delete archivo.file;
        }
      }
      grupoOut.extras.push({
        id: ext.id,
        nombre: ext.nombre,
        archivo
      });
    }

    resultado.grupos[clasificacion] = grupoOut;
  }

  return resultado;
}

/**
 * Crea una postulación para una plaza y sube los archivos adjuntos.
 * @param {Object} data - Datos limpios del formulario (sin ADJUNTOS_DATA).
 * @param {Object} formData - FormData con campos ignoreField (incluye ADJUNTOS_DATA).
 */
export async function createPostulacion(data, formData) {
  const payload = {
    ...data,
    FECHA_POSTULACION: nowPeruISO(),
    ACEPTADO: false,
    CONTRATO_FIRMADO: false,
    ENTREVISTA_REALIZADA: false,
    ACTIVO: true,
    ADJUNTOS: '{}',
  };

  // Convertir fechas DD/MM/YYYY a YYYY-MM-DD (Postgres espera ISO)
  if (payload.FECHA_ENTREVISTA) {
    payload.FECHA_ENTREVISTA = formatDateToISO(payload.FECHA_ENTREVISTA);
  }

  // Limpiar fechas vacías
  if (!payload.FECHA_ENTREVISTA) payload.FECHA_ENTREVISTA = null;

  const insertResult = await db.insert('POSTULACION_PLAZA', payload);

  const record = Array.isArray(insertResult) ? insertResult[0] : insertResult;
  const id = record?.ID_POSTULACION;
  if (!id) throw new Error('No se pudo obtener el ID de la postulación creada');

  // Procesar ADJUNTOS_DATA (subir archivos + armar JSON final)
  const adjuntosData = formData?.ADJUNTOS_DATA;
  if (adjuntosData && adjuntosData.grupos) {
    const adjuntosFinal = await procesarAdjuntos(adjuntosData, id);
    if (adjuntosFinal) {
      await db.update('POSTULACION_PLAZA', id, { ADJUNTOS: JSON.stringify(adjuntosFinal) }, 'ID_POSTULACION');
    }
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
    FECHA_POSTULACION: nowPeruISO(),
    ACEPTADO: false,
    CONTRATO_FIRMADO: false,
    ENTREVISTA_REALIZADA: false,
    ACTIVO: true,
    ADJUNTOS: '{}',
  }));

  await db.insertBatch('POSTULACION_PLAZA', payload);

  return { success: true, count: nuevos.length, message: `${nuevos.length} docentes cargados` };
}
