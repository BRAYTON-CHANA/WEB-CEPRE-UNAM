import React, { useState, useEffect, useMemo, useRef } from 'react';
import SelectInput from './SelectInput';
import { useFunctionData } from '@/shared/hooks/useFunctionData';
import { evaluateOperatorSet } from '@/features/form/utils/conditionEvaluator';

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
  watch,
  setValue,
  ...props
}) => {
  console.log(`[FunctionSelectInput:${name}] Props received:`, {
    functionName,
    functionParams,
    optionalParams,
    valueField,
    labelField,
    formData,
    currentValue: value
  });
  
  // Estado para errores
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
    formData
  }), [functionName, functionParams, optionalParams, valueField, labelField, descriptionField, statusField, shouldLoadData, formData]);

  const { options, loading, error, processedParams } = useFunctionData(config);

  // Procesar opciones para marcar visualmente el estado ACTUAL
  const processedOptions = useMemo(() => {
    return options.map(opt => {
      const isActual = opt.status === 'ACTUAL';
      const isSelected = String(opt.value) === String(currentValue);
      
      // Agregar indicador visual para ACTUAL
      let label = opt.label;
      if (isActual) {
        label = `✓ ${opt.label} (Actual)`;
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
            setValue(name, '');
          } else if (onChange && typeof onChange === 'function') {
            onChange({ target: { name, value: '' } });
          }
        }, 500);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [currentValue, options, loading, name, setValue, onChange]);

  // Manejar cierre del modal
  const handleErrorModalClose = () => {
    setShowErrorModal(false);
    setErrorMessage('');
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
    <>
      <SelectInput
        {...props}
        name={name}
        label={label}
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
    </>
  );
});

FunctionSelectInput.displayName = 'FunctionSelectInput';

export default FunctionSelectInput;
