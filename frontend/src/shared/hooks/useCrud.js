import { useState, useEffect } from 'react';
import crudService from '@/shared/services/crudService';

/**
 * Hook para manejar operaciones CRUD genéricas
 */
export function useCrud() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Cargar todas las tablas
   */
  const loadTables = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await crudService.getTables();
      console.log('Respuesta de /api/tables:', response);
      setTables(response.data?.tables || []);
    } catch (err) {
      setError(err.message);
      console.error('Error en hook useCrud:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obtener datos de una tabla específica
   */
  const getTableData = async (tableName) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await crudService.getTableData(tableName);
      return response;
    } catch (err) {
      setError(err.message);
      console.error(`Error obteniendo datos de ${tableName}:`, err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Crear un registro en una tabla
   */
  const createRecord = async (tableName, record) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await crudService.createRecord(tableName, record);
      return response;
    } catch (err) {
      setError(err.message);
      console.error(`Error creando registro en ${tableName}:`, err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Actualizar un registro
   */
  const updateRecord = async (tableName, id, record) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await crudService.updateRecord(tableName, id, record);
      return response;
    } catch (err) {
      setError(err.message);
      console.error(`Error actualizando registro en ${tableName}:`, err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Eliminar un registro
   */
  const deleteRecord = async (tableName, id) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await crudService.deleteRecord(tableName, id);
      return response;
    } catch (err) {
      setError(err.message);
      console.error(`Error eliminando registro en ${tableName}:`, err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Buscar registros en una tabla
   */
  const searchTable = async (tableName, searchTerm, field = null) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await crudService.searchTable(tableName, searchTerm, field);
      return response;
    } catch (err) {
      setError(err.message);
      console.error(`Error buscando en ${tableName}:`, err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obtener estadísticas de una tabla
   */
  const getTableStats = async (tableName) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await crudService.getTableStats(tableName);
      return response;
    } catch (err) {
      setError(err.message);
      console.error(`Error obteniendo estadísticas de ${tableName}:`, err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obtener un registro específico
   */
  const getRecordById = async (tableName, id) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await crudService.getRecordById(tableName, id);
      return response;
    } catch (err) {
      setError(err.message);
      console.error(`Error obteniendo registro ${id} de ${tableName}:`, err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    tables,
    loading,
    error,
    loadTables,
    getTableData,
    createRecord,
    updateRecord,
    deleteRecord,
    searchTable,
    getTableStats,
    getRecordById
  };
}
