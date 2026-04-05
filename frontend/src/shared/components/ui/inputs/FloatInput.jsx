import React, { useRef, useEffect } from 'react';
import BaseInput from './BaseInput';

/**
 * Componente FloatInput especializado
 * Usa BaseInput con type="number" y validación específica para números decimales
 */
const FloatInput = ({ 
  // Props específicas de flotante
  min,
  max,
  step = 0.01,
  decimalPlaces = 2,
  allowNegative = true,
  showControls = true,
  formatThousands = false,
  formatCurrency = false,
  currency = 'USD',
  showCurrency = false,
  
  // Pasar todas las demás props al BaseInput
  ...baseInputProps 
}) => {
  const inputRef = useRef(null);

  // Desactivar cambio de valor con scroll
  useEffect(() => {
    const input = inputRef.current;
    if (input) {
      const handleWheel = (e) => {
        e.preventDefault();
      };
      input.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        input.removeEventListener('wheel', handleWheel);
      };
    }
  }, []);

  // Validar que el valor sea un número decimal
  const validateFloat = (value) => {
    if (!value) return '';
    
    const numValue = Number(value);
    
    // Verificar que sea un número válido
    if (isNaN(numValue)) {
      return 'Debe ser un número válido';
    }
    
    // Verificar rango
    if (min !== undefined && numValue < min) {
      return `Debe ser mayor o igual a ${min}`;
    }
    
    if (max !== undefined && numValue > max) {
      return `Debe ser menor o igual a ${max}`;
    }
    
    // Verificar decimales
    const decimalCount = (value.toString().split('.')[1] || '').length;
    if (decimalCount > decimalPlaces) {
      return `Máximo ${decimalPlaces} decimales`;
    }
    
    return '';
  };

  // Manejar cambio en el input
  const handleChange = (name, value) => {
    // Permitir valores decimales según el step
    const floatValue = value === '' ? '' : Number(value);
    baseInputProps.onChange(name, floatValue);
  };

  // Manejar pérdida de foco
  const handleBlur = (name) => {
    if (baseInputProps.onBlur) {
      baseInputProps.onBlur(name);
    }
  };

  // Formatear valor con separadores de miles y decimales
  const formatValue = (value) => {
    if (!value) return '';
    
    const num = Number(value);
    if (isNaN(num)) return value;
    
    // Configuración de formato
    const formatOptions = {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimalPlaces,
      useGrouping: formatThousands
    };
    
    if (formatCurrency) {
      return num.toLocaleString('es-ES', {
        style: 'currency',
        currency: currency
      });
    }
    
    return num.toLocaleString('es-ES', formatOptions);
  };

  // Validación específica de flotante
  const floatValidation = {
    ...baseInputProps.validation,
    custom: validateFloat
  };

  // Obtener valor crudo para el input (sin formato)
  const displayValue = baseInputProps.value || '';

  // Calcular step dinámico según decimales
  const calculatedStep = Math.pow(10, -decimalPlaces);

  return (
    <div className="relative">
      <BaseInput
        {...baseInputProps}
        inputRef={inputRef}
        type="number"
        step={calculatedStep}
        min={min}
        max={max}
        validation={floatValidation}
        onChange={handleChange}
        onBlur={handleBlur}
        autoComplete="off"
        formNoValidate={true}
        placeholder={baseInputProps.placeholder || 'Ingresa un número decimal'}
        className={`${baseInputProps.className || ''}`}
        value={displayValue}
      />

      {/* Indicadores de formato */}
      <div className="mt-1 flex justify-between text-xs text-gray-500">
        {decimalPlaces > 0 && (
          <span>{decimalPlaces} decimales máx.</span>
        )}
        {formatCurrency && (
          <span>Formato: {currency}</span>
        )}
        {baseInputProps.required && (
          <span>Obligatorio</span>
        )}
      </div>

      {/* Información de valor actual */}
      {baseInputProps.value && (
        <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Valor guardado:</span>
            <span className="font-mono">
              {Number(baseInputProps.value).toFixed(decimalPlaces)}
            </span>
          </div>
          {formatCurrency && (
            <div className="mt-1">
              <span>Formateado:</span>
              <span className="font-mono text-green-600">
                {formatValue(baseInputProps.value)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FloatInput;
