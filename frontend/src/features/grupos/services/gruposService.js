import { db } from '@/shared/api';
import cacheService from '@/shared/services/cacheService';

/**
 * Crea múltiples grupos en una sola transacción atómica
 * via la función SQL `fn_crear_grupos_batch`.
 *
 * Recibe combinaciones sede×área con N grupos cada una.
 * Aplana a un array de grupos individuales con sus propios campos.
 *
 * @param {Object} data - {
 *   ID_PERIODO,
 *   COMBOS: [{
 *     ID_SEDE, ID_AREA, MODALIDAD, selected,
 *     ID_HORARIO, FECHA_INICIO, FECHA_TERMINO, ID_PLAN,
 *     grupos: [{ CODIGO_GRUPO, NOMBRE_GRUPO, CAPACIDAD_MAXIMA, ID_AULA }]
 *   }]
 * }
 * @returns {Promise<number>} - Número de grupos creados.
 */
export async function createGruposBatch(data) {
  const combos = Array.isArray(data.COMBOS) ? data.COMBOS : [];

  // Aplanar combinaciones seleccionadas a array de grupos individuales
  const gruposSanitizados = combos
    .filter(c => c && c.selected)
    .flatMap(c => {
      const modalidad = c.MODALIDAD === 'VIRTUAL' ? 'VIRTUAL' : 'PRESENCIAL';
      const idSede = modalidad === 'VIRTUAL' ? null : (c.ID_SEDE != null ? Number(c.ID_SEDE) : null);
      const idPlan = c.ID_PLAN ? Number(c.ID_PLAN) : null;

      return (c.grupos || []).map(g => ({
        ID_SEDE: idSede,
        ID_AREA: Number(c.ID_AREA),
        MODALIDAD: modalidad,
        ID_HORARIO: g.ID_HORARIO ? Number(g.ID_HORARIO) : null,
        FECHA_INICIO: c.FECHA_INICIO,
        FECHA_TERMINO: c.FECHA_TERMINO,
        ID_PLAN: idPlan,
        NOMBRE_GRUPO: g.NOMBRE_GRUPO || null,
        CAPACIDAD_MAXIMA: g.CAPACIDAD_MAXIMA != null && g.CAPACIDAD_MAXIMA !== ''
          ? Number(g.CAPACIDAD_MAXIMA) : null,
        ID_AULA: modalidad === 'VIRTUAL' ? null : (g.ID_AULA ? Number(g.ID_AULA) : null)
      }));
    });

  if (gruposSanitizados.length === 0) {
    throw new Error('No hay grupos seleccionados para crear');
  }

  const result = await db.executeFunction('fn_crear_grupos_batch', {
    p_id_periodo: Number(data.ID_PERIODO),
    p_grupos: gruposSanitizados
  });

  cacheService.invalidateAll();
  return result;
}

export default { createGruposBatch };
