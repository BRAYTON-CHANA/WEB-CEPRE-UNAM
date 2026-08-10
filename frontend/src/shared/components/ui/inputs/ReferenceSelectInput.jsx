import React, { useState, useEffect, useMemo, useRef } from 'react';
import SelectInput from './SelectInput';
import Modal from '@/shared/components/modal/views/Modal';
import { useReferenceData } from '@/shared/hooks/useReferenceData';
import { evaluateOperatorSet } from '@/shared/components/form/utils/conditionEvaluator';
import { db } from '@/shared/api';

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
  onReferenceSelectLoadComplete = null,
  showRefreshButton = false,
  showAddButton = false,
  addComponent: AddComponent = null,
  addModalTitle = 'Nueva referencia',
  addModalSize = 'lg',
  referenceDisplayFields = [],
  required = false,
  ...props
}) => {
  // Estado para manejar errores
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Estado para modal de agregar
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addSuccessRecord, setAddSuccessRecord] = useState(null);
  
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

  // Extraer solo los valores de los campos que usan los filtros dinámicos
  // Esto evita que processedFilters se recalcule en cada cambio de formData no relacionado
  const filterDependencyValues = useMemo(() => {
    if (!referenceFilters || referenceFilters.length === 0 || !formData) return null;
    const result = {};
    referenceFilters.forEach(filter => {
      if (typeof filter.value === 'string' && filter.value.includes('{')) {
        const matches = filter.value.match(/\{(\w+)\}/g) || [];
        matches.forEach(m => {
          const fieldName = m.replace(/[{}]/g, '');
          result[fieldName] = formData[fieldName];
        });
      }
    });
    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referenceFilters, ...( 
    referenceFilters
      ? referenceFilters.flatMap(f =>
          typeof f.value === 'string' && f.value.includes('{')
            ? (f.value.match(/\{(\w+)\}/g) || []).map(m => formData?.[m.replace(/[{}]/g, '')])
            : []
        )
      : []
  )]);

  // Procesar filtros con templates dinámicos {CAMPO} -> valor de formData
  const processedFilters = useMemo(() => {
    if (!referenceFilters || referenceFilters.length === 0) return referenceFilters;
    if (!formData || Object.keys(formData).length === 0) return referenceFilters;

    return referenceFilters.map(filter => {
      if (typeof filter.value === 'string' && filter.value.includes('{')) {
        const processedValue = formatTemplate(filter.value, formData);
        return { ...filter, value: processedValue };
      }
      return filter;
    });
  // Solo recalcular cuando cambian los valores de campos que realmente usan los filtros
  }, [referenceFilters, filterDependencyValues]);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referenceSelfFilter, referenceField, currentValue, name, ...(
    referenceSelfFilter
      ? referenceSelfFilter.flatMap(f =>
          typeof f.value === 'string' && f.value.includes('{')
            ? (f.value.match(/\{(\w+)\}/g) || []).map(m => formData?.[m.replace(/[{}]/g, '')])
            : []
        )
      : []
  )]);

  // Configuración para useReferenceData
  const config = useMemo(() => {
    return {
      tableName: referenceTable,
      valueField: referenceField,
      labelField: referenceLabelField,
      labelTemplate: referenceQuery,
      descriptionField: referenceDescriptionField,
      referenceDisplayFields,
      filters: processedFilters,
      referenceSelfValue: referenceSelf ? currentValue : null,
      referenceSelfFilter: processedSelfFilters,
      referenceOriginalValue: originalValueRef.current
    };
  }, [
    referenceTable, referenceField, referenceLabelField, referenceQuery,
    referenceDescriptionField, referenceDisplayFields, processedFilters, referenceSelf, currentValue, processedSelfFilters, referenceOriginalValue
  ]);

  const { options, loading, refresh } = useReferenceData(shouldLoadData ? config : null);

  // Aplicar valor creado desde modal add
  useEffect(() => {
    if (addSuccessRecord && addSuccessRecord[referenceField] != null) {
      const newId = addSuccessRecord[referenceField];
      if (setValue && typeof setValue === 'function') {
        setValue(name, newId);
      } else if (props.onChange && typeof props.onChange === 'function') {
        props.onChange(name, newId);
      }
      setAddSuccessRecord(null);
    }
  }, [addSuccessRecord, referenceField, name, setValue, props.onChange]);

  const handleAddSuccess = (result) => {
    const data = result?.data ?? result;
    const record = Array.isArray(data) ? data[0] : data;
    setAddSuccessRecord(record);
    setIsAddOpen(false);
    refresh();
  };

  const handleAddError = (error) => {
    console.error('[ReferenceSelectInput] Error creando referencia:', error);
  };

  // Llamar callback cuando loading termina
  const prevLoadingRef = useRef(loading);
  const hasCalledCallbackRef = useRef(false);
  const hasMountedRef = useRef(false);

  useEffect(() => {
    // Primera vez que se monta
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      // Si loading ya es false (datos cacheados) Y hay un valor real, llamar callback inmediatamente
      if (!loading && onReferenceSelectLoadComplete && currentValue) {
        onReferenceSelectLoadComplete();
        hasCalledCallbackRef.current = true;
      }
      return;
    }
    
    // Cuando loading termina (pasa de true a false)
    if (prevLoadingRef.current && !loading && onReferenceSelectLoadComplete) {
      if (!hasCalledCallbackRef.current) {
        onReferenceSelectLoadComplete();
        hasCalledCallbackRef.current = true;
      }
    }
    prevLoadingRef.current = loading;
  }, [loading, onReferenceSelectLoadComplete, currentValue]);

  // Resetear callback flag cuando cambia currentValue
  useEffect(() => {
    hasCalledCallbackRef.current = false;
    // Si loading es false después del cambio Y hay un valor real, llamar callback inmediatamente
    if (!loading && onReferenceSelectLoadComplete && currentValue) {
      onReferenceSelectLoadComplete();
      hasCalledCallbackRef.current = true;
    }
  }, [currentValue, loading, onReferenceSelectLoadComplete]);

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
        const data = await db.select(referenceSelfTable, filters, [referenceSelfValueColumn]);
        const records = data || [];
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
    <div className="relative">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="flex items-end gap-1">
        <div className="flex-1 min-w-0">
          <SelectInput
            {...props}
            name={name}
            label={label}
            hideLabel={true}
            options={options}
            loading={loading}
            searchable={searchable}
            optionValue="value"
            optionLabel="label"
            optionDescription="description"
          />
        </div>
        {showAddButton && AddComponent && (
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            title={addModalTitle}
            className="flex-shrink-0 self-end h-10 w-10 flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-400 hover:text-green-600 hover:border-green-400 hover:bg-green-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
        {showRefreshButton && (
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            title="Actualizar opciones"
            className="flex-shrink-0 self-end h-10 w-10 flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-400 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-40"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}
      </div>

      {referenceDisplayFields.length > 0 && currentValue && (
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
          {referenceDisplayFields.map(({ field, label }) => {
            const selectedOption = options.find(opt => String(opt.value) === String(currentValue));
            const rawValue = selectedOption?.raw?.[field] ?? selectedOption?.[field] ?? '';
            return (
              <div key={field} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                <p className="text-sm text-gray-800 font-medium truncate">
                  {rawValue || <span className="text-gray-400 italic">—</span>}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {showAddButton && AddComponent && (
        <Modal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          title={addModalTitle}
          size={addModalSize}
          closeOnOutsideClick={false}
          bodyClassName="p-6"
        >
          <AddComponent
            mode="create"
            onSuccess={handleAddSuccess}
            onError={handleAddError}
          />
        </Modal>
      )}
      
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
    </div>
  );
});

export default ReferenceSelectInput;
