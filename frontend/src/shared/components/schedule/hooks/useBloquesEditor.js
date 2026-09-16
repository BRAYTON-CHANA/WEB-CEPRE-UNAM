import { useState, useCallback, useEffect, useMemo } from 'react';
import { db } from '@/shared/api';
import cacheService from '@/shared/services/cacheService';
import { generateBlockTimeRanges } from '@/features/grupos/config/transformers';

/**
 * Intercambia el ORDEN de dos bloques respetando la restricción UNIQUE(fk, ORDEN).
 * Estrategia de 3 pasos con valor temporal:
 *   1. A -> ORDEN = 999999 (temporal)
 *   2. B -> ORDEN = A.ORDEN
 *   3. A -> ORDEN = B.ORDEN
 *
 * @param {string}   tableName - Tabla de bloques ('HORARIO_BLOQUES' | 'TURNO_BLOQUES')
 * @param {string}   pkField   - Columna PK ('ID_BLOQUE')
 * @param {Object}   bloqueA   - bloque a mover
 * @param {Object}   bloqueB   - bloque adyacente
 * @param {Function} [onError] - callback opcional para reportar errores
 * @returns {Promise<boolean>} true si tuvo exito
 */
export async function swapBloquesOrden(tableName, pkField, bloqueA, bloqueB, onError) {
  if (!bloqueA || !bloqueB || !bloqueA[pkField] || !bloqueB[pkField]) return false;
  if (bloqueA.ORDEN === bloqueB.ORDEN) return true;
  try {
    await db.update(tableName, bloqueA[pkField], { ORDEN: 999999 }, pkField);
    await db.update(tableName, bloqueB[pkField], { ORDEN: bloqueA.ORDEN }, pkField);
    await db.update(tableName, bloqueA[pkField], { ORDEN: bloqueB.ORDEN }, pkField);
    cacheService.invalidateAll();
    return true;
  } catch (err) {
    console.error('[swapBloquesOrden] Error:', err);
    onError?.(err);
    return false;
  }
}

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
 * Hook genérico para cargar y construir la vista de bloques de una entidad
 * (horario plantilla o turno).
 *
 * @param {Object|null} row    - Fila padre (VW_HORARIOS | VW_TURNOS)
 * @param {Object}      config - { viewName, pkField, fkField, parentPkField }
 * @returns {{ bloques, scheduleBlocks, matrix, loading, reload }}
 */
export function useBloquesEditor(row, config) {
  const [bloques, setBloques] = useState([]);
  const [loading, setLoading] = useState(false);

  const { viewName, pkField, fkField, parentPkField } = config;
  const parentId = row?.[parentPkField];

  const loadBloques = useCallback(async (id) => {
    if (!id) {
      setBloques([]);
      return;
    }
    setLoading(true);
    try {
      const result = await db.select(viewName, { [fkField]: id });
      const sorted = Array.isArray(result)
        ? result.sort((a, b) => (a.ORDEN || 0) - (b.ORDEN || 0))
        : [];
      setBloques(sorted);
    } catch (err) {
      console.error('[useBloquesEditor] Error cargando bloques:', err);
      setBloques([]);
    } finally {
      setLoading(false);
    }
  }, [viewName, fkField]);

  useEffect(() => {
    loadBloques(parentId);
  }, [parentId, loadBloques]);

  // En la vista de edicion de bloques solo se muestra una columna "Dia"
  const matrix = useMemo(() => [['Dia']], []);

  // Construir blocks para ScheduleTemplate
  const scheduleBlocks = useMemo(() => {
    if (!bloques.length || !row) return [];
    const startHour = parseStartHour(row.HORA_INICIO_JORNADA);
    const rawBlocks = bloques.map((b) => ({
      duration: b.DURACION,
      type: b.TIPO_BLOQUE || 'clase',
      label: b.ETIQUETA || `Bloque ${b.ORDEN}`,
      orden: b.ORDEN,
      idBloque: b[pkField],
    }));
    return generateBlockTimeRanges(rawBlocks, startHour);
  }, [bloques, row, pkField]);

  const reload = useCallback(() => {
    loadBloques(parentId);
  }, [parentId, loadBloques]);

  return { bloques, scheduleBlocks, matrix, loading, reload };
}

export default useBloquesEditor;
