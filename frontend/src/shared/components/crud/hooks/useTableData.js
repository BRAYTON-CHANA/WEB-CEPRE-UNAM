import { useState, useEffect, useCallback } from 'react';
import { db } from '@/shared/api';

/**
 * Hook para obtener datos de una tabla específica
 * @param {string} tableName - Nombre de la tabla
 * @param {Object|Array} filters - Filtros para db.select
 * @param {string[]|null} fields - Columnas a traer (null = todas)
 * @returns {Object} - records, loading, error y refresh
 */
export function useTableData(tableName, filters = {}, fields = null) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!tableName) {
      // No-op: tableName es null cuando la tabla usa datos externos (isExternal=true)
      setError('No se proporcionó nombre de tabla');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await db.select(tableName, filters, fields);
      const normalized = Array.isArray(result) ? result : (result || []);
      setRecords(normalized);
    } catch (err) {
      console.error(`[useTableData] ❌ Error en useTableData (${tableName}):`, err);
      setError(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [tableName, JSON.stringify(filters), JSON.stringify(fields)]);

  useEffect(() => {
    fetchData();
  }, [fetchData, tableName]);

  const refresh = useCallback(() => {
    return fetchData();
  }, [fetchData, tableName]);

  // Actualización optimista local (sin refetch) para campos boolean editables
  const updateRecord = useCallback((recordId, primaryKey, field, newValue) => {
    const idStr = String(recordId);
    setRecords(prev => prev.map(row =>
      String(row[primaryKey]) === idStr ? { ...row, [field]: newValue } : row
    ));
  }, []);

  return {
    records,
    loading,
    error,
    refresh,
    updateRecord
  };
}
