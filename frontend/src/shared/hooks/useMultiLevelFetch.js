import { useState, useEffect, useCallback, useRef } from 'react';
import { db as backend } from '@/shared/api';

/**
 * Hook para multilevel con carga diferida (lazy loading).
 * Cada nivel se carga independientemente: nivel 1 en mount, niveles hijos al expandir.
 *
 * @param {Array} levelConfigs - Config por nivel:
 *   [
 *     { tableName: 'SEDES', primaryKey: 'ID_SEDE', filters: {} },
 *     { tableName: 'AULAS', primaryKey: 'ID_AULA', parentKey: 'ID_SEDE' }
 *   ]
 * @returns {Object} { records, childrenCache, loading, error, fetchChildren, refresh, refreshChildren }
 */
export function useMultiLevelFetch(levelConfigs) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [childrenCache, setChildrenCache] = useState({});
  const fetchedEntriesRef = useRef(new Map()); // cacheKey -> { levelIndex, parentValue }

  const fetchLevel1 = useCallback(async () => {
    if (!levelConfigs?.length) return;
    const config = levelConfigs[0];
    if (!config.tableName) {
      setRecords([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await backend.select(config.tableName, config.filters || {});
      let result = Array.isArray(data) ? data : [];
      if (config.orderBy) {
        result = [...result].sort((a, b) =>
          String(a[config.orderBy] || '').localeCompare(String(b[config.orderBy] || ''), 'es', { sensitivity: 'base' })
        );
      }
      setRecords(result);
    } catch (err) {
      setError(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [levelConfigs]);

  useEffect(() => {
    fetchLevel1();
  }, [fetchLevel1]);

  const fetchChildren = useCallback(async (levelIndex, parentValue) => {
    if (levelIndex <= 0 || levelIndex >= levelConfigs.length) return;

    const config = levelConfigs[levelIndex];
    const parentConfig = levelConfigs[levelIndex - 1];
    const cacheKey = `${levelIndex}-${parentValue}`;

    fetchedEntriesRef.current.set(cacheKey, { levelIndex, parentValue });

    setChildrenCache(prev => ({
      ...prev,
      [cacheKey]: { data: [], loading: true, loaded: false }
    }));

    try {
      const filters = { ...(config.filters || {}), [config.parentKey]: parentValue };
      const data = await backend.select(config.tableName, filters);
      setChildrenCache(prev => ({
        ...prev,
        [cacheKey]: { data: Array.isArray(data) ? data : [], loading: false, loaded: true }
      }));
    } catch (err) {
      setChildrenCache(prev => ({
        ...prev,
        [cacheKey]: { data: [], loading: false, loaded: true, error: err.message }
      }));
    }
  }, [levelConfigs]);

  const refresh = useCallback(() => {
    setChildrenCache({});
    return fetchLevel1();
  }, [fetchLevel1]);

  const refreshChildren = useCallback((levelIndex, parentValue) => {
    const cacheKey = `${levelIndex}-${parentValue}`;
    setChildrenCache(prev => ({
      ...prev,
      [cacheKey]: { data: [], loading: true, loaded: false }
    }));
    return fetchChildren(levelIndex, parentValue);
  }, [fetchChildren]);

  const updateRecord = useCallback((recordId, primaryKey, field, newValue) => {
    const idStr = String(recordId);
    const levelIndex = levelConfigs.findIndex(c => c.primaryKey === primaryKey);

    if (levelIndex === 0) {
      setRecords(prev => prev.map(row => String(row[primaryKey]) === idStr ? { ...row, [field]: newValue } : row));
    } else if (levelIndex > 0) {
      const keyPrefix = `${levelIndex}-`;
      setChildrenCache(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          if (!key.startsWith(keyPrefix)) return;
          next[key] = {
            ...next[key],
            data: (next[key].data || []).map(row => String(row[primaryKey]) === idStr ? { ...row, [field]: newValue } : row)
          };
        });
        return next;
      });
    }
  }, [levelConfigs]);

  const refreshKeepingExpansion = useCallback(() => {
    fetchLevel1();
    fetchedEntriesRef.current.forEach(({ levelIndex, parentValue }) => {
      fetchChildren(levelIndex, parentValue);
    });
  }, [fetchLevel1, fetchChildren]);

  // Distribuye datos planos a childrenCache agrupados por parentKey.
  // Evita N llamadas fetchChildren cuando ya se tienen todos los datos.
  const populateChildrenFromFlatData = useCallback((levelIndex, flatData, groupByKey) => {
    if (levelIndex <= 0 || levelIndex >= levelConfigs.length) return;

    // Agrupar datos por la clave del padre (ej: CODIGO_SEDE)
    const grouped = {};
    (flatData || []).forEach(row => {
      const key = row[groupByKey];
      if (key == null) return;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(row);
    });

    // Poblar childrenCache y fetchedEntriesRef
    setChildrenCache(prev => {
      const next = { ...prev };
      Object.entries(grouped).forEach(([parentValue, data]) => {
        const cacheKey = `${levelIndex}-${parentValue}`;
        fetchedEntriesRef.current.set(cacheKey, { levelIndex, parentValue });
        next[cacheKey] = { data, loading: false, loaded: true };
      });
      return next;
    });
  }, [levelConfigs]);

  return {
    records,
    childrenCache,
    loading,
    error,
    fetchChildren,
    fetchLevel1,
    refresh,
    refreshChildren,
    refreshKeepingExpansion,
    populateChildrenFromFlatData,
    updateRecord
  };
}
