import { useState, useEffect, useCallback, useReducer } from 'react';
import { db } from '@/shared/api';
import cacheService from '@/shared/services/cacheService';

/**
 * Reducer para manejar el estado de useCrudForm de forma atómica
 */
const initialState = {
  schema: null,
  record: null,
  loading: false,
  error: null,
  isInitialized: false
};

function crudFormReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_SCHEMA':
      return { ...state, schema: action.payload };
    case 'SET_RECORD':
      return { ...state, record: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload };
    case 'BATCH_UPDATE':
      return { ...state, ...action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

/**
 * Hook para manejar formularios conectados a backend CRUD
 * Maneja carga de schema, datos de registro (modo edit), y submit
 */
export const useCrudForm = (tableName, mode = 'create', recordId = null, primaryKey = 'id') => {
  const [state, dispatch] = useReducer(crudFormReducer, initialState);

  /**
   * Cargar el schema de la tabla
   */
  const loadSchema = useCallback(async () => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      const tableSchema = await db.getTableSchema(tableName);
      dispatch({ type: 'SET_SCHEMA', payload: tableSchema });
      return tableSchema;
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: `Error cargando schema: ${err.message}` });
      throw err;
    }
  }, [tableName]);

  /**
   * Cargar datos de un registro específico (modo edit)
   */
  const loadRecord = useCallback(async (id) => {
    console.log(`[useCrudForm] loadRecord called:`, { id, mode, tableName, primaryKey });
    if (!id || mode !== 'edit') {
      console.log(`[useCrudForm] loadRecord skipped: no id or not edit mode`);
      return null;
    }

    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      dispatch({ type: 'SET_LOADING', payload: true });
      console.log(`[useCrudForm] Fetching record ${id} from ${tableName} with primaryKey ${primaryKey}`);
      const recordData = await db.getById(tableName, id, primaryKey);
      console.log(`[useCrudForm] Record loaded:`, recordData);
      dispatch({ type: 'SET_RECORD', payload: recordData });
      return recordData;
    } catch (err) {
      console.error(`[useCrudForm] Error loading record:`, err);
      dispatch({ type: 'SET_ERROR', payload: `Error cargando registro: ${err.message}` });
      throw err;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [tableName, mode, primaryKey]);

  /**
   * Crear un nuevo registro
   */
  const createRecord = useCallback(async (data) => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      dispatch({ type: 'SET_LOADING', payload: true });
      const result = await db.insert(tableName, data);
      cacheService.invalidateAll();
      return { success: true, data: result };
    } catch (err) {
      console.error('[useCrudForm] createRecord error:', err);
      dispatch({ type: 'SET_ERROR', payload: `Error creando registro: ${err.message}` });
      throw err;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [tableName]);

  /**
   * Actualizar un registro existente
   */
  const updateRecord = useCallback(async (id, data) => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      dispatch({ type: 'SET_LOADING', payload: true });
      const result = await db.update(tableName, id, data, primaryKey);
      cacheService.invalidateAll();
      return { success: true, data: result };
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: `Error actualizando registro: ${err.message}` });
      throw err;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [tableName, primaryKey]);

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
  }, [mode, createRecord, updateRecord, recordId, primaryKey]);

  /**
   * Limpiar errores
   */
  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  /**
   * Recargar todo (schema + record si es modo edit)
   */
  const reload = useCallback(async () => {
    dispatch({ type: 'SET_INITIALIZED', payload: false });
    await loadSchema();
    if (mode === 'edit' && recordId) {
      await loadRecord(recordId);
    }
    dispatch({ type: 'SET_INITIALIZED', payload: true });
  }, [loadSchema, loadRecord, mode, recordId, primaryKey]);

  // Efecto inicial: cargar schema y record si aplica
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        // Establecer loading=true al inicio
        dispatch({ type: 'SET_LOADING', payload: true });
        
        const schemaData = await loadSchema();

        if (isMounted) {
          // Si es modo edit, cargar el registro
          if (mode === 'edit' && recordId) {
            const recordData = await loadRecord(recordId);
            if (isMounted) {
              // Batch update: schema, record, isInitialized, loading=false en un solo render
              dispatch({ 
                type: 'BATCH_UPDATE', 
                payload: { 
                  schema: schemaData, 
                  record: recordData, 
                  isInitialized: true, 
                  loading: false,
                  error: null
                } 
              });
            }
          } else {
            // Batch update: schema, isInitialized, loading=false en un solo render
            dispatch({ 
              type: 'BATCH_UPDATE', 
              payload: { 
                schema: schemaData, 
                isInitialized: true, 
                loading: false,
                error: null
              } 
            });
          }
        }
      } catch (err) {
        if (isMounted) {
          dispatch({ 
            type: 'BATCH_UPDATE', 
            payload: { 
              error: err.message, 
              loading: false 
            } 
          });
        }
      }
    };

    if (tableName) {
      initialize();
    }

    return () => {
      isMounted = false;
    };
  }, [tableName, mode, recordId, primaryKey, loadSchema, loadRecord]);

  return {
    // Estados
    schema: state.schema,
    record: state.record,
    loading: state.loading,
    error: state.error,
    isInitialized: state.isInitialized,

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
