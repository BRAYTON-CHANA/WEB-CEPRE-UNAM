import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import functionService from '@/shared/services/functionService';
import cacheService from '@/shared/services/cacheService';

// Cache simple por sesión
const cache = new Map();
const pendingRequests = new Map();

/**
 * Helper para formatear templates con valores de formData
 * Ej: "{ID_DOCENTE}" -> "123"
 */
const formatTemplate = (template, data) => {
  if (!template || typeof template !== 'string') return template;
  return template.replace(/\{(\w+)\}/g, (_, fieldName) => data[fieldName] ?? '');
};

/**
 * Hook para cargar datos de funciones SQL con soporte de templates dinámicos
 * @param {Object} config - Configuración de la función
 * @param {string} config.functionName - Nombre del archivo .sql
 * @param {Object} config.functionParams - Parámetros con soporte templates {CAMPO}
 * @param {string} config.valueField - Campo para 'value'
 * @param {string} config.labelField - Campo para 'label'
 * @param {string} config.descriptionField - Campo para descripción
 * @param {string} config.statusField - Campo de estado ACTUAL/DISPONIBLE
 * @param {boolean} config.shouldLoadData - Si debe cargar datos (no bloqueado/oculto)
 * @param {Object} config.formData - Datos del formulario para templates
 * @returns {Object} - { options, loading, error, processedParams }
 */
export const useFunctionData = (config) => {
  const {
    functionName,
    functionParams,
    optionalParams = [],
    valueField,
    labelField,
    descriptionField,
    statusField,
    shouldLoadData = true,
    formData = {},
    freezeParams = false
  } = config || {};

  console.log(`[useFunctionData:${functionName}] Config received:`, {
    functionName,
    functionParams,
    optionalParams,
    shouldLoadData,
    formData,
    formDataKeys: Object.keys(formData),
    formDataValues: formData
  });

  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const hasLoadedRef = useRef(false);
  const frozenParamsRef = useRef(null);

  // Procesar templates en functionParams {CAMPO} -> valor de formData
  const processedParams = useMemo(() => {
    if (!functionParams || Object.keys(functionParams).length === 0) {
      return {};
    }

    const processed = {};
    Object.entries(functionParams).forEach(([key, value]) => {
      let rawValue;
      if (typeof value === 'string' && value.includes('{')) {
        const fieldName = value.replace(/[{}]/g, '');
        rawValue = formData[fieldName] ?? '';
      } else {
        rawValue = value;
      }
      // Convertir string vacío a null para evitar errores de tipo en PostgreSQL
      processed[key] = rawValue === '' ? null : rawValue;
    });

    console.log(`[useFunctionData:${functionName}] Processed params:`, processed);
    return processed;
  }, [functionParams, formData, functionName]);

  // Verificar si todos los templates tienen valor
  const hasAllRequiredValues = useMemo(() => {
    for (const [key, value] of Object.entries(processedParams)) {
      const isOptional = optionalParams?.includes(key);
      const hasValue = value !== '' && value !== null && value !== undefined;
      
      // Solo fallar si NO es opcional y NO tiene valor
      if (!isOptional && !hasValue) {
        return false;
      }
    }
    return true;
  }, [processedParams, optionalParams]);

  // Si freezeParams, usar params congelados del primer load
  const activeParams = useMemo(() => {
    if (!freezeParams) return processedParams;
    if (frozenParamsRef.current !== null) return frozenParamsRef.current;
    if (hasAllRequiredValues) {
      frozenParamsRef.current = processedParams;
      return processedParams;
    }
    return processedParams;
  }, [freezeParams, processedParams, hasAllRequiredValues]);

  // Generar cache key
  const cacheKey = useMemo(() => {
    return `${functionName}:${JSON.stringify(freezeParams ? (frozenParamsRef.current ?? activeParams) : activeParams)}`;
  }, [functionName, activeParams, freezeParams]);

  // Función para cargar datos (memoizada)
  const loadData = useCallback(async () => {
    if (!functionName || !shouldLoadData || !hasAllRequiredValues) {
      setOptions([]);
      return;
    }

    // Usar cache si está disponible
    if (cache.has(cacheKey)) {
      setOptions(cache.get(cacheKey));
      hasLoadedRef.current = true;
      return;
    }

    // Evitar peticiones duplicadas simultáneas
    if (pendingRequests.has(cacheKey)) {
      const data = await pendingRequests.get(cacheKey);
      setOptions(data);
      hasLoadedRef.current = true;
      return;
    }

    setLoading(true);
    setError(null);

    // Crear promise y guardarla para evitar duplicados
    const requestPromise = (async () => {
      try {
        const data = await functionService.execute(functionName, freezeParams ? (frozenParamsRef.current ?? activeParams) : activeParams);
        
        // Transformar al formato de opciones
        // Soporta templates en labelField y descriptionField: '{CAMPO}' -> valor del registro
        const formatOptionTemplate = (template, record) => {
          if (!template || typeof template !== 'string') return '';
          if (!template.includes('{')) return record[template] ?? template;
          return template.replace(/\{(\w+)\}/g, (_, fieldName) => record[fieldName] ?? '');
        };

        const formattedOptions = data.map((record) => ({
          value: record[valueField],
          label: formatOptionTemplate(labelField, record),
          description: formatOptionTemplate(descriptionField, record),
          status: record[statusField],
          raw: record
        }));

        cache.set(cacheKey, formattedOptions);
        
        return formattedOptions;
      } catch (err) {
        console.error('[useFunctionData] Error:', err.message);
        throw err;
      }
    })();

    pendingRequests.set(cacheKey, requestPromise);

    try {
      const formattedOptions = await requestPromise;
      setOptions(formattedOptions);
      hasLoadedRef.current = true;
    } catch (err) {
      setError(err.message);
      setOptions([]);
    } finally {
      pendingRequests.delete(cacheKey);
      setLoading(false);
    }
  }, [cacheKey, functionName, shouldLoadData, hasAllRequiredValues, valueField, labelField, descriptionField, statusField, activeParams, freezeParams]);

  // Efecto para carga inicial y cuando cambian dependencias
  useEffect(() => {
    loadData();
  }, [loadData, refreshTrigger]);

  // Efecto para escuchar invalidaciones de cache
  useEffect(() => {
    const unsubscribe = cacheService.subscribe((event) => {
      if (event.all || event.functionName === functionName) {
        // Limpiar cache Y pendingRequests de esta función
        if (event.all) {
          for (const [key] of cache) {
            if (key.startsWith(functionName + ':')) {
              cache.delete(key);
            }
          }
          for (const [key] of pendingRequests) {
            if (key.startsWith(functionName + ':')) {
              pendingRequests.delete(key);
            }
          }
        } else {
          cache.delete(cacheKey);
          pendingRequests.delete(cacheKey);
        }

        // Forzar recarga
        hasLoadedRef.current = false;
        setRefreshTrigger(prev => prev + 1);
      }
    });

    return unsubscribe;
  }, [functionName, cacheKey]);

  const refresh = useCallback(() => {
    frozenParamsRef.current = null;
    hasLoadedRef.current = false;
    cache.delete(cacheKey);
    pendingRequests.delete(cacheKey);
    setRefreshTrigger(prev => prev + 1);
  }, [cacheKey]);

  return { options, loading, error, processedParams: activeParams, refresh };
};
