import { useState, useEffect, useCallback } from 'react';
import crudService from '@/shared/services/crudService';
import cacheService from '@/shared/services/cacheService';

/**
 * Hook para manejar formularios conectados a backend CRUD
 * Maneja carga de schema, datos de registro (modo edit), y submit
 */
export const useCrudForm = (tableName, mode = 'create', recordId = null) => {
  const [schema, setSchema] = useState(null);
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * Cargar el schema de la tabla
   */
  const loadSchema = useCallback(async () => {
    try {
      setError(null);
      const tableSchema = await crudService.getTableSchema(tableName);
      setSchema(tableSchema);
      return tableSchema;
    } catch (err) {
      setError(`Error cargando schema: ${err.message}`);
      throw err;
    }
  }, [tableName]);

  /**
   * Cargar datos de un registro específico (modo edit)
   */
  const loadRecord = useCallback(async (id) => {
    console.log(`[useCrudForm] loadRecord called:`, { id, mode, tableName });
    if (!id || mode !== 'edit') {
      console.log(`[useCrudForm] loadRecord skipped: no id or not edit mode`);
      return null;
    }

    try {
      setError(null);
      setLoading(true);
      console.log(`[useCrudForm] Fetching record ${id} from ${tableName}`);
      const response = await crudService.getRecordById(tableName, id);
      const recordData = response.data?.record || response.data;
      console.log(`[useCrudForm] Record loaded:`, recordData);
      setRecord(recordData);
      return recordData;
    } catch (err) {
      console.error(`[useCrudForm] Error loading record:`, err);
      setError(`Error cargando registro: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tableName, mode]);

  /**
   * Crear un nuevo registro
   */
  const createRecord = useCallback(async (data) => {
    try {
      setError(null);
      setLoading(true);
      const result = await crudService.createRecord(tableName, data);
      // crudService ya invalida el cache (cacheService.invalidateAll)
      return result;
    } catch (err) {
      console.error('[useCrudForm] createRecord error:', err);
      setError(`Error creando registro: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tableName]);

  /**
   * Actualizar un registro existente
   */
  const updateRecord = useCallback(async (id, data) => {
    try {
      setError(null);
      setLoading(true);
      const result = await crudService.updateRecord(tableName, id, data);
      // crudService ya invalida el cache (cacheService.invalidateAll)
      return result;
    } catch (err) {
      setError(`Error actualizando registro: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tableName]);

  /**
   * Submit según el modo (create o edit)
   */
  const submit = useCallback(async (data, id = null) => {
    console.log('[useCrudForm] submit llamado');
    console.log('[useCrudForm] modo:', mode);
    console.log('[useCrudForm] data:', data);
    console.log('[useCrudForm] recordId/id:', id || recordId);
    
    if (mode === 'create') {
      console.log('[useCrudForm] Llamando createRecord...');
      return await createRecord(data);
    } else {
      console.log('[useCrudForm] Llamando updateRecord...');
      return await updateRecord(id || recordId, data);
    }
  }, [mode, createRecord, updateRecord, recordId]);

  /**
   * Limpiar errores
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Recargar todo (schema + record si es modo edit)
   */
  const reload = useCallback(async () => {
    setIsInitialized(false);
    await loadSchema();
    if (mode === 'edit' && recordId) {
      await loadRecord(recordId);
    }
    setIsInitialized(true);
  }, [loadSchema, loadRecord, mode, recordId]);

  // Efecto inicial: cargar schema y record si aplica
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        setLoading(true);
        const schemaData = await loadSchema();

        if (isMounted) {
          setSchema(schemaData);

          // Si es modo edit, cargar el registro
          if (mode === 'edit' && recordId) {
            const recordData = await loadRecord(recordId);
            if (isMounted) {
              setRecord(recordData);
            }
          }

          setIsInitialized(true);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (tableName) {
      initialize();
    }

    return () => {
      isMounted = false;
    };
  }, [tableName, mode, recordId, loadSchema, loadRecord]);

  return {
    // Estados
    schema,
    record,
    loading,
    error,
    isInitialized,

    // Acciones
    loadSchema,
    loadRecord,
    createRecord,
    updateRecord,
    submit,
    clearError,
    reload
  };
};

export default useCrudForm;
