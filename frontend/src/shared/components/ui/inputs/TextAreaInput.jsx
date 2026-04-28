import React, { useState, useRef, useEffect } from 'react';
import BaseInput from './BaseInput';

/**
 * Componente TextAreaInput especializado
 * Usa BaseInput como base pero renderiza un textarea con funcionalidades avanzadas
 */
const TextAreaInput = ({ 
  // Props específicas de textarea
  rows = 4,
  autoResize = true,
  minHeight = 80,
  maxHeight = 300,
  showCharCount = true,
  maxLength,
  showWordCount = false,
  enableTab = false,
  placeholderLines = [],
  
  // Pasar todas las demás props al BaseInput
  ...baseInputProps 
}) => {
  const textareaRef = useRef(null);
  const [charCount, setCharCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [currentLine, setCurrentLine] = useState(0);

  // Auto-resize del textarea
  useEffect(() => {
    if (!autoResize || !textareaRef.current) return;
    
    const textarea = textareaRef.current;
    
    // Resetear altura para medir correctamente
    textarea.style.height = 'auto';
    textarea.style.height = '0px';
    
    // Calcular nueva altura
    const newHeight = Math.min(
      Math.max(textarea.scrollHeight, minHeight),
      maxHeight
    );
    
    textarea.style.height = `${newHeight}px`;
  }, [baseInputProps.value, autoResize, minHeight, maxHeight]);

  // Manejar cambio en el textarea
  const handleChange = (name, value) => {
    baseInputProps.onChange(name, value);
    
    // Actualizar contadores
    if (showCharCount) {
      setCharCount(value ? value.length : 0);
    }
    
    if (showWordCount) {
      const words = value ? value.trim().split(/\s+/).filter(word => word.length > 0) : [];
      setWordCount(words.length);
    }
  };

  // Manejar tecla Tab
  const handleKeyDown = (e) => {
    if (!enableTab || e.key !== 'Tab') return;
    
    e.preventDefault();
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    
    // Insertar espacios en lugar de tab
    const newValue = value.substring(0, start) + '  ' + value.substring(end);
    
    baseInputProps.onChange(baseInputProps.name, newValue);
    
    // Restaurar posición del cursor
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + 2;
    }, 0);
  };

  // Manejar paste con tabulación
  const handlePaste = (e) => {
    if (!enableTab) return;
    
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    
    // Reemplazar tabs con espacios
    const formattedText = text.replace(/\t/g, '  ');
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    
    const newValue = value.substring(0, start) + formattedText + value.substring(end);
    
    baseInputProps.onChange(baseInputProps.name, newValue);
    
    // Restaurar posición del cursor
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + formattedText.length;
    }, 0);
  };

  // Obtener líneas de placeholder
  const getPlaceholderLines = () => {
    if (placeholderLines.length === 0) return baseInputProps.placeholder || '';
    
    return placeholderLines.join('\n');
  };

  // Validar longitud
  const validateTextArea = () => {
    if (maxLength && charCount > maxLength) {
      return `Máximo ${maxLength} caracteres`;
    }
    
    if (baseInputProps.validation) {
      return baseInputProps.validation.custom(baseInputProps.value);
    }
    
    return '';
  };

  // Validación específica de textarea
  const textAreaValidation = {
    ...baseInputProps.validation,
    custom: validateTextArea
  };

  // Calcular líneas totales
  const totalLines = baseInputProps.value ? baseInputProps.value.split('\n').length : 0;
  const remainingChars = maxLength ? maxLength - charCount : null;
  const charPercentage = maxLength ? (charCount / maxLength) * 100 : 0;

  return (
    <div className="mb-4">
      {/* Label del BaseInput */}
      {baseInputProps.label && (
        <label 
          htmlFor={baseInputProps.name}
          className={`
            block text-sm font-medium text-gray-700 mb-2
            ${baseInputProps.disabled ? 'text-gray-400' : ''}
          `}
        >
          {baseInputProps.label}
          {baseInputProps.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Contenedor del textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          id={baseInputProps.name}
          name={baseInputProps.name}
          value={baseInputProps.value || ''}
          placeholder={getPlaceholderLines()}
          rows={rows}
          disabled={baseInputProps.disabled}
          required={baseInputProps.required}
          maxLength={maxLength}
          autoFocus={baseInputProps.autoFocus}
          autoComplete={baseInputProps.autoComplete}
          className={`
            w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${baseInputProps.disabled 
              ? 'bg-gray-100 cursor-not-allowed text-gray-500' 
              : 'bg-white text-gray-900 hover:border-gray-400'
            }
            ${baseInputProps.error && baseInputProps.touched 
              ? 'border-red-500 focus:ring-red-500' 
              : ''
            }
            ${!autoResize ? 'resize-none' : 'resize-y'}
            transition-colors duration-200
            ${baseInputProps.className || ''}
          `}
          onChange={(e) => handleChange(baseInputProps.name, e.target.value)}
          onBlur={() => baseInputProps.onBlur && baseInputProps.onBlur(baseInputProps.name)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          style={{
            minHeight: autoResize ? undefined : `${minHeight}px`,
            maxHeight: autoResize ? undefined : `${maxHeight}px`
          }}
          aria-invalid={baseInputProps.error && baseInputProps.touched ? 'true' : 'false'}
          aria-describedby={baseInputProps.error && baseInputProps.touched ? `${baseInputProps.name}-error` : undefined}
        />

        {/* Indicador de línea actual */}
        {enableTab && (
          <div className="absolute top-2 right-2 text-xs text-gray-500">
            Línea {currentLine + 1} de {totalLines}
          </div>
        )}
      </div>

      {/* Mensaje de error */}
      {baseInputProps.error && baseInputProps.touched && (
        <div 
          id={`${baseInputProps.name}-error`}
          className="mt-2 flex items-center text-sm text-red-600"
          role="alert"
        >
          <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          {baseInputProps.error}
        </div>
      )}

      {/* Contador de caracteres */}
      {(showCharCount || showWordCount) && (
        <div className="mt-2 flex justify-between items-center">
          <div className="text-xs text-gray-500">
            {showCharCount && (
              <span>
                Caracteres: {charCount}
                {maxLength && (
                  <span className={`
                    ${charPercentage >= 90 ? 'text-red-600' : 
                      charPercentage >= 75 ? 'text-orange-600' : 
                        'text-gray-600'
                    }
                  `}>
                    ({maxLength - charCount} restantes)
                  </span>
                )}
              </span>
            )}
            
            {showWordCount && (
              <span>
                Palabras: {wordCount}
              </span>
            )}
          </div>
          
          {/* Barra de progreso de caracteres */}
          {showCharCount && maxLength && (
            <div className="flex-1 mx-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`
                    h-full transition-all duration-300 ease-out
                    ${charPercentage >= 90 ? 'bg-red-500' : 
                      charPercentage >= 75 ? 'bg-orange-500' : 
                        'bg-green-500'
                    }
                  `}
                  style={{ width: `${Math.min(charPercentage, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Indicadores adicionales */}
      <div className="mt-1 flex justify-between text-xs text-gray-500">
        {maxLength && (
          <span>Máximo {maxLength} caracteres</span>
        )}
        {baseInputProps.required && (
          <span>Obligatorio</span>
        )}
        {autoResize && (
          <span>Auto-ajustable</span>
        )}
      </div>

      {/* Información de contenido */}
      {baseInputProps.value && (
        <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Estadísticas:</span>
            <span>
              {totalLines} líneas, {charCount} caracteres
              {showWordCount && `, ${wordCount} palabras`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextAreaInput;
