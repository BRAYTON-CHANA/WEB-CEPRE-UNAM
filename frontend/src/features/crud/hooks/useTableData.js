import { useState, useEffect, useCallback } from 'react';
import crudService from '@/shared/services/crudService';

/**
 * Hook para obtener datos y schema de una tabla específica por nombre
 * @param {string} tableName - Nombre de la tabla
 * @returns {Object} - Schema, records, loading, error y refresh
 */
export function useTableData(tableName) {
  const [schema, setSchema] = useState(null);
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
      const response = await crudService.getTableData(tableName);
      
      if (response.success) {
        setSchema(response.data.schema);
        setRecords(response.data.records);
      } else {
        setError(response.message || 'Error al obtener datos');
      }
    } catch (err) {
      setError(err.message || 'Error de conexión');
      console.error(`Error en useTableData (${tableName}):`, err);
    } finally {
      setLoading(false);
    }
  }, [tableName]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    schema,
    records,
    loading,
    error,
    refresh
  };
}
