import { useState, useEffect, useCallback } from 'react';
import { db } from '@/shared/api';

/**
 * Hook para obtener datos de una tabla específica
 * @param {string} tableName - Nombre de la tabla
 * @returns {Object} - records, loading, error y refresh
 */
export function useTableData(tableName, filters = {}) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!tableName) {
      setError('No se proporcionó nombre de tabla');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await db.select(tableName, filters);
      setRecords(result);
    } catch (err) {
      setError(err.message || 'Error de conexión');
      console.error(`Error en useTableData (${tableName}):`, err);
    } finally {
      setLoading(false);
    }
  }, [tableName, JSON.stringify(filters)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    records,
    loading,
    error,
    refresh
  };
}
