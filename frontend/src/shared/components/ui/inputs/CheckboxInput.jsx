import React, { useState } from 'react';
import BaseInput from './BaseInput';

/**
 * Componente CheckboxInput especializado
 * Usa BaseInput como base pero renderiza checkboxes con funcionalidades avanzadas
 */
const CheckboxInput = ({ 
  // Props específicas de checkbox
  options = [],
  single = false,           // true = checkbox individual, false = grupo
  toggle = false,          // Estilo switch/toggle
  inline = false,          // Mostrar opciones en línea horizontal
  
  // Props de visualización
  optionLabel = 'label',
  optionValue = 'value',
  optionDescription = 'description',
  optionDisabled = 'disabled',
  
  // Props de estado
  indeterminate = false,   // Estado indeterminado
  
  // Pasar todas las demás props al BaseInput
  ...baseInputProps 
}) => {
  const [selectedValues, setSelectedValues] = useState(
    Array.isArray(baseInputProps.value) ? baseInputProps.value : 
    baseInputProps.value ? [baseInputProps.value] : []
  );

  // Manejar cambio de checkbox
  const handleChange = (option) => {
    if (single) {
      // Modo checkbox individual (true/false)
      const newValue = !selectedValues.includes(option[optionValue]);
      const newSelectedValues = newValue ? [option[optionValue]] : [];
      
      setSelectedValues(newSelectedValues);
      
      if (baseInputProps.onChange) {
        baseInputProps.onChange(baseInputProps.name, newValue);
      }
    } else {
      // Modo grupo de checkboxes
      const isSelected = selectedValues.includes(option[optionValue]);
      
      let newSelectedValues;
      if (isSelected) {
        // Deseleccionar
        newSelectedValues = selectedValues.filter(val => val !== option[optionValue]);
      } else {
        // Seleccionar
        newSelectedValues = [...selectedValues, option[optionValue]];
      }
      
      setSelectedValues(newSelectedValues);
      
      if (baseInputProps.onChange) {
        baseInputProps.onChange(baseInputProps.name, newSelectedValues);
      }
    }
  };

  // Manejar blur
  const handleBlur = () => {
    if (baseInputProps.onBlur) {
      baseInputProps.onBlur(baseInputProps.name);
    }
  };

  // Verificar si una opción está seleccionada
  const isSelected = (option) => {
    if (single) {
      return baseInputProps.value === true || baseInputProps.value === option[optionValue];
    }
    return selectedValues.includes(option[optionValue]);
  };

  // Renderizar checkbox individual
  const renderCheckbox = (option, index) => {
    const selected = isSelected(option);
    const disabled = option[optionDisabled] || baseInputProps.disabled;
    const label = option[optionLabel];
    const value = option[optionValue];
    const description = option[optionDescription];

    if (toggle) {
      // Estilo toggle/switch
      return (
        <div 
          key={value}
          className={`
            flex items-center justify-between p-4 rounded-lg border
            ${disabled 
              ? 'bg-gray-100 border-gray-200 cursor-not-allowed' 
              : 'bg-white border-gray-300 cursor-pointer hover:border-blue-400'
            }
            ${selected ? 'border-blue-500 bg-blue-50' : ''}
            transition-colors duration-200
            ${inline ? 'inline-flex mr-4 mb-2' : 'flex mb-2'}
          `}
          onClick={() => !disabled && handleChange(option)}
        >
          <div className="flex-1">
            {description && (
              <div className="text-sm text-gray-500 mt-1">{description}</div>
            )}
          </div>
          
          {/* Toggle Switch */}
          <div className="relative">
            <input
              type="checkbox"
              name={baseInputProps.name}
              value={value}
              checked={selected}
              disabled={disabled}
              onChange={() => {}} // Manejado por onClick del contenedor
              className="sr-only"
            />
            <div 
              className={`
                w-12 h-6 rounded-full transition-colors duration-300
                ${selected ? 'bg-blue-600' : 'bg-gray-300'}
                ${disabled ? 'opacity-50' : ''}
              `}
            >
              <div 
                className={`
                  w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300
                  ${selected ? 'translate-x-6' : 'translate-x-0'}
                `}
              />
            </div>
          </div>
        </div>
      );
    }

    // Estilo checkbox estándar
    return (
      <label 
        key={value}
        className={`
          flex items-start p-3 rounded-lg border cursor-pointer
          ${disabled 
            ? 'bg-gray-100 border-gray-200 cursor-not-allowed' 
            : 'bg-white border-gray-300 hover:border-blue-400'
          }
          ${selected ? 'border-blue-500 bg-blue-50' : ''}
          transition-colors duration-200
          ${inline ? 'inline-flex mr-4 mb-2' : 'flex mb-2'}
        `}
      >
        <div className="flex items-center h-5">
          <input
            type="checkbox"
            name={baseInputProps.name}
            value={value}
            checked={selected}
            disabled={disabled}
            onChange={() => handleChange(option)}
            onBlur={handleBlur}
            className={`
              w-4 h-4 rounded border-gray-300
              ${disabled ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600'}
              focus:ring-blue-500 focus:ring-2
            `}
          />
        </div>
        
        <div className="ml-3 flex-1">
          {description && (
            <div className="text-sm text-gray-500 mt-1">{description}</div>
          )}
        </div>
        
        {selected && !disabled && (
          <svg className="w-5 h-5 text-blue-600 ml-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )}
      </label>
    );
  };

  // Renderizar opciones
  const renderOptions = () => {
    if (options.length === 0) {
      return (
        <div className="text-gray-500 text-sm p-3 border border-gray-200 rounded-lg bg-gray-50">
          No hay opciones disponibles
        </div>
      );
    }

    return (
      <div className={`space-y-2 ${inline ? 'flex flex-wrap' : ''}`}>
        {options.map(renderCheckbox)}
      </div>
    );
  };

  // Validar selección
  const validateCheckbox = () => {
    if (baseInputProps.required && selectedValues.length === 0) {
      return 'Debes seleccionar al menos una opción';
    }

    if (baseInputProps.validation) {
      return baseInputProps.validation.custom(selectedValues);
    }

    return '';
  };

  // Validación específica de checkbox
  const checkboxValidation = {
    ...baseInputProps.validation,
    custom: validateCheckbox
  };

  // Obtener values de opciones seleccionadas
  const selectedValuesDisplay = selectedValues;

  return (
    <div className="space-y-4">
      {/* Input oculto para el valor */}
      <BaseInput
        {...baseInputProps}
        type="hidden"
        value={JSON.stringify(selectedValues)}
        validation={checkboxValidation}
        readOnly
        hideLabel={true}  // Evitar duplicación de label
      />

      {/* Label principal */}
      {baseInputProps.label && (
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {baseInputProps.label}
          {baseInputProps.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Opciones de checkbox */}
      {renderOptions()}

      {/* Mensaje de error */}
      {baseInputProps.error && baseInputProps.touched && (
        <div 
          className="mt-2 flex items-center text-sm text-red-600"
          role="alert"
        >
          <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          {baseInputProps.error}
        </div>
      )}

      {/* Resumen de selección */}
      {selectedValues.length > 0 && (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-800">
            <span className="font-medium">Valores seleccionados:</span>
            <span className="ml-1">
              {selectedValuesDisplay.join(', ')}
            </span>
          </div>
          <div className="text-xs text-blue-600 mt-1">
            {selectedValues.length} opción{selectedValues.length !== 1 ? 'es' : ''} seleccionada{selectedValues.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Indicadores de estado */}
      <div className="flex justify-between text-xs text-gray-500">
        {baseInputProps.required && (
          <span>Obligatorio</span>
        )}
        {options.length > 1 && !single && (
          <span>{options.length} opciones disponibles</span>
        )}
      </div>
    </div>
  );
};

export default CheckboxInput;
