import { useState, useEffect, useCallback } from 'react';
import { db } from '@/shared/api';

// Cache simple por sesión
const cache = new Map();

/**
 * Hook para cargar valores únicos de una columna de tabla
 * @param {string} tableName - Nombre de la tabla
 * @param {string} columnName - Nombre de la columna
 * @returns {Object} - { options, loading, refresh }
 */
export const useUniqueValues = (tableName, columnName) => {
  const [values, setValues] = useState([]);
  const [loading, setLoading] = useState(false);
  const cacheKey = `${tableName}:${columnName}`;

  const load = useCallback(async () => {
    // No cargar si faltan parámetros
    if (!tableName || !columnName) {
      setValues([]);
      return;
    }

    if (cache.has(cacheKey)) {
      setValues(cache.get(cacheKey));
      return;
    }

    setLoading(true);
    try {
      const data = await db.select(tableName, {}, [columnName]);
      const uniqueValues = [...new Set(data.map(row => row[columnName]))];
      cache.set(cacheKey, uniqueValues);
      setValues(uniqueValues);
    } catch (err) {
      console.error('Error cargando valores únicos:', err);
    } finally {
      setLoading(false);
    }
  }, [tableName, columnName, cacheKey]);

  useEffect(() => {
    load();
  }, [load]);

  // Convertir a formato de opciones
  const options = values.map(v => ({ value: v, label: String(v) }));

  return { options, loading, refresh: load };
};

export default useUniqueValues;
