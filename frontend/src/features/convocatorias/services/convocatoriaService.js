import { db } from '@/shared/api';
import cacheService from '@/shared/services/cacheService';

/**
 * Formatea un Date (o string de fecha) a 'YYYY-MM-DD HH:MM:SS' en hora local.
 * Evita la conversión a UTC que hace JSON.stringify con Date objects,
 * que desplaza la hora según el offset de zona horaria del navegador.
 */
const toLocalTimestamp = (value) => {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
};

/**
 * Crea una convocatoria + N convocatoria_curso en una sola transacción
 * atómica via la función SQL `fn_crear_convocatoria_con_plazas`.
 *
 * @param {Object} data - Datos del formulario (step 1 + PLAZAS array del step 2).
 * @returns {Promise<number>} - ID_CONVOCATORIA creado.
 */
export async function createConvocatoriaConPlazas(data) {
  const plazas = Array.isArray(data.PLAZAS) ? data.PLAZAS : [];

  // Sanitizar plazas: solo campos que la función SQL espera
  const plazasSanitizadas = plazas
    .filter(p => p && p.ID_SEDE != null && p.ID_CURSO != null)
    .map(p => ({
      ID_SEDE: Number(p.ID_SEDE),
      ID_CURSO: Number(p.ID_CURSO),
      NUMERO_PLAZAS: Number(p.NUMERO_PLAZAS) || 0
    }));

  const result = await db.executeFunction('fn_crear_convocatoria_con_plazas', {
    id_periodo: data.ID_PERIODO,
    descripcion: data.DESCRIPCION || null,
    fecha_apertura: toLocalTimestamp(data.FECHA_APERTURA),
    fecha_cierre: toLocalTimestamp(data.FECHA_CIERRE),
    plazas: plazasSanitizadas
  });

  cacheService.invalidateAll();
  return result;
}

/**
 * Actualiza una convocatoria existente.
 * Convierte las fechas a timestamp local (sin timezone) para evitar
 * el desplazamiento de horas por conversión UTC.
 * @param {Object} data - Datos del formulario de edición.
 * @param {number} id - ID_CONVOCATORIA a actualizar.
 * @returns {Promise<Object>} - Resultado del update.
 */
export async function editConvocatoria(data, id) {
  const payload = { ...data };
  if (payload.FECHA_APERTURA) payload.FECHA_APERTURA = toLocalTimestamp(payload.FECHA_APERTURA);
  if (payload.FECHA_CIERRE) payload.FECHA_CIERRE = toLocalTimestamp(payload.FECHA_CIERRE);
  const result = await db.update('CONVOCATORIA', id, payload, 'ID_CONVOCATORIA');
  cacheService.invalidateAll();
  return result;
}

/**
 * Añade plazas a un convocatoria_curso (crear plazas).
 * Si (convocatoria, sede, curso) ya existe → NO modifica el máximo, solo crea la plaza.
 * Si no existe → crea nuevo convocatoria_curso.
 * Luego crea N plazas en PLAZA_DOCENTE.
 * Atómico via `fn_add_convocatoria_curso_plazas`.
 *
 * @param {Object} data - { ID_CONVOCATORIA, ID_SEDE, ID_CURSO, NUMERO_PLAZAS }
 * @returns {Promise<number>} - ID_CONVOCATORIA_CURSO.
 */
export async function addConvocatoriaCursoPlazas(data) {
  const result = await db.executeFunction('fn_add_convocatoria_curso_plazas', {
    id_convocatoria: data.ID_CONVOCATORIA,
    id_sede: data.ID_SEDE,
    id_curso: data.ID_CURSO,
    num_plazas: Number(data.NUMERO_PLAZAS) || 1
  });

  cacheService.invalidateAll();
  return result;
}

/**
 * Añade UNA sola plaza docente a un convocatoria_curso existente.
 * NO modifica el NUMERO_PLAZAS (máximo). Solo crea la plaza en PLAZA_DOCENTE.
 * El trigger valida que no se exceda el máximo.
 * Usado por el botón simple "Añadir plaza docente" en la tabla nivel 2.
 *
 * @param {number} idConvocatoriaCurso - ID_CONVOCATORIA_CURSO
 * @returns {Promise<number>} - ID_PLAZA_DOCENTE creado.
 */
export async function addPlazaDocenteSimple(idConvocatoriaCurso) {
  const result = await db.executeFunction('fn_add_plaza_docente_simple', {
    p_id_convocatoria_curso: idConvocatoriaCurso
  });

  cacheService.invalidateAll();
  return result;
}

export default { createConvocatoriaConPlazas, addConvocatoriaCursoPlazas, addPlazaDocenteSimple };
