import { useState, useEffect, useCallback } from 'react';

/**
 * Hook genérico para operaciones CRUD con API REST
 * Se conecta a los endpoints básicos generados por Table.js
 * 
 * @param {string} baseUrl - URL base de la API (ej: 'http://localhost:3001/api/tabla-crud-basico')
 * @param {Object} options - Opciones adicionales
 * @returns {Object} - Estado y funciones CRUD
 */
export const useApi = (baseUrl, options = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Función helper para hacer peticiones
  const apiCall = useCallback(async (url, options = {}) => {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Error en la respuesta de la API');
      }
      
      return result.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }, []);

  // Obtener todos los registros
  const getAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiCall(baseUrl);
      setData(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [baseUrl, apiCall]);

  // Obtener registro por ID
  const getById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiCall(`${baseUrl}/${id}`);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [baseUrl, apiCall]);

  // Obtener registros por campo específico
  const getByField = useCallback(async (field, value) => {
    setLoading(true);
    setError(null);
    try {
      const url = `${baseUrl}/field?field=${encodeURIComponent(field)}&value=${encodeURIComponent(value)}`;
      const result = await apiCall(url);
      return result;
    } catch (err) {
      // Si el error es por campo inexistente, mostrar mensaje específico
      if (err.message && err.message.includes('SQLITE_ERROR: no such column')) {
        setError(`El campo '${field}' no existe en la tabla. Usa los campos correctos.`);
      } else {
        setError(err.message);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [baseUrl, apiCall]);

  // Crear nuevo registro
  const create = useCallback(async (newData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiCall(baseUrl, {
        method: 'POST',
        body: JSON.stringify(newData)
      });
      
      // Refrescar datos después de crear
      await getAll();
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [baseUrl, apiCall, getAll]);

  // Actualizar registro por ID
  const update = useCallback(async (id, updateData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiCall(`${baseUrl}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });
      
      // Refrescar datos después de actualizar
      await getAll();
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [baseUrl, apiCall, getAll]);

  // Actualizar registros por campo
  const updateByField = useCallback(async (field, value, updateData) => {
    setLoading(true);
    setError(null);
    try {
      const url = `${baseUrl}/field?field=${encodeURIComponent(field)}&value=${encodeURIComponent(value)}`;
      const result = await apiCall(url, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });
      
      // Refrescar datos después de actualizar
      await getAll();
      
      return result;
    } catch (err) {
      // Si el error es por campo inexistente, mostrar mensaje específico
      if (err.message && err.message.includes('SQLITE_ERROR: no such column')) {
        setError(`El campo '${field}' no existe en la tabla. Usa los campos correctos.`);
      } else {
        setError(err.message);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [baseUrl, apiCall, getAll]);

  // Eliminar registro por ID
  const deleteById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiCall(`${baseUrl}/${id}`, {
        method: 'DELETE'
      });
      
      // Refrescar datos después de eliminar
      await getAll();
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [baseUrl, apiCall, getAll]);

  // Eliminar registros por campo
  const deleteByField = useCallback(async (field, value) => {
    setLoading(true);
    setError(null);
    try {
      const url = `${baseUrl}/field?field=${encodeURIComponent(field)}&value=${encodeURIComponent(value)}`;
      const result = await apiCall(url, {
        method: 'DELETE'
      });
      
      // Refrescar datos después de eliminar
      await getAll();
      
      return result;
    } catch (err) {
      // Si el error es por campo inexistente, mostrar mensaje específico
      if (err.message && err.message.includes('SQLITE_ERROR: no such column')) {
        setError(`El campo '${field}' no existe en la tabla. Usa los campos correctos.`);
      } else {
        setError(err.message);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [baseUrl, apiCall, getAll]);

  // Buscar registros (si el endpoint existe)
  const search = useCallback(async (query, searchFields = null) => {
    setLoading(true);
    setError(null);
    try {
      let url = `${baseUrl}/search?q=${encodeURIComponent(query)}`;
      if (searchFields && searchFields.length > 0) {
        url += `&fields=${encodeURIComponent(searchFields.join(','))}`;
      }
      
      const result = await apiCall(url);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [baseUrl, apiCall]);

  // Obtener estadísticas (si el endpoint existe)
  const getStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiCall(`${baseUrl}/stats`);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [baseUrl, apiCall]);

  // Cargar datos iniciales
  useEffect(() => {
    if (options.autoLoad !== false) {
      getAll();
    }
  }, [getAll, options.autoLoad]);

  return {
    // Estado
    data,
    loading,
    error,
    
    // Operaciones CRUD básicas
    getAll,
    getById,
    getByField,
    create,
    update,
    updateByField,
    deleteById,
    deleteByField,
    
    // Operaciones adicionales
    search,
    getStats,
    
    // Utilidades
    refresh: getAll,
    clearError: () => setError(null),
    setData
  };
};

/**
 * Hook específico para tablas CRUD básicas
 * Wrapper de useApi con configuración predefinida
 * 
 * @param {string} tableName - Nombre de la tabla (ej: 'tabla-crud-basico')
 * @param {Object} options - Opciones adicionales
 * @returns {Object} - Estado y funciones CRUD
 */
export const useTableApi = (tableName, options = {}) => {
  const baseUrl = `http://localhost:3001/api/${tableName}`;
  return useApi(baseUrl, options);
};
