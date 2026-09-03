import { useState, useCallback, useEffect, useMemo } from 'react';
import { db } from '@/shared/api';
import cacheService from '@/shared/services/cacheService';
import { generateBlockTimeRanges } from '@/features/grupos/config/transformers';

/**
 * Intercambia el ORDEN de dos bloques respetando la restricción UNIQUE(ID_HORARIO, ORDEN).
 * Estrategia de 3 pasos con valor temporal:
 *   1. A -> ORDEN = 999999 (temporal)
 *   2. B -> ORDEN = A.ORDEN
 *   3. A -> ORDEN = B.ORDEN
 *
 * @param {Object} bloqueA - bloque a mover (tiene ID_BLOQUE y ORDEN)
 * @param {Object} bloqueB - bloque adyacente (tiene ID_BLOQUE y ORDEN)
 * @param {Function} [onError] - callback opcional para reportar errores
 * @returns {Promise<boolean>} true si tuvo exito
 */
export async function swapBloquesOrden(bloqueA, bloqueB, onError) {
  if (!bloqueA || !bloqueB || !bloqueA.ID_BLOQUE || !bloqueB.ID_BLOQUE) return false;
  if (bloqueA.ORDEN === bloqueB.ORDEN) return true;
  try {
    await db.update('HORARIO_BLOQUES', bloqueA.ID_BLOQUE, { ORDEN: 999999 }, 'ID_BLOQUE');
    await db.update('HORARIO_BLOQUES', bloqueB.ID_BLOQUE, { ORDEN: bloqueA.ORDEN }, 'ID_BLOQUE');
    await db.update('HORARIO_BLOQUES', bloqueA.ID_BLOQUE, { ORDEN: bloqueB.ORDEN }, 'ID_BLOQUE');
    cacheService.invalidateAll();
    return true;
  } catch (err) {
    console.error('[swapBloquesOrden] Error:', err);
    onError?.(err);
    return false;
  }
}

/**
 * Normaliza MATRIZ_DIAS a un array 2D.
 * Acepta array nativo o string JSON.
 */
const normalizeMatrix = (raw) => {
  if (!raw) return [];
  let mat = raw;
  if (typeof mat === 'string') {
    try {
      mat = JSON.parse(mat);
    } catch {
      return [];
    }
  }
  return Array.isArray(mat) ? mat : [];
};

/**
 * Convierte "HH:MM[:SS]" a horas decimales (ej: "08:30" -> 8.5)
 */
const parseStartHour = (timeString) => {
  if (!timeString) return 0;
  const parts = String(timeString).split(':').map(Number);
  const h = parts[0] || 0;
  const m = parts[1] || 0;
  return h + m / 60;
};

/**
 * Hook para cargar y construir la vista de bloques de un horario.
 *
 * @param {Object|null} horario - Row del horario seleccionado (de VW_HORARIOS)
 * @returns {{ bloques, scheduleBlocks, matrix, loading, reload }}
 */
export function useHorarioBloques(horario) {
  const [bloques, setBloques] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadBloques = useCallback(async (idHorario) => {
    if (!idHorario) {
      setBloques([]);
      return;
    }
    setLoading(true);
    try {
      const result = await db.select('VW_HORARIO_BLOQUES', { ID_HORARIO: idHorario });
      const sorted = Array.isArray(result)
        ? result.sort((a, b) => (a.ORDEN || 0) - (b.ORDEN || 0))
        : [];
      setBloques(sorted);
    } catch (err) {
      console.error('[useHorarioBloques] Error cargando bloques:', err);
      setBloques([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (horario?.ID_HORARIO) {
      loadBloques(horario.ID_HORARIO);
    } else {
      setBloques([]);
    }
  }, [horario?.ID_HORARIO, loadBloques]);

  // MATRIZ_DIAS del horario (normalizada)
  const matrix = useMemo(() => normalizeMatrix(horario?.MATRIZ_DIAS), [horario?.MATRIZ_DIAS]);

  // Construir blocks para ScheduleTemplate
  const scheduleBlocks = useMemo(() => {
    if (!bloques.length || !horario) return [];
    const startHour = parseStartHour(horario.HORA_INICIO_JORNADA);
    const rawBlocks = bloques.map((b) => ({
      duration: b.DURACION,
      type: b.TIPO_BLOQUE || 'clase',
      label: b.ETIQUETA || `Bloque ${b.ORDEN}`,
      orden: b.ORDEN,
      idBloque: b.ID_BLOQUE,
    }));
    return generateBlockTimeRanges(rawBlocks, startHour);
  }, [bloques, horario]);

  const reload = useCallback(() => {
    if (horario?.ID_HORARIO) loadBloques(horario.ID_HORARIO);
  }, [horario?.ID_HORARIO, loadBloques]);

  return { bloques, scheduleBlocks, matrix, loading, reload };
}

export default useHorarioBloques;
