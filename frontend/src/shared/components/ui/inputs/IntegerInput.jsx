import React from 'react';
import BaseInput from './BaseInput';

/**
 * Componente IntegerInput especializado
 * Usa BaseInput con type="number" y validación específica para números enteros
 */
const IntegerInput = ({ 
  // Props específicas de entero
  min,
  max,
  step = 1,
  allowNegative = false,
  showControls = true,
  formatThousands = false,
  
  // Pasar todas las demás props al BaseInput
  ...baseInputProps 
}) => {
  // Validar que el valor sea un entero
  const validateInteger = (value) => {
    if (!value) return '';
    
    const numValue = Number(value);
    
    // Verificar que sea un número entero
    if (isNaN(numValue) || !Number.isInteger(numValue)) {
      return 'Debe ser un número entero';
    }
    
    // Verificar rango
    if (min !== undefined && numValue < min) {
      return `Debe ser mayor o igual a ${min}`;
    }
    
    if (max !== undefined && numValue > max) {
      return `Debe ser menor o igual a ${max}`;
    }
    
    // Verificar negativos
    if (!allowNegative && numValue < 0) {
      return 'No se permiten números negativos';
    }
    
    return '';
  };

  // Manejar cambio en el input
  const handleChange = (name, value) => {
    // Solo permitir números enteros
    const intValue = value === '' ? '' : Math.floor(Number(value));
    baseInputProps.onChange(name, intValue);
  };

  // Manejar pérdida de foco
  const handleBlur = (name) => {
    if (baseInputProps.onBlur) {
      baseInputProps.onBlur(name);
    }
  };

  // Formatear valor con separadores de miles
  const formatValue = (value) => {
    if (!formatThousands || !value) return value;
    
    const num = Number(value);
    if (isNaN(num)) return value;
    
    return num.toLocaleString('es-ES');
  };

  // Validación específica de entero
  const integerValidation = {
    ...baseInputProps.validation,
    custom: validateInteger
  };

  // Obtener valor formateado para mostrar
  const displayValue = formatValue(baseInputProps.value);

  return (
    <div className="relative">
      <BaseInput
        {...baseInputProps}
        type="number"
        step={step}
        min={allowNegative ? undefined : 0}
        max={max}
        validation={integerValidation}
        onChange={handleChange}
        onBlur={handleBlur}
        autoComplete="off"
        placeholder={baseInputProps.placeholder || 'Ingresa un número entero'}
        className={`${baseInputProps.className || ''}`}
        value={displayValue}
      />

      {/* Indicadores de rango */}
      <div className="mt-1 flex justify-between text-xs text-gray-500">
        {min !== undefined && (
          <span>Mínimo: {min}</span>
        )}
        {max !== undefined && (
          <span>Máximo: {max}</span>
        )}
        {baseInputProps.required && (
          <span>Obligatorio</span>
        )}
      </div>
    </div>
  );
};

export default IntegerInput;
