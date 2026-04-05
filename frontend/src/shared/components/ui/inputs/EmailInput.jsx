import React from 'react';
import BaseInput from './BaseInput';

/**
 * Componente EmailInput especializado
 * Usa BaseInput con type="email" y añade funcionalidades específicas de email
 */
const EmailInput = ({ 
  // Props específicas de email
  validateDomain = false,
  suggestDomains = [],
  showDomainSuggestions = false,
  
  // Pasar todas las demás props al BaseInput
  ...baseInputProps 
}) => {
  const [domainSuggestions, setDomainSuggestions] = React.useState([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  // Validación específica de email
  const emailValidation = {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Correo electrónico inválido',
    ...baseInputProps.validation
  };

  // Extraer dominio del email actual
  const getCurrentDomain = (email) => {
    if (!email || !email.includes('@')) return '';
    return email.split('@')[1]?.toLowerCase() || '';
  };

  // Generar sugerencias de dominio
  const generateDomainSuggestions = (email) => {
    if (!showDomainSuggestions || !email || !email.includes('@')) {
      setDomainSuggestions([]);
      return;
    }

    const currentDomain = getCurrentDomain(email);
    const commonDomains = [
      'gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com',
      'empresa.com', 'correo.com', 'mail.com'
    ];

    let suggestions = [];
    
    // Sugerencias personalizadas si se proporcionaron
    if (suggestDomains.length > 0) {
      suggestions = suggestDomains.filter(domain => 
        domain.toLowerCase().includes(currentDomain) ||
        currentDomain.includes(domain.toLowerCase())
      );
    } else {
      // Sugerencias basadas en lo que el usuario escribe
      suggestions = commonDomains.filter(domain => 
        domain.toLowerCase().startsWith(currentDomain) &&
        domain !== currentDomain
      ).slice(0, 5);
    }

    setDomainSuggestions(suggestions);
  };

  // Manejar cambio en el input
  const handleChange = (name, value) => {
    baseInputProps.onChange(name, value);
    
    // Generar sugerencias si hay @
    if (showDomainSuggestions) {
      generateDomainSuggestions(value);
      setShowSuggestions(value.includes('@'));
    }
  };

  // Seleccionar sugerencia de dominio
  const selectSuggestion = (domain) => {
    const currentEmail = baseInputProps.value || '';
    const [localPart] = currentEmail.split('@');
    const newEmail = `${localPart[0]}@${domain}`;
    
    baseInputProps.onChange(baseInputProps.name, newEmail);
    setShowSuggestions(false);
    setDomainSuggestions([]);
  };

  // Ocultar sugerencias al hacer blur
  const handleBlur = (name) => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
    
    if (baseInputProps.onBlur) {
      baseInputProps.onBlur(name);
    }
  };

  // Validar dominio si está activado
  const domainValidation = validateDomain ? {
    pattern: /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}$/,
    message: 'Dominio inválido'
  } : {};

  return (
    <div className="relative">
      <BaseInput
        {...baseInputProps}
        type="email"
        validation={emailValidation}
        onChange={handleChange}
        onBlur={handleBlur}
        autoComplete="email"
        placeholder={baseInputProps.placeholder || 'correo@ejemplo.com'}
        className={`${baseInputProps.className || ''} pr-10`}
      />

      {/* Sugerencias de dominio */}
      {showSuggestions && domainSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10">
          <div className="py-1 max-h-40 overflow-y-auto">
            <div className="px-3 py-2 text-xs text-gray-600 border-b border-gray-100">
              Dominios sugeridos
            </div>
            {domainSuggestions.map((domain, index) => (
              <button
                key={index}
                type="button"
                onClick={() => selectSuggestion(domain)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors"
              >
                <span className="font-medium">{domain}</span>
                {validateDomain && (
                  <span className="ml-2 text-xs text-green-600">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Indicador de validación de dominio */}
      {validateDomain && baseInputProps.value && baseInputProps.value.includes('@') && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {domainSuggestions.length === 0 ? (
            <div className="w-4 h-4 text-green-500">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          ) : (
            <div className="w-4 h-4 text-orange-500">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 001-1v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EmailInput;
