import React, { useState } from 'react';

/**
 * Componente BaseInput genérico
 * Contiene toda la lógica común para todos los tipos de input
 * Acepta type como parámetro para máxima flexibilidad
 * Soporta modos controlled (value) y uncontrolled (defaultValue)
 */
const BaseInput = ({ 
  // Props básicos
  name,
  value,
  defaultValue,
  onChange,
  onBlur,
  
  // Props de visualización
  label,
  placeholder = '',
  disabled = false,
  required = false,
  type = 'text',  // ← Ahora SÍ acepta type
  hideLabel = false,  // ← Nueva prop para ocultar label
  
  // Props de validación
  error = '',
  touched = false,
  
  // Props de límites y estilo
  maxLength,
  minLength,
  className = '',
  size = 'medium',
  
  // Props adicionales
  autoComplete = 'off',
  autoFocus = false,
  formNoValidate = false,
  rightElement = null,
  inputRef = null
}) => {
  // Estado interno para modo uncontrolled
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  
  // Determinar si es controlled o uncontrolled
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;
  // Manejar cambio de valor
  const handleChange = (e) => {
    const newValue = e.target.value;
    
    // Aplicar límite de longitud si existe
    if (maxLength && newValue.length > maxLength) {
      return; // No permitir escribir más allá del límite
    }
    
    // Actualizar estado interno si es modo uncontrolled
    if (!isControlled) {
      setInternalValue(newValue);
    }
    
    onChange(name, newValue);
  };

  // Manejar pérdida de foco
  const handleBlur = (e) => {
    if (onBlur) {
      onBlur(name);
    }
  };

  // Calcular caracteres restantes
  const charactersRemaining = maxLength ? maxLength - (currentValue?.length || 0) : null;
  const isNearLimit = maxLength && charactersRemaining <= 10;

  // Clases base según tamaño y estado
  const baseInputClasses = `
    w-full px-3 py-2 border rounded-md 
    focus:outline-none focus:ring-2 focus:ring-blue-500 
    transition-colors duration-200
    ${disabled 
      ? 'bg-gray-100 border-gray-300 cursor-not-allowed text-gray-500' 
      : 'bg-white border-gray-300 hover:border-gray-400 focus:border-blue-500 text-gray-900'
    }
    ${error && touched 
      ? 'border-red-500 focus:ring-red-500' 
      : ''
    }
  `;

  // Clases según tamaño
  const sizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  const inputClasses = `${baseInputClasses} ${sizeClasses[size]} ${className}`.trim();

  return (
    <div className={type === 'hidden' ? '' : 'mb-4'}>
      {/* Label */}
      {label && !hideLabel && (
        <label 
          htmlFor={name}
          className={`
            block text-sm font-medium text-gray-700 mb-2
            ${disabled ? 'text-gray-400' : ''}
          `}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Contenedor del input */}
      <div className="relative">
        <input
          id={name}
          ref={inputRef}
          name={name}
          type={type}  
          value={currentValue}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          minLength={minLength}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          formNoValidate={formNoValidate}
          className={inputClasses}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={error && touched ? 'true' : 'false'}
          aria-describedby={error && touched ? `${name}-error` : undefined}
        />

        {/* Indicador de caracteres restantes */}
        {maxLength && (
          <div className={`
            absolute right-3 top-1/2 transform -translate-y-1/2 text-xs
            ${isNearLimit 
              ? 'text-orange-500 font-medium' 
              : charactersRemaining < 0 
                ? 'text-red-500 font-medium' 
                : 'text-gray-500'
            }
          `}>
            {charactersRemaining}/{maxLength}
          </div>
        )}

        {/* Elemento personalizado a la derecha */}
        {rightElement && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>

      {/* Mensaje de error */}
      {error && touched && (
        <div 
          id={`${name}-error`}
          className="mt-2 flex items-center text-sm text-red-600"
          role="alert"
        >
          <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          {error}
        </div>
      )}

      {/* Indicadores visuales adicionales */}
      <div className="mt-1 flex justify-between text-xs text-gray-500">
        {minLength && (
          <span>Mínimo {minLength} caracteres</span>
        )}
        {maxLength && (
          <span>Máximo {maxLength} caracteres</span>
        )}
      </div>
    </div>
  );
};

export default BaseInput;
