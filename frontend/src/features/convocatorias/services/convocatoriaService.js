import { db } from '@/shared/api';
import cacheService from '@/shared/services/cacheService';

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
    fecha_apertura: data.FECHA_APERTURA || null,
    fecha_cierre: data.FECHA_CIERRE || null,
    plazas: plazasSanitizadas
  });

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

export default { createConvocatoriaConPlazas, addConvocatoriaCursoPlazas };
