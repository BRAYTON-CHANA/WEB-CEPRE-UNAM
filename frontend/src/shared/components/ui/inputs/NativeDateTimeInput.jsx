import React from 'react';

/**
 * Input de fecha+hora nativo de HTML (<input type="datetime-local">).
 * Retorna formato "YYYY-MM-DDTHH:MM" — sin conversión de timezone.
 * Compatible con columnas TIMESTAMP de PostgreSQL.
 */
const NativeDateTimeInput = ({
  label,
  required,
  disabled,
  placeholder,
  className = '',
  name,
  value,
  onChange,
  min,
  max,
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

  // Convertir value (Date o string ISO) a formato datetime-local (YYYY-MM-DDTHH:MM)
  const toLocalValue = (val) => {
    if (!val) return '';
    if (typeof val === 'string') {
      // Si ya viene en formato datetime-local o ISO, tomar solo YYYY-MM-DDTHH:MM
      const d = new Date(val);
      if (isNaN(d.getTime())) return '';
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const mi = String(d.getMinutes()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
    }
    if (val instanceof Date) {
      const yyyy = val.getFullYear();
      const mm = String(val.getMonth() + 1).padStart(2, '0');
      const dd = String(val.getDate()).padStart(2, '0');
      const hh = String(val.getHours()).padStart(2, '0');
      const mi = String(val.getMinutes()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
    }
    return '';
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
        type="datetime-local"
        value={toLocalValue(value)}
        disabled={disabled}
        placeholder={placeholder}
        onChange={handleChange}
        min={min}
        max={max}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white border-gray-300 hover:border-gray-400 text-gray-900 text-base ${className} ${disabled ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
      />
    </div>
  );
};

export default NativeDateTimeInput;
