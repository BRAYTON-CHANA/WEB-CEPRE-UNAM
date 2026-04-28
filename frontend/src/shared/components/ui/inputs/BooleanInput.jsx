import React from 'react';

/**
 * BooleanInput - Checkbox simple para valores true/false
 * 
 * Props:
 * - name: nombre del campo
 * - label: etiqueta a mostrar
 * - value: valor booleano (true/false)
 * - onChange: función (name, value) => void
 * - onBlur: función (name) => void
 * - disabled: boolean
 * - required: boolean
 * - error: string
 * - touched: boolean
 */
const BooleanInput = ({
  name,
  label,
  value = false,
  onChange,
  onBlur,
  disabled = false,
  required = false,
  error = '',
  touched = false
}) => {
  const handleChange = (e) => {
    const newValue = e.target.checked;
    if (onChange) {
      onChange(name, newValue);
    }
  };

  const handleBlur = () => {
    if (onBlur) {
      onBlur(name);
    }
  };

  return (
    <div className="mb-4">
      {/* Hidden input para el valor real */}
      <input
        type="hidden"
        name={name}
        value={value ? 'true' : 'false'}
      />

      <label 
        className={`
          flex items-center cursor-pointer select-none
          ${disabled ? 'cursor-not-allowed opacity-60' : ''}
        `}
      >
        <div className="relative flex items-center">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={disabled}
            required={required}
            className="sr-only"
          />
          <div 
            className={`
              w-5 h-5 border-2 rounded transition-all duration-200 relative
              ${value 
                ? 'bg-blue-600 border-blue-600' 
                : 'bg-white border-gray-300 hover:border-gray-400'
              }
              ${disabled ? 'bg-gray-200 border-gray-300' : ''}
            `}
          >
            {!!value && (
              <svg 
                className="w-3 h-3 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none" 
                fill="none" 
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>
        
        {label && (
          <span className={`
            ml-2 text-sm font-medium
            ${disabled ? 'text-gray-400' : 'text-gray-700'}
          `}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </span>
        )}
      </label>

      {/* Mensaje de error */}
      {error && touched && (
        <div 
          className="mt-2 flex items-center text-sm text-red-600"
          role="alert"
        >
          <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
};

export default BooleanInput;
