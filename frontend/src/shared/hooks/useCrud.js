import { useState, useEffect } from 'react';
import { db } from '@/shared/api';

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
      const result = await db.query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
      setTables(result || []);
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
      const result = await db.select(tableName);
      return { success: true, data: result };
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
      const result = await db.insert(tableName, record);
      return { success: true, data: result };
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
      const result = await db.update(tableName, id, record);
      return { success: true, data: result };
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
      const result = await db.delete(tableName, id);
      return { success: true, data: result };
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
      let filters = {};
      if (field && searchTerm) {
        filters[field] = searchTerm;
      }
      const result = await db.select(tableName, filters);
      return { success: true, data: result };
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
      const count = await db.count(tableName);
      return { success: true, data: { count } };
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
      const result = await db.getById(tableName, id);
      return { success: true, data: result };
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
