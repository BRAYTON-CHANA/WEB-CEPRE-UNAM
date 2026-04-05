import { useState, useCallback } from 'react';

/**
 * Hook para manejar la validación de formularios
 * @param {Object} validationRules - Reglas de validación por campo
 * @returns {Object} - Estado y funciones de validación
 */
export const useFormValidation = (validationRules = {}) => {
  const [errors, setErrors] = useState({});

  /**
   * Valida un campo específico
   * @param {string} fieldName - Nombre del campo
   * @param {*} value - Valor a validar
   * @returns {string} - Mensaje de error o string vacío
   */
  const validateField = useCallback((fieldName, value) => {
    const rules = validationRules[fieldName];
    if (!rules) return '';

    if (rules.required && (!value || value.toString().trim() === '')) {
      return 'Este campo es requerido';
    }

    if (rules.minLength && value && value.length < rules.minLength) {
      return `Mínimo ${rules.minLength} caracteres`;
    }

    if (rules.maxLength && value && value.length > rules.maxLength) {
      return `Máximo ${rules.maxLength} caracteres`;
    }

    if (rules.pattern && value && !rules.pattern.test(value)) {
      return rules.message || 'Formato inválido';
    }

    return '';
  }, [validationRules]);

  /**
   * Valida todo el formulario
   * @param {Object} formData - Datos del formulario
   * @returns {boolean} - true si es válido, false si no
   */
  const validateForm = useCallback((formData) => {
    const newErrors = {};

    Object.keys(validationRules).forEach((fieldName) => {
      const value = formData[fieldName];
      const error = validateField(fieldName, value);

      if (error) {
        newErrors[fieldName] = error;
      }
    });

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;

    return isValid;
  }, [validationRules, validateField]);

  /**
   * Valida solo los campos de una página específica
   * @param {Object} formData - Datos del formulario
   * @param {Array} pageFieldNames - Nombres de campos de la página a validar
   * @returns {boolean} - true si la página es válida
   */
  const validatePage = useCallback((formData, pageFieldNames) => {
    const newErrors = {};

    pageFieldNames.forEach((fieldName) => {
      const rules = validationRules[fieldName];
      if (!rules) return;

      const value = formData[fieldName];
      const error = validateField(fieldName, value);

      if (error) {
        newErrors[fieldName] = error;
      }
    });

    // Merge con errores existentes (para mantener errores de otras páginas)
    setErrors((prev) => ({
      ...prev,
      ...newErrors
    }));

    const isValid = Object.keys(newErrors).length === 0;

    return isValid;
  }, [validationRules, validateField]);

  /**
   * Limpia el error de un campo específico
   * @param {string} fieldName - Nombre del campo
   */
  const clearError = useCallback((fieldName) => {
    setErrors((prev) => {
      if (!prev[fieldName]) return prev;
      const { [fieldName]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  /**
   * Establece un error específico para un campo
   * @param {string} fieldName - Nombre del campo
   * @param {string} error - Mensaje de error
   */
  const setFieldError = useCallback((fieldName, error) => {
    setErrors((prev) => ({
      ...prev,
      [fieldName]: error
    }));
  }, []);

  /**
   * Limpia todos los errores
   */
  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    errors,
    validateField,
    validateForm,
    validatePage,
    clearError,
    setFieldError,
    clearAllErrors,
    setErrors
  };
};

export default useFormValidation;
