import React from 'react';

/**
 * Input de fecha nativo de HTML (<input type="date">).
 * Retorna formato "YYYY-MM-DD" — sin conversión de timezone.
 * Compatible con columnas DATE de PostgreSQL.
 */
const NativeDateInput = ({
  label,
  required,
  disabled,
  placeholder,
  className = '',
  name,
  value,
  onChange,
  // Props no-DOM que se filtran para no pasarlas al <input>
  touched,
  error,
  formData,
  blocked,
  hidden,
  onReferenceSelectLoadComplete,
  ...rest
}) => {
  const handleChange = (e) => {
    if (onChange) {
      onChange(name, e.target.value);
    }
  };

  return (
    <div className="mb-4">
      {label && (
        <label
          htmlFor={name}
          className={`block text-sm font-medium text-gray-700 mb-2 ${disabled ? 'text-gray-400' : ''}`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        {...rest}
        id={name}
        name={name}
        type="date"
        value={value || ''}
        disabled={disabled}
        placeholder={placeholder}
        onChange={handleChange}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white border-gray-300 hover:border-gray-400 text-gray-900 text-base ${className} ${disabled ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
      />
    </div>
  );
};

export default NativeDateInput;
