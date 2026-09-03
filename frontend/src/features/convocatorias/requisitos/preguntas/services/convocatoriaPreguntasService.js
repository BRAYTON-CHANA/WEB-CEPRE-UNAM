import { db } from '@/shared/api';

/**
 * Convierte un texto multilinea (una opción por línea) a JSONB array.
 * @param {string} texto
 * @returns {string[]} array de opciones
 */
function parseOpcionesTexto(texto) {
  if (!texto || typeof texto !== 'string') return null;
  const opciones = texto
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  return opciones.length > 0 ? opciones : null;
}

/**
 * Convierte un JSONB array de opciones a texto multilinea.
 * @param {string[]|null} opciones
 * @returns {string}
 */
function opcionesToTexto(opciones) {
  if (!opciones || !Array.isArray(opciones)) return '';
  return opciones.join('\n');
}

/**
 * Normaliza OPCIONES a un array de strings.
 * Acepta string[] (ya parseado por Postgres JSONB), string (JSON), o null.
 * @param {string[]|string|null} opciones
 * @returns {string[]}
 */
function normalizeOpcionesArray(opciones) {
  if (!opciones) return [];
  if (Array.isArray(opciones)) return opciones.map(String);
  if (typeof opciones === 'string') {
    try {
      const parsed = JSON.parse(opciones);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Construye el payload limpio según el TIPO_RESPUESTA.
 * Toma los campos nuevos de formData (ignoreField: true) y los agrega al payload.
 */
export function buildPayloadConRestricciones(payload, formData) {
  const tipoRespuesta = payload.TIPO_RESPUESTA;

  // Campos nuevos desde formData
  const tipoTexto = formData?.TIPO_TEXTO ?? null;
  const minValor = formData?.MIN_VALOR !== undefined && formData?.MIN_VALOR !== '' ? formData?.MIN_VALOR : null;
  const maxValor = formData?.MAX_VALOR !== undefined && formData?.MAX_VALOR !== '' ? formData?.MAX_VALOR : null;
  const maxCaracteres = formData?.MAX_CARACTERES !== undefined && formData?.MAX_CARACTERES !== '' ? formData?.MAX_CARACTERES : null;
  const permiteOtros = formData?.PERMITE_OTROS === true || formData?.PERMITE_OTROS === 'true';
  const modoSeleccion = formData?.MODO_SELECCION || 'unica';

  // OPCIONES: string[] desde StringArrayInput
  const opcionesArray = normalizeOpcionesArray(formData?.OPCIONES);

  // Limpiar según tipo
  if (tipoRespuesta === 'opcion_multiple') {
    payload.OPCIONES = opcionesArray.length > 0 ? JSON.stringify(opcionesArray) : null;
    payload.PERMITE_OTROS = permiteOtros;
    payload.MODO_SELECCION = modoSeleccion;
    // No aplica para opcion_multiple
    payload.TIPO_TEXTO = null;
    payload.MIN_VALOR = null;
    payload.MAX_VALOR = null;
    // MAX_CARACTERES solo si permite otros
    payload.MAX_CARACTERES = permiteOtros ? maxCaracteres : null;
  } else if (tipoRespuesta === 'texto') {
    payload.OPCIONES = null;
    payload.PERMITE_OTROS = false;
    payload.MODO_SELECCION = null;
    payload.TIPO_TEXTO = tipoTexto || 'libre';
    if (tipoTexto === 'entero' || tipoTexto === 'float') {
      payload.MIN_VALOR = minValor;
      payload.MAX_VALOR = maxValor;
      payload.MAX_CARACTERES = null;
    } else {
      // texto libre
      payload.MIN_VALOR = null;
      payload.MAX_VALOR = null;
      payload.MAX_CARACTERES = maxCaracteres;
    }
  } else {
    // si_no u otros
    payload.OPCIONES = null;
    payload.PERMITE_OTROS = false;
    payload.MODO_SELECCION = null;
    payload.TIPO_TEXTO = null;
    payload.MIN_VALOR = null;
    payload.MAX_VALOR = null;
    payload.MAX_CARACTERES = null;
  }

  return payload;
}

/**
 * Crea una pregunta docente.
 * Construye payload con restricciones según TIPO_RESPUESTA.
 */
export async function createPregunta(data, _id, formData) {
  const payload = { ...data };
  // Eliminar campos auxiliares que no van al schema directo
  delete payload.OPCIONES_TEXTO;

  buildPayloadConRestricciones(payload, formData);

  const result = await db.insert('CONVOCATORIA_PREGUNTAS', payload);
  const record = Array.isArray(result) ? result[0] : result;
  return { success: true, data: record };
}

/**
 * Actualiza una pregunta docente.
 * Construye payload con restricciones según TIPO_RESPUESTA.
 */
export async function updatePregunta(id, data, formData, originalRecord) {
  const payload = { ...data };
  delete payload.OPCIONES_TEXTO;

  buildPayloadConRestricciones(payload, formData);

  await db.update('CONVOCATORIA_PREGUNTAS', id, payload, 'ID_PREGUNTA');
  return { success: true, data: originalRecord };
}

/**
 * Loader para PredefinedQuestionsInput: carga las preguntas predefinidas de un docente
 * según su CONDICION_LABORAL, agrupadas en un único grupo 'PREGUNTAS'.
 *
 * @param {Object} formData - Datos del formulario (debe incluir ID_DOCENTE).
 * @returns {Promise<{ contextLabel: string, grupos: Object } | null>}
 */
export async function loadPreguntasForDocente(formData) {
  // Aceptar CONDICION_LABORAL directamente (modo crear) o consultar DOCENTES (modo seleccionar)
  let cond = formData?.CONDICION_LABORAL;
  const idDocente = formData?.ID_DOCENTE;

  if (!cond && idDocente) {
    const docente = await db.getById('DOCENTES', idDocente, 'ID_DOCENTE');
    cond = docente?.CONDICION_LABORAL || docente?.condicion_laboral;
  }

  if (!cond) return null;

  const preguntas = await db.select('VW_CONVOCATORIA_PREGUNTAS', { CONDICION_LABORAL: cond, ACTIVO: true });

  const grupos = { PREGUNTAS: { preguntas: [] } };
  for (const p of preguntas) {
    grupos.PREGUNTAS.preguntas.push({
      id: p.ID_PREGUNTA,
      nombre: p.NOMBRE,
      obligatorio: !!p.OBLIGATORIO,
      tipoRespuesta: p.TIPO_RESPUESTA,
      modoSeleccion: p.MODO_SELECCION || 'unica',
      opciones: p.OPCIONES || null,
      orden: Number(p.ORDEN ?? 0),
      respuesta: null
    });
  }

  return { contextLabel: cond, grupos };
}

export { parseOpcionesTexto, opcionesToTexto, normalizeOpcionesArray };

/**
 * Calcula el siguiente ORDEN para una condición laboral.
 * Busca el máximo ORDEN existente en tableRecords para esa condición y retorna +1.
 *
 * @param {Array} tableRecords - records de VW_CONVOCATORIA_PREGUNTAS
 * @param {string} condicionLaboral - 'CONTRATADO' | 'EXTERNO' | 'ORDINARIO'
 * @returns {number} siguiente ORDEN disponible
 */
export function getNextOrdenForCondicion(tableRecords, condicionLaboral) {
  const maxOrden = (tableRecords || [])
    .filter(r => r.CONDICION_LABORAL === condicionLaboral)
    .reduce((max, r) => Math.max(max, Number(r.ORDEN ?? 0)), 0);
  return maxOrden + 1;
}

/**
 * Mapea un record de VW_CONVOCATORIA_PREGUNTAS a los valores iniciales
 * que espera el formulario de edición inline (PreguntaEditForm).
 *
 * Casos especiales:
 *  - OPCIONES: normaliza a string[] (para StringArrayInput)
 *  - PERMITE_OTROS: bool
 *  - TIPO_TEXTO: default 'libre' si null
 *  - MIN_VALOR / MAX_VALOR / MAX_CARACTERES: null → '' (inputs vacíos)
 *  - ACTIVO: normaliza false/'false'/0 → false, resto → true
 *  - resto: pregunta[name] ?? field.defaultValue ?? ''
 *
 * @param {Object} pregunta - record de VW_CONVOCATORIA_PREGUNTAS
 * @param {Array} fields - lista de definiciones de campos (preguntasFormFields filtrado)
 * @returns {Object} valores iniciales para useFormState
 */
export function mapRecordToFormValues(pregunta, fields) {
  const vals = {};
  fields.forEach(f => {
    const name = f.name;
    if (name === 'OPCIONES') {
      vals[name] = normalizeOpcionesArray(pregunta.OPCIONES);
    } else if (name === 'PERMITE_OTROS') {
      vals[name] = !!pregunta.PERMITE_OTROS;
    } else if (name === 'MODO_SELECCION') {
      vals[name] = pregunta.MODO_SELECCION || 'unica';
    } else if (name === 'TIPO_TEXTO') {
      vals[name] = pregunta.TIPO_TEXTO || 'libre';
    } else if (name === 'MIN_VALOR') {
      vals[name] = pregunta.MIN_VALOR ?? '';
    } else if (name === 'MAX_VALOR') {
      vals[name] = pregunta.MAX_VALOR ?? '';
    } else if (name === 'MAX_CARACTERES') {
      vals[name] = pregunta.MAX_CARACTERES ?? '';
    } else if (name === 'ACTIVO') {
      vals[name] = pregunta.ACTIVO !== false && pregunta.ACTIVO !== 'false' && pregunta.ACTIVO !== 0;
    } else {
      vals[name] = pregunta[name] ?? f.defaultValue ?? '';
    }
  });
  return vals;
}

/**
 * Intercambia el ORDEN de dos preguntas respetando la restricción
 * UNIQUE ("CONDICION_LABORAL", "ORDEN").
 * Estrategia de 3 pasos con valor temporal:
 *   1. A -> ORDEN = 999999 (temporal)
 *   2. B -> ORDEN = A.ORDEN
 *   3. A -> ORDEN = B.ORDEN
 *
 * @param {Object} preguntaA - pregunta a mover (tiene ID_PREGUNTA y ORDEN)
 * @param {Object} preguntaB - pregunta adyacente (tiene ID_PREGUNTA y ORDEN)
 * @param {Function} [onError] - callback opcional para reportar errores
 * @returns {Promise<boolean>} true si tuvo exito
 */
export async function swapOrdenPreguntas(preguntaA, preguntaB, onError) {
  if (!preguntaA?.ID_PREGUNTA || !preguntaB?.ID_PREGUNTA) return false;
  if (preguntaA.ORDEN === preguntaB.ORDEN) return true;
  try {
    await db.update('CONVOCATORIA_PREGUNTAS', preguntaA.ID_PREGUNTA, { ORDEN: 999999 }, 'ID_PREGUNTA');
    await db.update('CONVOCATORIA_PREGUNTAS', preguntaB.ID_PREGUNTA, { ORDEN: preguntaA.ORDEN }, 'ID_PREGUNTA');
    await db.update('CONVOCATORIA_PREGUNTAS', preguntaA.ID_PREGUNTA, { ORDEN: preguntaB.ORDEN }, 'ID_PREGUNTA');
    return true;
  } catch (err) {
    console.error('[swapOrdenPreguntas] Error:', err);
    onError?.(err);
    return false;
  }
}
