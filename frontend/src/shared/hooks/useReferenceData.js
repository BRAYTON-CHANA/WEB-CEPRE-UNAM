import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { db } from '@/shared/api';
import cacheService from '@/shared/services/cacheService';

// Cache simple por sesión con clave compuesta para evitar colisiones
const cache = new Map();

// Cache para promesas en progreso (evita peticiones duplicadas simultáneas)
const pendingRequests = new Map();

// Cache para opciones calculadas (evita recálculos duplicados)
const optionsCache = new Map();

// Generar clave de cache más robusta
const generateCacheKey = (tableName, neededFields, filters) => {
  const fieldsKey = [...neededFields].sort().join(',');
  const filtersKey = filters && filters.length > 0 ? `:${JSON.stringify(filters)}` : '';
  return `${tableName}:${fieldsKey}${filtersKey}`;
};

// Generar clave de cache para opciones calculadas
const generateOptionsCacheKey = (dataCacheKey, labelTemplate, labelField, descriptionField) => {
  return `${dataCacheKey}:${labelTemplate || labelField || ''}:${descriptionField || ''}`;
};

/**
 * Helper para formatear template con campos dinámicos
 * Ej: "{APELLIDOS}, {NOMBRES}" -> "Pérez, Juan"
 */
const formatTemplate = (template, record) =>
  template.replace(/\{(\w+)\}/g, (_, field) => record[field] ?? '');

/**
 * Extraer campos de un template
 * Ej: "{NOMBRE_AREA} - {ACTIVO}" -> ['NOMBRE_AREA', 'ACTIVO']
 */
const extractFieldsFromTemplate = (template) => {
  if (!template) return [];
  const matches = template.match(/\{(\w+)\}/g) || [];
  return matches.map(m => m.replace(/[{}]/g, ''));
};

/**
 * Hook para cargar datos de referencia (FK) con display legible
 * @param {Object} config - Configuración del select
 * @param {string} config.tableName - Tabla de referencia (también soporta views)
 * @param {string} config.valueField - Campo PK (value)
 * @param {string} [config.labelField] - Campo a mostrar
 * @param {string} [config.labelTemplate] - Template con campos {CAMPO}
 * @param {string} [config.descriptionField] - Campo para descripción
 * @param {Array} [config.filters] - Filtros [{field, op, value}]
 * @returns {Object} - { options, loading, refresh }
 */
export const useReferenceData = (config) => {
  // Extraer valores de config de forma segura (funciona incluso si config es null)
  const tableName = config?.tableName;
  const valueField = config?.valueField;
  const labelField = config?.labelField;
  const labelTemplate = config?.labelTemplate;
  const descriptionField = config?.descriptionField;
  const filters = config?.filters;
  const referenceSelfValue = config?.referenceSelfValue;  // ← NUEVO: Valor self para post-procesado
  const referenceSelfFilter = config?.referenceSelfFilter; // ← NUEVO: Filtros adicionales para self loading
  const referenceOriginalValue = config?.referenceOriginalValue; // ← NUEVO: Valor original al abrir edición
  const [records, setRecords] = useState([]);
  const [selfRecord, setSelfRecord] = useState(null);
  const [originalRecord, setOriginalRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const hasAttemptedLoad = useRef(false);
  const hasLoggedOptions = useRef(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Log inicial de configuración (solo en desarrollo y solo una vez por config única)
  // console.log('reference-select: Iniciando hook con config:', config);

  // Calcular campos necesarios para el template o fields fijos
  const neededFields = useMemo(() => {
    const fields = [valueField];
    
    if (labelTemplate) {
      // Extraer campos del template
      const templateFields = extractFieldsFromTemplate(labelTemplate);
      fields.push(...templateFields);
    } else if (labelField) {
      fields.push(labelField);
    }
    
    if (descriptionField) fields.push(descriptionField);
    
    const uniqueFields = [...new Set(fields)]; // Eliminar duplicados
    // Solo loguear si es la primera vez o cambian los campos
    // if (!hasAttemptedLoad.current) {
    //   console.log('reference-select: Campos necesarios calculados:', uniqueFields);
    // }
    return uniqueFields;
  }, [valueField, labelField, labelTemplate, descriptionField]);

  // Generar clave de cache robusta
  const cacheKey = useMemo(() => {
    return generateCacheKey(tableName, neededFields, filters);
  }, [tableName, neededFields, filters]);

  // Crear un memo para la configuración completa
  const loadConfig = useMemo(() => ({
    tableName,
    neededFields,
    cacheKey,
    valueField,
    filters
  }), [tableName, neededFields, cacheKey, valueField, filters]);

  const load = useCallback(async () => {
    // No cargar si no hay configuración válida
    if (!tableName || !valueField) {
      return;
    }
    
    // Evitar cargas duplicadas si ya se intentó cargar en esta instancia
    if (hasAttemptedLoad.current) {
      return;
    }

    // No cargar si faltan parámetros esenciales
    if (!loadConfig.tableName || !loadConfig.valueField) {
      console.warn('[useReferenceData] Faltan parámetros esenciales:', {
        tableName: loadConfig.tableName,
        valueField: loadConfig.valueField
      });
      setRecords([]);
      hasAttemptedLoad.current = true;
      return;
    }

    // Si ya hay una petición en progreso para esta clave, esperarla
    if (pendingRequests.has(loadConfig.cacheKey)) {
      try {
        const data = await pendingRequests.get(loadConfig.cacheKey);
        setRecords(data);
        hasAttemptedLoad.current = true;
        return;
      } catch (err) {
        // Si la petición pendiente falló, continuar para intentar de nuevo
      }
    }

    // Usar cache si existe (la cacheKey ya incluye los valores de filtros resueltos,
    // así que si la clave es la misma los datos son válidos independientemente de si hay filtros)
    if (cache.has(loadConfig.cacheKey)) {
      setRecords(cache.get(loadConfig.cacheKey));
      hasAttemptedLoad.current = true;
      return;
    }

    setLoading(true);

    // Crear la promesa y guardarla en pendingRequests
    // Pasar objeto vacío si filters es undefined para evitar problemas en el backend
    const filtersToUse = loadConfig.filters || {};
    const promise = db.select(loadConfig.tableName, filtersToUse, loadConfig.neededFields);
    pendingRequests.set(loadConfig.cacheKey, promise);
    
    try {
      const data = await promise;
      cache.set(loadConfig.cacheKey, data);
      // Guard: evitar setRecords si datos idénticos (evita re-renders innecesarios)
      setRecords(prev => {
        try {
          if (JSON.stringify(prev) === JSON.stringify(data)) return prev;
        } catch (_) { /* fallthrough */ }
        return data;
      });
    } catch (err) {
      console.error('reference-select: Error cargando datos de referencia:', err);
      console.error('reference-select: Configuración del error:', loadConfig);
    } finally {
      pendingRequests.delete(loadConfig.cacheKey);
      setLoading(false);
      hasAttemptedLoad.current = true;
    }
  }, [loadConfig]);

  // Resetear hasAttemptedLoad cuando cambia la cacheKey (que refleja tabla + campos + filtros resueltos)
  // Usar cacheKey en vez de filters evita resets por nueva referencia de array con mismos valores
  useEffect(() => {
    hasAttemptedLoad.current = false;
  }, [cacheKey]);

  // Resetear hasLoggedOptions cuando cambian los parámetros que afectan las opciones
  useEffect(() => {
    hasLoggedOptions.current = false;
  }, [labelTemplate, labelField, descriptionField]);

  useEffect(() => {
    load();
  }, [load, refreshTrigger]);

  // Efecto para escuchar invalidaciones de cache
  useEffect(() => {
    const unsubscribe = cacheService.subscribe((event) => {
      if (event.all || event.tableName === tableName) {
        // Limpiar todos los caches relacionados con esta tabla
        if (event.all) {
          // Limpiar cache de datos
          for (const [key] of cache) {
            if (key.startsWith(tableName + ':')) {
              cache.delete(key);
            }
          }
          // Limpiar cache de opciones
          for (const [key] of optionsCache) {
            if (key.startsWith(tableName + ':')) {
              optionsCache.delete(key);
            }
          }
        } else {
          // Limpiar entrada específica
          cache.delete(cacheKey);
          // Limpiar opciones relacionadas
          for (const [key] of optionsCache) {
            if (key.startsWith(cacheKey)) {
              optionsCache.delete(key);
            }
          }
        }
        
        // Resetear estado y forzar recarga
        hasAttemptedLoad.current = false;
        setRecords([]);
        setRefreshTrigger(prev => prev + 1);
      }
    });

    return unsubscribe;
  }, [tableName, cacheKey]);

  // ← NUEVO: Cargar registro self cuando no está en los datos filtrados
  useEffect(() => {
    const loadSelfRecord = async () => {
      // Solo cargar si tenemos config válida, un valor self, y no está cargando
      // ← FIX: Eliminado records.length === 0 para cargar self record aunque no haya registros filtrados
      if (!tableName || !valueField || !referenceSelfValue || loading) {
        //console.log(`[useReferenceData] Skip self load:`, { tableName, valueField, referenceSelfValue, loading, recordsCount: records.length });
        return;
      }

      // Verificar si el valor self ya existe en los registros cargados
      const selfExists = records.some(r => String(r[valueField]) === String(referenceSelfValue));
      //console.log(`[useReferenceData] referenceSelfValue=${referenceSelfValue}, exists=${selfExists}, totalRecords=${records.length}`);
      
      if (selfExists) {
        //console.log(`[useReferenceData] Valor self ya existe en registros, no necesita cargar separado`);
        setSelfRecord(null);
        return;
      }

      // El valor self no existe, necesitamos cargarlo
      //console.log(`[useReferenceData] Cargando registro self: ${valueField}=${referenceSelfValue}`);
      //console.log(`[useReferenceData] Filtros adicionales para self:`, referenceSelfFilter);
      try {
        // ← NUEVO: Combinar filtro base con filtros adicionales de referenceSelfFilter
        const baseSelfFilter = { field: valueField, op: '=', value: referenceSelfValue };
        const additionalFilters = referenceSelfFilter || [];
        const selfFilter = [baseSelfFilter, ...additionalFilters];
        
        // ← DEBUG: Mostrar filtros exactos que se envían
        //console.log(`[useReferenceData] 🔍 Filtros SELF enviados a API:`, JSON.stringify(selfFilter, null, 2));
        //console.log(`[useReferenceData] 🔍 Tabla: ${tableName}, Campos: ${neededFields.join(',')}`);
        
        const data = await db.select(tableName, selfFilter, neededFields);
        
        // ← DEBUG: Mostrar respuesta completa
        //console.log(`[useReferenceData] 📦 Respuesta de API:`, response.data);
        
        const records = response.data?.records || response.data || [];
        //console.log(`[useReferenceData] 📊 Total registros devueltos: ${records.length}`);
        
        if (records.length > 0) {
          //console.log(`[useReferenceData] 📋 Primer registro:`, records[0]);
          //console.log(`[useReferenceData] 📋 Valor ${valueField} en registro: ${records[0][valueField]}`);
        }
        
        const selfData = records[0];
        if (selfData) {
          console.log(`[useReferenceData] ✅ Registro self seleccionado:`, selfData);
          setSelfRecord(selfData);
        } else {
          console.warn(`[useReferenceData] ⚠️ No se encontró registro self para ${valueField}=${referenceSelfValue}`);
          setSelfRecord(null);
        }
      } catch (err) {
        console.error(`[useReferenceData] ❌ Error cargando registro self:`, err);
        setSelfRecord(null);
      }
    };

    loadSelfRecord();
  }, [tableName, valueField, referenceSelfValue, records, loading, neededFields, referenceSelfFilter]);

  // ← NUEVO: Cargar registro original (valor inicial al abrir edición) - solo una vez
  useEffect(() => {
    const loadOriginalRecord = async () => {
      // Solo cargar si tenemos config válida y un valor original
      if (!tableName || !valueField || !referenceOriginalValue || loading) {
        return;
      }

      // Ya está cargado, no recargar
      if (originalRecord) {
        return;
      }

      console.log(`[useReferenceData] Cargando registro ORIGINAL: ${valueField}=${referenceOriginalValue}`);
      
      try {
        const data = await db.select(tableName, { [valueField]: referenceOriginalValue }, neededFields);
        
        const records = data || [];
        const originalData = records[0];
        
        if (originalData) {
          console.log(`[useReferenceData] ✅ Registro original cargado:`, originalData);
          setOriginalRecord(originalData);
        } else {
          console.warn(`[useReferenceData] ⚠️ No se encontró registro original para ${valueField}=${referenceOriginalValue}`);
        }
      } catch (err) {
        console.error(`[useReferenceData] ❌ Error cargando registro original:`, err);
      }
    };

    loadOriginalRecord();
  }, [tableName, valueField, referenceOriginalValue, loading, neededFields]);

  // Transformar a opciones
  const options = useMemo(() => {
    // Retornar opciones vacías si no hay configuración válida
    if (!tableName || !valueField) {
      return [];
    }
    
    // ← NUEVO: Detectar si hay filtros activos
    const hasFilters = filters && filters.length > 0;
    
    // Generar clave de cache para opciones
    const optionsCacheKey = generateOptionsCacheKey(cacheKey, labelTemplate, labelField, descriptionField);
    
    // ← CAMBIO: Solo usar cache si NO hay filtros activos (datos deben ser frescos con filtros)
    if (!hasFilters && optionsCache.has(optionsCacheKey)) {
      const cachedOptions = optionsCache.get(optionsCacheKey);
      // Solo loguear la primera vez que usamos cache
      if (records.length > 0 && !hasLoggedOptions.current) {
        //console.log(`reference-select: Usando opciones cacheadas para tabla: ${tableName} (${cachedOptions.length} opciones)`);
        hasLoggedOptions.current = true;
      }
      return cachedOptions;
    }
    
    // ← NUEVO: Combinar records con originalRecord y selfRecord si existen
    // originalRecord: valor inicial al abrir edición (persiste)
    // selfRecord: valor actual seleccionado (cambia con selección)
    const allRecords = [
      ...records,
      ...(originalRecord && !records.some(r => String(r[valueField]) === String(originalRecord[valueField])) ? [originalRecord] : []),
      ...(selfRecord && !records.some(r => String(r[valueField]) === String(selfRecord[valueField])) && (!originalRecord || String(selfRecord[valueField]) !== String(originalRecord[valueField])) ? [selfRecord] : [])
    ].filter(Boolean);
    
    //console.log(`[useReferenceData] Transformando opciones: ${records.length} registros + ${originalRecord ? 1 : 0} original + ${selfRecord ? 1 : 0} self = ${allRecords.length} total`);
    
    const transformedOptions = allRecords.map(r => {
      const label = labelTemplate
        ? formatTemplate(labelTemplate, r)
        : String(r[labelField] ?? '');

      return {
        value: r[valueField],
        label,
        description: descriptionField ? r[descriptionField] : null,
        raw: r
      };
    });
    
    // ← DEBUG: Mostrar todos los valores de las opciones
    const optionValues = transformedOptions.map(o => o.value);
    const uniqueValues = [...new Set(optionValues)];
    //console.log(`[useReferenceData] Opciones valores:`, optionValues);
    //console.log(`[useReferenceData] Valores únicos:`, uniqueValues, `Total: ${optionValues.length}, Únicos: ${uniqueValues.length}`);
    if (optionValues.length !== uniqueValues.length) {
      console.error(`[useReferenceData] ⚠️ DUPLICADOS DETECTADOS!`);
      // Encontrar duplicados
      const duplicates = optionValues.filter((item, index) => optionValues.indexOf(item) !== index);
      console.error(`[useReferenceData] Valores duplicados:`, [...new Set(duplicates)]);
    }
    
    // ← CAMBIO: Solo guardar en cache si NO hay filtros activos y NO hay selfRecord
    if (!hasFilters && !selfRecord && transformedOptions.length > 0) {
      optionsCache.set(optionsCacheKey, transformedOptions);
      //console.log(`reference-select: Opciones calculadas y cacheadas para tabla: ${tableName} (${transformedOptions.length} opciones)`);
    }
    
    return transformedOptions;
  }, [records, selfRecord, labelTemplate, labelField, valueField, descriptionField, tableName, cacheKey, filters]);

  return { options, loading, refresh: load };
};

export default useReferenceData;
