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
      console.log('[useTableData] ⏹️ No se proporcionó nombre de tabla, omitiendo fetch');
      setError('No se proporcionó nombre de tabla');
      return;
    }

    console.log('[useTableData] 🌐 Iniciando fetch', { tableName, filters });
    setLoading(true);
    setError(null);

    try {
      const result = await db.select(tableName, filters);
      const normalized = Array.isArray(result) ? result : (result || []);
      console.log('[useTableData] ✅ Datos recibidos', { tableName, count: normalized.length, firstRow: normalized[0] });
      setRecords(normalized);
    } catch (err) {
      console.error(`[useTableData] ❌ Error en useTableData (${tableName}):`, err);
      setError(err.message || 'Error de conexión');
    } finally {
      console.log('[useTableData] 🏁 fetch finalizado', { tableName });
      setLoading(false);
    }
  }, [tableName, JSON.stringify(filters)]);

  useEffect(() => {
    console.log('[useTableData] ⚡ useEffect: llamando fetchData', { tableName });
    fetchData();
  }, [fetchData, tableName]);

  const refresh = useCallback(() => {
    console.log('[useTableData] 🔄 refresh() llamado manualmente', { tableName });
    return fetchData();
  }, [fetchData, tableName]);

  return {
    records,
    loading,
    error,
    refresh
  };
}
