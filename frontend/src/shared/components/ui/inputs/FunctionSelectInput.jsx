import React, { useState, useEffect, useMemo, useRef } from 'react';
import SelectInput from './SelectInput';
import Modal from '@/shared/components/modal/views/Modal';
import { useFunctionData } from '@/shared/hooks/useFunctionData';
import { evaluateOperatorSet } from '@/shared/components/form/utils/conditionEvaluator';

/**
 * Helper para formatear template con valores de formData
 * Ej: "{ID_DOCENTE}" -> "123"
 */
const formatTemplate = (template, data) => {
  if (!template || typeof template !== 'string') return template;
  return template.replace(/\{(\w+)\}/g, (_, fieldName) => data[fieldName] ?? '');
};

/**
 * FunctionSelectInput - SelectInput especializado para funciones SQL parametrizadas
 * Soporta: templates dinámicos, blocked/hidden condicionales, estados ACTUAL/DISPONIBLE
 * 
 * @param {string} functionName - Nombre del archivo .sql (ej: 'fn_cursos_disponibles_docente')
 * @param {Object} functionParams - Parámetros con templates {CAMPO}
 * @param {string} valueField - Campo para value (default: 'ID_CURSO')
 * @param {string} labelField - Campo para label (default: 'NOMBRE_CURSO')
 * @param {string} descriptionField - Campo para descripción (default: 'EJE_TEMATICO')
 * @param {string} statusField - Campo de estado ACTUAL/DISPONIBLE (default: 'ESTADO_CURSO')
 * @param {Object} blocked - Config de bloqueo { and: [{field, op, value}], or: [...] }
 * @param {Object} hidden - Config de ocultamiento
 * @param {Object} formData - Datos del formulario para evaluar condiciones y templates
 */
const FunctionSelectInput = React.memo(({
  name,
  label,
  value,
  onChange,
  functionName,
  functionParams,
  optionalParams = [],
  valueField,
  labelField,
  descriptionField,
  statusField,
  searchable = false,
  placeholder = 'Seleccione una opción',
  required = false,
  disabled = false,
  clearable = true,
  blocked = null,
  hidden = null,
  formData = {},
  freezeParams = false,
  showRefreshButton = false,
  showAddButton = false,
  addComponent: AddComponent = null,
  addModalTitle = 'Nueva referencia',
  addModalSize = 'lg',
  displayFields = [],
  watch,
  setValue,
  ...props
}) => {
  // console.log(`[FunctionSelectInput:${name}] Props received:`, {
  //   functionName,
  //   functionParams,
  //   optionalParams,
  //   valueField,
  //   labelField,
  //   formData,
  //   currentValue: value
  // });
  
  // Estado para errores
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Estado para modal de agregar
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addSuccessRecord, setAddSuccessRecord] = useState(null);

  // Obtener valor actual
  const currentValue = useMemo(() => {
    if (watch && typeof watch === 'function') {
      return watch(name);
    }
    return value;
  }, [watch, name, value]);

  // Evaluar si está bloqueado
  const isBlocked = useMemo(() => {
    if (!blocked) return false;
    return evaluateOperatorSet(blocked, formData);
  }, [blocked, formData]);

  // Evaluar si está oculto
  const isHidden = useMemo(() => {
    if (!hidden) return false;
    return evaluateOperatorSet(hidden, formData);
  }, [hidden, formData]);

  // Solo cargar si no está bloqueado ni oculto
  const shouldLoadData = !isBlocked && !isHidden;

  // Preparar config para useFunctionData
  const config = useMemo(() => ({
    functionName,
    functionParams,
    optionalParams,
    valueField,
    labelField,
    descriptionField,
    statusField,
    shouldLoadData,
    formData,
    freezeParams
  }), [functionName, functionParams, optionalParams, valueField, labelField, descriptionField, statusField, shouldLoadData, formData, freezeParams]);

  const { options, loading, error, processedParams, refresh } = useFunctionData(config);

  // Procesar opciones para marcar visualmente el estado ACTUAL
  const processedOptions = useMemo(() => {
    return options.map(opt => {
      const isActual = opt.status === 'ACTUAL';
      const isSelected = String(opt.value) === String(currentValue);
      
      // Agregar indicador visual para ACTUAL
      let label = opt.label;
      if (isActual) {
        label = `${opt.label} (Actual)`;
      }
      
      return {
        ...opt,
        label,
        // Destacar visualmente el ACTUAL
        icon: isActual ? '✓' : (isSelected ? '●' : '○'),
        className: isActual ? 'font-semibold text-blue-700 bg-blue-50' : ''
      };
    });
  }, [options, currentValue]);

  // Manejar error de carga
  useEffect(() => {
    if (error && !loading) {
      console.error(`[FunctionSelectInput:${name}] Error de carga:`, error);
      setErrorMessage(`Error cargando datos: ${error}`);
      setShowErrorModal(true);
    }
  }, [error, loading, name]);

  // Detectar cuando el valor seleccionado no está en las opciones (excepto si es ACTUAL)
  useEffect(() => {
    if (!loading && currentValue && options.length > 0) {
      const found = options.find(opt => String(opt.value) === String(currentValue));
      
      if (!found) {
        // El valor no existe en las opciones disponibles - limpiar después de un delay
        const timeoutId = setTimeout(() => {
          if (setValue && typeof setValue === 'function') {
            setValue(name, null);
          } else if (onChange && typeof onChange === 'function') {
            onChange(name, null);
          }
        }, 500);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [currentValue, options, loading, name, setValue, onChange]);

  // Aplicar valor creado desde modal add
  useEffect(() => {
    if (addSuccessRecord) {
      const newId = addSuccessRecord[valueField] ?? addSuccessRecord[valueField?.toUpperCase()];
      if (newId != null) {
        if (setValue && typeof setValue === 'function') {
          setValue(name, newId);
        } else if (onChange && typeof onChange === 'function') {
          onChange(name, newId);
        }
      }
      setAddSuccessRecord(null);
    }
  }, [addSuccessRecord, valueField, name, setValue, onChange]);

  // Manejar cierre del modal
  const handleErrorModalClose = () => {
    setShowErrorModal(false);
    setErrorMessage('');
  };

  const handleAddSuccess = (result) => {
    const data = result?.data ?? result;
    const record = Array.isArray(data) ? data[0] : data;
    setAddSuccessRecord(record);
    setIsAddOpen(false);
    refresh();
  };

  const handleAddError = (error) => {
    console.error('[FunctionSelectInput] Error creando referencia:', error);
  };

  // Placeholder dinámico cuando está bloqueado
  const dynamicPlaceholder = useMemo(() => {
    if (isBlocked) {
      // Intentar extraer los campos que bloquean para un mensaje más específico
      const conditions = blocked?.and?.length > 0 ? blocked.and : (blocked?.or?.length > 0 ? blocked.or : []);
      if (conditions.length > 0) {
        const fieldNames = conditions
          .filter(c => c.field)
          .map(c => c.field.toLowerCase().replace('id_', '').replace(/_/g, ' '));
        if (fieldNames.length > 0) {
          return `Requiere: ${fieldNames.join(', ')}`;
        }
      }
      return 'Complete los campos requeridos para habilitar esta opción';
    }
    return placeholder;
  }, [isBlocked, blocked, placeholder]);

  // Si está oculto, no renderizar
  if (isHidden) {
    return null;
  }

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
            value={currentValue}
            onChange={onChange}
            options={processedOptions}
            loading={loading}
            searchable={searchable}
            placeholder={dynamicPlaceholder}
            required={required}
            disabled={disabled || isBlocked}
            clearable={clearable}
            optionValue="value"
            optionLabel="label"
            optionDescription="description"
          />
        </div>
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
      </div>

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

      {/* Display fields read-only debajo del select */}
      {displayFields.length > 0 && currentValue && (
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
          {displayFields.map(({ field, label }) => {
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

      {/* Modal de error */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-red-600 mb-2">Error</h3>
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

FunctionSelectInput.displayName = 'FunctionSelectInput';

export default FunctionSelectInput;
