import React, { useState, useEffect, useMemo, useRef } from 'react';
import SelectInput from './SelectInput';
import { useReferenceData } from '@/shared/hooks/useReferenceData';
import { evaluateOperatorSet } from '@/features/form/utils/conditionEvaluator';
import crudService from '@/shared/services/crudService';

/**
 * Helper para formatear template con valores de formData
 * Ej: "{ID_PERIODO}" -> "123"
 */
const formatTemplate = (template, data) => {
  if (!template || typeof template !== 'string') return template;
  return template.replace(/\{(\w+)\}/g, (_, fieldName) => data[fieldName] ?? '');
};

/**
 * SelectInput para referencias foráneas (FK) con display legible
 * @param {string} referenceTable - Tabla de referencia (también soporta views)
 * @param {string} referenceField - Campo PK (value guardado)
 * @param {string} [referenceLabelField] - Campo a mostrar (alternativa a template)
 * @param {string} [referenceQuery] - Template con campos {CAMPO}
 * @param {string} [referenceDescriptionField] - Campo para descripción secundaria
 * @param {Array} [referenceFilters] - Filtros [{field, op, value}] - soporta templates {CAMPO}
 * @param {boolean} [referenceSelf] - Si es true, obtiene solo el registro actual
 * @param {string} [referenceSelfTable] - Tabla/vista externa para cargar valor (ej: 'VW_CURSO_AREA')
 * @param {Array} [referenceSelfFilter] - Filtros para consulta externa con templates {CAMPO}
 * @param {string} [referenceSelfValueColumn] - Columna del resultado a usar como valor
 * @param {function} [watch] - React Hook Form watch function
 * @param {function} [setValue] - React Hook Form setValue function
 * @param {Object} [blocked] - Condición de bloqueo
 * @param {Object} [hidden] - Condición de ocultamiento
 * @param {Object} [formData] - Datos del formulario para evaluar condiciones y templates
 */
const ReferenceSelectInput = React.memo(({
  name,
  label,
  referenceTable,
  referenceField,
  referenceLabelField,
  referenceQuery,
  referenceDescriptionField,
  referenceFilters,
  searchable = false,
  referenceSelf = false,
  referenceSelfFilter,      // Filtros adicionales para self loading
  referenceSelfTable,       // ← NUEVO: Tabla/vista externa para cargar valor
  referenceSelfValueColumn, // ← NUEVO: Columna del resultado a usar como valor
  watch,
  referenceOriginalValue,   // Valor original al abrir edición (persiste)
  setValue,
  blocked = null,
  hidden = null,
  formData = {},
  ...props
}) => {
  // Estado para manejar errores
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // ← NUEVO: Capturar valor original en el primer render (sticky durante edición)
  const originalValueRef = useRef(referenceOriginalValue || props.value);
  
  // ← NUEVO: Obtener valor actual directamente (sin estado local)
  const currentValue = useMemo(() => {
    if (watch && typeof watch === 'function') {
      return watch(name);
    } else if (props.value !== undefined) {
      return props.value;
    }
    return null;
  }, [watch, name, props.value]);

  // Evaluar si el campo está bloqueado u oculto
  const isBlocked = useMemo(() => {
    if (!blocked) return false;
    return evaluateOperatorSet(blocked, formData);
  }, [blocked, formData, name]);

  const isHidden = useMemo(() => {
    if (!hidden) return false;
    return evaluateOperatorSet(hidden, formData);
  }, [hidden, formData]);

  // Solo hacer consulta si no está bloqueado ni oculto
  const shouldLoadData = !isBlocked && !isHidden;

  // Procesar filtros con templates dinámicos {CAMPO} -> valor de formData
  const processedFilters = useMemo(() => {
    if (!referenceFilters || referenceFilters.length === 0) return referenceFilters;
    if (!formData || Object.keys(formData).length === 0) return referenceFilters;

    return referenceFilters.map(filter => {
      // Si el valor es un string y contiene {, procesar templates
      if (typeof filter.value === 'string' && filter.value.includes('{')) {
        const processedValue = formatTemplate(filter.value, formData);
        return { ...filter, value: processedValue };
      }
      return filter;
    });
  }, [referenceFilters, formData]);

  // ← NUEVO: Procesar referenceSelfFilter con templates dinámicos
  const processedSelfFilters = useMemo(() => {
    if (!referenceSelfFilter || referenceSelfFilter.length === 0) return referenceSelfFilter;

    const result = referenceSelfFilter.map(filter => {
      if (typeof filter.value === 'string' && filter.value.includes('{')) {
        // ← CAMBIO: Si el campo del filtro es el mismo que referenceField, usar currentValue directamente
        // Esto evita depender de formData que puede estar vacío inicialmente
        if (filter.field === referenceField) {
          return { ...filter, value: currentValue };
        }
        // Para otros campos, usar formData si está disponible
        if (formData && Object.keys(formData).length > 0) {
          const processedValue = formatTemplate(filter.value, formData);
          return { ...filter, value: processedValue };
        }
      }
      return filter;
    });
    return result;
  }, [referenceSelfFilter, formData, referenceField, currentValue, name]);

  // Configuración para useReferenceData
  const config = useMemo(() => {
    
    return {
      tableName: referenceTable,
      valueField: referenceField,
      labelField: referenceLabelField,
      labelTemplate: referenceQuery,
      descriptionField: referenceDescriptionField,
      filters: processedFilters,
      referenceSelfValue: referenceSelf ? currentValue : null,
      referenceSelfFilter: processedSelfFilters, // ← NUEVO: Filtros adicionales para self loading
      referenceOriginalValue: referenceSelf ? originalValueRef.current : null // ← NUEVO: Valor original (sticky)
    };
  }, [
    referenceTable, referenceField, referenceLabelField, referenceQuery,
    referenceDescriptionField, processedFilters, referenceSelf, currentValue, processedSelfFilters, referenceOriginalValue
  ]);

  const { options, loading } = useReferenceData(shouldLoadData ? config : null);

  // Manejar caso donde no se encuentra el registro
  useEffect(() => {
    // ← CAMBIO: No aplicar cuando referenceSelf está activo (el registro self se carga por separado)
    if (!referenceSelf && currentValue && !loading && options.length === 0) {
      // ← NUEVO: Delay de 500ms para dar tiempo a que los datos carguen en primer render
      const timeoutId = setTimeout(() => {
        // Re-verificar condiciones después del delay (por si los datos ya cargaron)
        if (!referenceSelf && currentValue && !loading && options.length === 0) {
          // No se encontró el registro - mostrar error y limpiar
          setErrorMessage(`El valor seleccionado (${currentValue}) no existe en la tabla ${referenceTable}. El campo será limpiado para evitar errores.`);
          setShowErrorModal(true);
          
          // Limpiar el campo
          if (setValue && typeof setValue === 'function') {
            // React Hook Form
            setValue(name, '');
          } else if (props.onChange && typeof props.onChange === 'function') {
            // Sistema personalizado - llamar al onChange
            props.onChange({ target: { name, value: '' } });
          }
        }
      }, 500); // 500ms delay
      
      return () => clearTimeout(timeoutId);
    }
  }, [referenceSelf, currentValue, loading, options.length, referenceTable, name, setValue, props.onChange]);

  // NOTA: Removido useEffect de auto-limpieza de valor al cambiar filtros.
  // Causaba loop infinito: filters cambian → limpia value → onChange → parent re-render → filters nuevo ref → loop.
  // El reset de valores dependientes debe hacerlo el padre en su handler de onChange.

  // ← NUEVO: Cargar valor desde tabla externa cuando se usa referenceSelfTable
  // Útil para campos ignoreField que necesitan obtener su valor dinámicamente
  useEffect(() => {
    // Early return si no hay configuración de referenceSelfTable
    if (!referenceSelfTable || !referenceSelfValueColumn) {
      return;
    }
    
    const loadValueFromExternalTable = async () => {
      console.log(`[ReferenceSelectInput:${name}] 🔍 INICIANDO loadValueFromExternalTable`);
      console.log(`[ReferenceSelectInput:${name}] 📋 Config:`, { 
        referenceSelfTable, 
        referenceSelfValueColumn, 
        referenceSelfFilter,
        currentValue,
        formDataKeys: Object.keys(formData || {})
      });
      
      // Procesar filtros con templates dinámicos
      const filters = referenceSelfFilter?.map(filter => {
        if (typeof filter.value === 'string' && filter.value.includes('{')) {
          const resolvedValue = formatTemplate(filter.value, formData);
          console.log(`[ReferenceSelectInput:${name}] 📝 Resolviendo template "${filter.value}" -> "${resolvedValue}"`);
          return { ...filter, value: resolvedValue };
        }
        return filter;
      }) || [];
      
      console.log(`[ReferenceSelectInput:${name}] 🔍 Filtros procesados:`, filters);
      
      // Verificar que todos los filtros tengan valores resueltos
      const hasEmptyFilters = filters.some(f => !f.value || f.value === '' || f.value.includes('{'));
      if (hasEmptyFilters) {
        console.log(`[ReferenceSelectInput:${name}] ⚠️ Filtros con valores vacíos, cancelando consulta`);
        return;
      }
      
      try {
        console.log(`[ReferenceSelectInput:${name}] 🚀 Consultando ${referenceSelfTable} con filtros:`, filters);
        const response = await crudService.getTableData(referenceSelfTable, {
          fields: [referenceSelfValueColumn],
          filters: filters,
          page: 1,
          pageSize: 1
        });
        
        console.log(`[ReferenceSelectInput:${name}] 📦 Respuesta recibida:`, response.data);
        
        const records = response.data?.records || response.data || [];
        console.log(`[ReferenceSelectInput:${name}] 📊 Registros encontrados:`, records.length);
        
        if (records.length > 0) {
          let extractedValue = records[0][referenceSelfValueColumn];
          // Convertir a número si es posible (para que coincida con el tipo del select)
          if (extractedValue !== undefined && extractedValue !== null) {
            const numericValue = Number(extractedValue);
            if (!isNaN(numericValue)) {
              extractedValue = numericValue;
            }
          }
          // Solo establecer si el valor es diferente al actual (evitar loops)
          const currentNum = Number(currentValue);
          const extractedNum = Number(extractedValue);
          console.log(`[ReferenceSelectInput:${name}] 🔍 Comparando valores: extractedValue="${extractedValue}" (type: ${typeof extractedValue}) vs currentValue="${currentValue}" (type: ${typeof currentValue})`);
          console.log(`[ReferenceSelectInput:${name}] 🔍 Como números: extractedNum=${extractedNum} vs currentNum=${currentNum}`);
          
          if (extractedValue !== undefined && extractedNum !== currentNum) {
            console.log(`[ReferenceSelectInput:${name}] ✨ ESTABLECIENDO VALOR:`, extractedValue, `(type: ${typeof extractedValue})`);
            console.log(`[ReferenceSelectInput:${name}] 📋 Método: ${setValue ? 'setValue (React Hook Form)' : 'props.onChange'}`);
            
            if (setValue && typeof setValue === 'function') {
              console.log(`[ReferenceSelectInput:${name}] 🚀 Llamando setValue('${name}', ${extractedValue})`);
              setValue(name, extractedValue);
              console.log(`[ReferenceSelectInput:${name}] ✅ setValue ejecutado`);
            } else if (props.onChange) {
              // Usar formato consistente con BaseInput: onChange(name, value)
              console.log(`[ReferenceSelectInput:${name}] 🚀 Llamando props.onChange('${name}', ${extractedValue})`);
              props.onChange(name, extractedValue);
              console.log(`[ReferenceSelectInput:${name}] ✅ props.onChange ejecutado`);
            } else {
              console.error(`[ReferenceSelectInput:${name}] ❌ No hay método para establecer valor! setValue: ${setValue}, props.onChange: ${props.onChange}`);
            }
          } else {
            console.log(`[ReferenceSelectInput:${name}] ⏭️ Valor igual al actual o undefined, no se actualiza (extractedNum=${extractedNum}, currentNum=${currentNum})`);
          }
        } else {
          console.log(`[ReferenceSelectInput:${name}] ⚠️ No se encontraron registros`);
        }
      } catch (err) {
        console.error(`[ReferenceSelectInput:${name}] 💥 Error cargando valor desde ${referenceSelfTable}:`, err);
      }
    };
    
    loadValueFromExternalTable();
  }, [referenceSelfTable, referenceSelfValueColumn, referenceSelfFilter, formData, name, setValue, props.onChange, currentValue]);

  // Manejar cierre del modal
  const handleErrorModalClose = () => {
    setShowErrorModal(false);
    setErrorMessage('');
  };

  return (
    <>
      <SelectInput
        {...props}
        name={name}
        label={label}
        options={options}
        loading={loading}
        searchable={searchable}
        optionValue="value"
        optionLabel="label"
        optionDescription="description"
      />
      
      {/* Modal de error */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-red-600 mb-2">Valor no válido</h3>
            <p className="text-gray-600 mb-4">{errorMessage}</p>
            <button
              onClick={handleErrorModalClose}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
});

export default ReferenceSelectInput;
