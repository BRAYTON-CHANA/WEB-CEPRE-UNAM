import { useState, useCallback } from 'react';
import functionService from '../services/functionService';

/**
 * Hook para ejecutar funciones SQL del backend
 * @param {string} functionName - Nombre de la función por defecto (opcional)
 * @returns {Object} - Estado y funciones para ejecutar
 */
export const useFunction = (functionName = null) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Ejecutar función con parámetros
   * @param {Object} params - Parámetros para la función
   * @param {string} overrideFunctionName - Nombre opcional para sobreescribir el default
   * @returns {Array} - Resultados de la función
   */
  const execute = useCallback(async (params = {}, overrideFunctionName = null) => {
    const fnName = overrideFunctionName || functionName;
    
    if (!fnName) {
      throw new Error('Se requiere nombre de función (pase como parámetro o en el hook)');
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await functionService.execute(fnName, params);
      setData(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [functionName]);

  /**
   * Ejecutar función específica por nombre
   * Útil cuando no se definió functionName en el hook
   * @param {string} fnName - Nombre de la función
   * @param {Object} params - Parámetros
   */
  const executeFunction = useCallback(async (fnName, params = {}) => {
    return execute(params, fnName);
  }, [execute]);

  /**
   * Limpiar error
   */
  const clearError = useCallback(() => setError(null), []);

  /**
   * Resetear estado
   */
  const reset = useCallback(() => {
    setData([]);
    setError(null);
    setLoading(false);
  }, []);

  return {
    // Estado
    data,
    loading,
    error,
    
    // Acciones
    execute,
    executeFunction,
    clearError,
    reset
  };
};

/**
 * Hook específico para obtener cursos disponibles de un docente
 * Wrapper de useFunction con configuración predefinida
 * @returns {Object} - Estado y función getCursos
 */
export const useCursosDisponiblesDocente = () => {
  const { execute, ...rest } = useFunction('fn_cursos_disponibles_docente');

  /**
   * Obtener cursos disponibles para un docente
   * @param {number} idDocente - ID del docente
   * @param {number|null} idCursoActual - ID del curso actual (null para modo creación)
   * @returns {Array} - Lista de cursos con estado ACTUAL/DISPONIBLE
   */
  const getCursos = useCallback(async (idDocente, idCursoActual = null) => {
    return execute({
      ID_DOCENTE: idDocente,
      ID_CURSO_ACTUAL: idCursoActual
    });
  }, [execute]);

  return {
    ...rest,
    getCursos,
    execute
  };
};

/**
 * Hook para listar funciones disponibles
 * @returns {Object} - Estado y función listar
 */
export const useListFunctions = () => {
  const [functions, setFunctions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const listFunctions = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await functionService.listFunctions();
      setFunctions(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    functions,
    loading,
    error,
    listFunctions,
    clearError
  };
};
