import React, { useState } from 'react';
import BaseInput from './BaseInput';

/**
 * Componente RadioInput especializado
 * Usa BaseInput como base pero renderiza radio buttons con funcionalidades avanzadas
 */
const RadioInput = ({ 
  // Props específicas de radio
  options = [],
  inline = false,          // Mostrar opciones en línea horizontal
  stacked = true,          // Mostrar opciones apiladas verticalmente
  
  // Props de visualización
  optionLabel = 'label',
  optionValue = 'value',
  optionDescription = 'description',
  optionDisabled = 'disabled',
  optionIcon = 'icon',
  
  // Props de estilo
  showCards = false,       // Mostrar como cards en lugar de radio buttons
  cardSize = 'medium',     // Tamaño de las cards
  
  // Pasar todas las demás props al BaseInput
  ...baseInputProps 
}) => {
  const [selectedValue, setSelectedValue] = useState(
    baseInputProps.value || baseInputProps.defaultValue || ''
  );

  // Manejar selección
  const handleSelect = (option) => {
    const value = option[optionValue];
    
    setSelectedValue(value);
    
    if (baseInputProps.onChange) {
      baseInputProps.onChange(baseInputProps.name, value);
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
    const currentValue = baseInputProps.value !== undefined ? baseInputProps.value : selectedValue;
    return currentValue === option[optionValue];
  };

  // Renderizar radio button estándar
  const renderRadioButton = (option, index) => {
    const selected = isSelected(option);
    const disabled = option[optionDisabled] || baseInputProps.disabled;
    const label = option[optionLabel];
    const value = option[optionValue];
    const description = option[optionDescription];
    const icon = option[optionIcon];

    return (
      <label 
        key={value}
        className={`
          flex items-start p-3 rounded-lg border cursor-pointer
          ${disabled 
            ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-60' 
            : 'bg-white border-gray-300 hover:border-blue-400'
          }
          ${selected ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : ''}
          transition-all duration-200
          ${inline ? 'inline-flex mr-4 mb-2' : 'flex mb-3'}
        `}
      >
        <div className="flex items-center h-5">
          <input
            type="radio"
            name={baseInputProps.name}
            value={value}
            checked={selected}
            disabled={disabled}
            onChange={() => handleSelect(option)}
            onBlur={handleBlur}
            className={`
              w-4 h-4 border-gray-300
              ${disabled ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600'}
              focus:ring-blue-500 focus:ring-2
            `}
          />
        </div>
        
        <div className="ml-3 flex-1">
          <div className="flex items-center">
            {icon && (
              <span className="mr-2 text-lg">{icon}</span>
            )}
            <span className="font-medium text-gray-900">{label}</span>
          </div>
          
          {description && (
            <div className="text-sm text-gray-500 mt-1">{description}</div>
          )}
        </div>
        
        {/* El check redundante ha sido eliminado */}
      </label>
    );
  };

  // Renderizar como cards
  const renderRadioCard = (option, index) => {
    const selected = isSelected(option);
    const disabled = option[optionDisabled] || baseInputProps.disabled;
    const label = option[optionLabel];
    const value = option[optionValue];
    const description = option[optionDescription];
    const icon = option[optionIcon];

    const cardSizes = {
      small: 'p-3',
      medium: 'p-4',
      large: 'p-6'
    };

    return (
      <div
        key={value}
        onClick={() => !disabled && handleSelect(option)}
        className={`
          ${cardSizes[cardSize]} rounded-lg border-2 cursor-pointer
          ${disabled 
            ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-60' 
            : 'bg-white border-gray-200 hover:border-blue-300'
          }
          ${selected ? 'border-blue-500 bg-blue-50' : ''}
          transition-all duration-200
          ${inline ? 'inline-block mr-4 mb-4' : 'block mb-4'}
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {/* Radio button visual */}
            <div className={`
              w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center
              ${selected 
                ? 'border-blue-500 bg-blue-500' 
                : 'border-gray-300 bg-white'
              }
            `}>
              {selected && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </div>
            
            <div>
              <div className="flex items-center">
                {icon && (
                  <span className="mr-2 text-xl">{icon}</span>
                )}
                <span className="font-semibold text-gray-900">{label}</span>
              </div>
              
              {description && (
                <div className="text-sm text-gray-500 mt-1">{description}</div>
              )}
            </div>
          </div>
          
          {/* El check redundante ha sido eliminado */}
        </div>
      </div>
    );
  };

  // Renderizar opciones
  const renderOptions = () => {
    if (options.length === 0) {
      return (
        <div className="text-gray-500 text-sm p-4 border border-gray-200 rounded-lg bg-gray-50">
          No hay opciones disponibles
        </div>
      );
    }

    return (
      <div className={`space-y-2 ${inline ? 'flex flex-wrap' : ''}`}>
        {options.map((option, index) => 
          showCards ? renderRadioCard(option, index) : renderRadioButton(option, index)
        )}
      </div>
    );
  };

  // Validar selección
  const validateRadio = () => {
    const currentValue = baseInputProps.value !== undefined ? baseInputProps.value : selectedValue;
    
    if (baseInputProps.required && !currentValue) {
      return 'Debes seleccionar una opción';
    }

    if (baseInputProps.validation) {
      return baseInputProps.validation.custom(currentValue);
    }

    return '';
  };

  // Validación específica de radio
  const radioValidation = {
    ...baseInputProps.validation,
    custom: validateRadio
  };

  // Obtener label de opción seleccionada
  const selectedOption = options.find(opt => {
    const currentValue = baseInputProps.value !== undefined ? baseInputProps.value : selectedValue;
    return opt[optionValue] === currentValue;
  });

  return (
    <div className="space-y-4">
      {/* Input oculto para el valor */}
      <BaseInput
        {...baseInputProps}
        type="hidden"
        value={baseInputProps.value !== undefined ? baseInputProps.value : selectedValue}
        validation={radioValidation}
        readOnly
        hideLabel={true}  // Prevenir duplicación de label
      />

      {/* Label principal */}
      {baseInputProps.label && (
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {baseInputProps.label}
          {baseInputProps.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Opciones de radio */}
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
      {selectedOption && (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-800">
            <span className="font-medium">Seleccionado:</span>
            <span className="ml-1">{selectedOption[optionLabel]}</span>
          </div>
          {selectedOption[optionDescription] && (
            <div className="text-xs text-blue-600 mt-1">
              {selectedOption[optionDescription]}
            </div>
          )}
        </div>
      )}

      {/* Indicadores de estado */}
      <div className="flex justify-between text-xs text-gray-500">
        {options.length > 0 && (
          <span>{options.length} opciones disponibles</span>
        )}
      </div>
    </div>
  );
};

export default RadioInput;
