import React from 'react';

/**
 * Input de hora nativo de HTML (<input type="time">).
 * Retorna formato 24h "HH:MM" — sin conversión de timezone.
 * Más simple que TimeInput pero consistente entre navegadores para hora.
 */
const NativeTimeInput = ({
  label,
  required,
  disabled,
  placeholder,
  className = '',
  name,
  value,
  onChange,
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
          <span className="text-xs font-normal text-gray-400 ml-1">(formato 24 horas)</span>
        </label>
      )}
      <input
        {...rest}
        id={name}
        name={name}
        type="time"
        value={value || ''}
        disabled={disabled}
        placeholder={placeholder}
        onChange={handleChange}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white border-gray-300 hover:border-gray-400 text-gray-900 text-base ${className} ${disabled ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
      />
    </div>
  );
};

export default NativeTimeInput;
