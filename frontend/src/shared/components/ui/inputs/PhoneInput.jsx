import React, { useState, useMemo } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { normalizeCountryCode, DEFAULT_COUNTRY, PREFERRED_COUNTRIES } from '@/shared/constants/countryCodes';

/**
 * Componente PhoneInput mejorado con react-phone-input-2
 * Muestra banderas y códigos de país en el selector
 * Sin dependencia de BaseInput - componente standalone
 */
const CustomPhoneInput = ({ 
  // Props específicas de teléfono
  countryCode = DEFAULT_COUNTRY, // Puede ser ISO 2 letras ('pe') o dial code ('+51')
  showCountrySelector = true,
  allowExtensions = false,
  extensionLabel = 'Ext.',
  
  // Props del input
  name,
  value,
  onChange,
  onBlur,
  placeholder = 'Número de teléfono',
  disabled = false,
  required = false,
  error = '',
  touched = false,
  className = '',
  
  // Otras props
  ...props 
}) => {
  const [extension, setExtension] = useState('');

  // Convertir countryCode al formato que react-phone-input-2 espera
  const normalizedCountryCode = useMemo(() => {
    return normalizeCountryCode(countryCode);
  }, [countryCode]);

  // Manejar cambio en el input principal
  const handleChange = (value, country, e, formattedValue) => {
    // Construir valor completo con extensión si es necesario
    const fullValue = allowExtensions && extension 
      ? `${value} ${extensionLabel} ${extension}`
      : value;
    
    // Llamar al onChange del padre
    if (onChange) {
      onChange(name, fullValue);
    }
  };

  // Manejar cambio en la extensión
  const handleExtensionChange = (e) => {
    const value = e.target.value;
    setExtension(value);
    
    // Construir número completo con extensión
    if (value && onChange) {
      const currentValue = value || '';
      const fullValue = `${currentValue} ${extensionLabel} ${value}`;
      onChange(name, fullValue);
    }
  };

  // Manejar blur para validación
  const handleBlur = (e) => {
    if (onBlur) {
      onBlur(name);
    }
  };

  return (
    <div className="space-y-2">
      {/* Label principal */}
      {props.label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {props.label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input principal con react-phone-input-2 */}
      <div className="relative w-full">
        <PhoneInput
          country={normalizedCountryCode}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          inputClass={`
            w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            ${error && touched ? 'border-red-500' : ''}
            ${className}
            text-base
          `}
          buttonClass={`
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            ${error && touched ? 'border-red-500' : 'border-gray-300'}
          `}
          dropdownClass={`
            bg-white border border-gray-300 rounded-lg shadow-lg
            max-h-60 overflow-y-auto
          `}
          searchClass={`
            w-full px-3 py-2 border-b border-gray-200
            focus:outline-none focus:ring-2 focus:ring-blue-500
          `}
          containerClass="w-full"
          style={{
            width: '100%'
          }}
          inputStyle={{
            width: '100%',
            maxWidth: '100%'
          }}
          buttonStyle={{
            width: 'auto'
          }}
          dropdownStyle={{
            width: '100%',
            minWidth: '500px',
            maxWidth: '600px',
            overflowX: 'hidden' // Esto elimina el desplazamiento horizontal
          }}
          enableSearch={true}
          searchPlaceholder="Buscar país..."
          disableSearchIcon={false}
          preferredCountries={PREFERRED_COUNTRIES}
          enableAreaCodes={false}
          enableLongNumbers={false}
          countryCodeEditable={false}
          disableDropdown={false}
          autocompleteSearch={false}
          preserveOrder={['preferredCountries', 'alphabetical']}
          {...props}
        />
      </div>

      {/* Campo de extensión */}
      {allowExtensions && (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">{extensionLabel}</span>
          <input
            type="text"
            value={extension}
            onChange={handleExtensionChange}
            disabled={disabled}
            className={`
              w-20 px-2 py-1 border border-gray-300 rounded-md text-sm
              focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
              ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            `}
            placeholder="Ext"
          />
        </div>
      )}

      {/* Mensaje de error */}
      {error && touched && (
        <div 
          className="mt-2 flex items-center text-sm text-red-600"
          role="alert"
        >
          <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 001-1v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Indicadores visuales adicionales */}
      <div className="flex justify-between text-xs text-gray-500">
        <span>Formato internacional</span>
      </div>
    </div>
  );
};

export default CustomPhoneInput;
