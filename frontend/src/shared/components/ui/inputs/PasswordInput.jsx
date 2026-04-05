import React, { useState } from 'react';
import BaseInput from './BaseInput';

/**
 * Componente PasswordInput especializado
 * Usa BaseInput con type="password" y añade funcionalidades de seguridad
 */
const PasswordInput = ({ 
  // Props específicas de password
  showToggle = true,
  showStrengthMeter = false,
  minLength = 8,
  strengthLevels = 5,
  
  // Pasar todas las demás props al BaseInput
  ...baseInputProps 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Calcular fortaleza de la contraseña
  const calculatePasswordStrength = (password) => {
    if (!password) return 0;
    
    let strength = 0;
    
    // Longitud
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    
    // Complejidad (caracteres variados)
    if (/[a-z]/.test(password)) strength++;  // minúsculas
    if (/[A-Z]/.test(password)) strength++;  // mayúsculas
    if (/[0-9]/.test(password)) strength++;  // números
    if (/[^a-zA-Z0-9]/.test(password)) strength++;  // caracteres especiales
    
    return Math.min(strength, strengthLevels);
  };

  // Obtener etiqueta de fortaleza
  const getStrengthLabel = (strength) => {
    const labels = {
      0: { text: 'Muy débil', color: 'text-red-600' },
      1: { text: 'Débil', color: 'text-orange-600' },
      2: { text: 'Regular', color: 'text-yellow-600' },
      3: { text: 'Buena', color: 'text-blue-600' },
      4: { text: 'Muy buena', color: 'text-green-600' },
      5: { text: 'Excelente', color: 'text-green-700' }
    };
    return labels[Math.min(strength, 4)] || labels[0];
  };

  // Manejar cambio en el input
  const handleChange = (name, value) => {
    baseInputProps.onChange(name, value);
    
    // Calcular fortaleza si está activado
    if (showStrengthMeter) {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  // Manejar pérdida de foco
  const handleBlur = (name) => {
    if (baseInputProps.onBlur) {
      baseInputProps.onBlur(name);
    }
  };

  // Toggle visibilidad de la contraseña
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Validación específica de password
  const passwordValidation = {
    minLength: minLength,
    pattern: minLength ? {
      test: (value) => {
        if (!value) return true;
        // Al menos una letra mayúscula, una minúscula y un número
        return /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value);
      },
      message: `Mínimo ${minLength} caracteres con al menos 1 mayúscula, 1 minúscula y 1 número`
    } : baseInputProps.validation,
    ...baseInputProps.validation
  };

  // Obtener configuración de fortaleza
  const strengthConfig = getStrengthLabel(passwordStrength);
  const strengthPercentage = (passwordStrength / strengthLevels) * 100;

  return (
    <div>
      <BaseInput
        {...baseInputProps}
        type={showPassword ? "text" : "password"}
        validation={passwordValidation}
        onChange={handleChange}
        onBlur={handleBlur}
        autoComplete="current-password"
        placeholder={baseInputProps.placeholder || 'Ingresa tu contraseña'}
        className={`${baseInputProps.className || ''} ${showToggle ? 'pr-10' : 'pr-3'}`}
        rightElement={showToggle ? (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="p-1 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>
        ) : null}
      />

      {/* Medidor de fortaleza de contraseña */}
      {showStrengthMeter && baseInputProps.value && (
        <div className="mt-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-600">Fortaleza de la contraseña</span>
            <span className={`text-xs font-medium ${strengthConfig.color}`}>
              {strengthConfig.text}
            </span>
          </div>
          
          {/* Barra de progreso */}
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ease-out ${strengthConfig.color.replace('text-', 'bg-')}`}
              style={{ width: `${strengthPercentage}%` }}
            />
          </div>
          
          {/* Requisitos mínimos */}
          <div className="mt-1 space-y-1">
            <div className="flex items-center text-xs text-gray-500">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                passwordStrength >= 1 ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              <span>Al menos 8 caracteres</span>
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                /[a-z]/.test(baseInputProps.value) ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              <span>Letras minúsculas</span>
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                /[A-Z]/.test(baseInputProps.value) ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              <span>Letras mayúsculas</span>
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                /[0-9]/.test(baseInputProps.value) ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              <span>Números</span>
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                /[^a-zA-Z0-9]/.test(baseInputProps.value) ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              <span>Caracteres especiales</span>
            </div>
          </div>
        </div>
      )}

      {/* Requisitos adicionales */}
      <div className="mt-1 flex justify-between text-xs text-gray-500">
        {minLength && (
          <span>Mínimo {minLength} caracteres</span>
        )}
      </div>
    </div>
  );
};

export default PasswordInput;
