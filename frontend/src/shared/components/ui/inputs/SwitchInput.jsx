import React from 'react';
import ToggleSwitch from './ToggleSwitch';

/**
 * SwitchInput - Wrapper de ToggleSwitch con API de formulario (name, onChange, error, touched).
 * Palanca tipo switch para valores booleanos, como la usada en EditableCell.
 *
 * Props:
 * - name: nombre del campo
 * - label: etiqueta a mostrar al lado del switch
 * - value: valor booleano (true/false)
 * - onChange: función (name, value) => void
 * - onBlur: función (name) => void
 * - disabled: boolean
 * - required: boolean
 * - error: string
 * - touched: boolean
 */
const SwitchInput = ({
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
  const handleChange = (checked) => {
    if (onChange) onChange(name, checked);
    if (onBlur) onBlur(name);
  };

  return (
    <div className="mb-4">
      <div className="flex items-center gap-3">
        <ToggleSwitch
          checked={Boolean(value)}
          onChange={handleChange}
          disabled={disabled}
          size="md"
        />
        {label && (
          <label className={`text-sm font-medium select-none ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
      </div>

      {error && touched && (
        <div className="mt-2 flex items-center text-sm text-red-600" role="alert">
          <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
};

export default SwitchInput;
