import { useState, useCallback } from 'react';
import { evaluateHidden } from '../utils/conditionEvaluator';

/**
 * Evalúa si un campo debe mostrarse según su condición
 * @param {Object} condition - Condición del campo
 * @param {Object} formData - Datos actuales del formulario
 * @returns {boolean} - true si el campo debe mostrarse
 */
const evaluateCondition = (condition, formData) => {
  if (!condition) return true;
  
  const fieldValue = formData[condition.field];
  
  // Función personalizada
  if (condition.when && typeof condition.when === 'function') {
    return condition.when(fieldValue, formData);
  }
  
  // Igualdad simple
  if (condition.equals !== undefined) {
    return fieldValue === condition.equals;
  }
  
  // Diferente de
  if (condition.notEquals !== undefined) {
    return fieldValue !== condition.notEquals;
  }
  
  // Dentro de array
  if (condition.in !== undefined && Array.isArray(condition.in)) {
    return condition.in.includes(fieldValue);
  }
  
  // Fuera de array
  if (condition.notIn !== undefined && Array.isArray(condition.notIn)) {
    return !condition.notIn.includes(fieldValue);
  }
  
  // Condiciones múltiples (AND)
  if (condition.and && Array.isArray(condition.and)) {
    return condition.and.every(subCondition => evaluateCondition(
      { ...subCondition, field: subCondition.field || condition.field },
      formData
    ));
  }
  
  // Condiciones múltiples (OR)
  if (condition.or && Array.isArray(condition.or)) {
    return condition.or.some(subCondition => evaluateCondition(
      { ...subCondition, field: subCondition.field || condition.field },
      formData
    ));
  }
  
  return true;
};

/**
 * Obtiene la lista de campos visibles según sus condiciones
 * @param {Array} fields - Array de definiciones de campos
 * @param {Object} formData - Datos del formulario
 * @returns {Array} - Campos que deben mostrarse
 */
const getVisibleFields = (fields, formData) => {
  if (!fields || !Array.isArray(fields)) return [];
  return fields.filter(field => {
    // Evaluar condition (si existe)
    const conditionVisible = evaluateCondition(field.condition, formData);
    if (!conditionVisible) return false;
    
    // Evaluar hidden (si el campo está oculto, no es visible)
    if (field.hidden) {
      const isHidden = evaluateHidden(field.hidden, formData);
      if (isHidden) return false;
    }
    
    return true;
  });
};

/**
 * Hook para manejar la validación de formularios
 * @param {Object|Function} validationRules - Reglas de validación por campo o función de validación
 * @param {Array} fields - Array de definiciones de campos (para evaluar condiciones)
 * @returns {Object} - Estado y funciones de validación
 */
export const useFormValidation = (validationRules = {}, fields = []) => {
  const [errors, setErrors] = useState({});

  /**
   * Verifica si validationRules es una función
   */
  const isFunctionValidation = useCallback(() => {
    return typeof validationRules === 'function';
  }, [validationRules]);

  /**
   * Valida un campo específico
   * @param {string} fieldName - Nombre del campo
   * @param {*} value - Valor a validar
   * @returns {string} - Mensaje de error o string vacío
   */
  const validateField = useCallback((fieldName, value) => {
    // Si es validación por función, no validamos campo por campo
    if (isFunctionValidation()) return '';

    const rules = validationRules[fieldName];
    if (!rules) return '';

    if (rules.required && (!value || value.toString().trim() === '')) {
      return rules.required.message || 'Este campo es requerido';
    }

    if (rules.minLength && value && value.length < rules.minLength) {
      return rules.minLength.message || `Mínimo ${rules.minLength} caracteres`;
    }

    if (rules.maxLength && value && value.length > rules.maxLength) {
      return rules.maxLength.message || `Máximo ${rules.maxLength} caracteres`;
    }

    if (rules.pattern && value && !rules.pattern.test(value)) {
      return rules.message || 'Formato inválido';
    }

    // Validación numérica min (para campos number/integer/float)
    if (rules.min !== undefined && value !== '' && value !== null && value !== undefined) {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue < rules.min.value) {
        return rules.min.message || `Debe ser mayor o igual a ${rules.min.value}`;
      }
    }

    // Validación numérica max
    if (rules.max !== undefined && value !== '' && value !== null && value !== undefined) {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue > rules.max.value) {
        return rules.max.message || `Debe ser menor o igual a ${rules.max.value}`;
      }
    }

    return '';
  }, [validationRules, isFunctionValidation]);

  /**
   * Valida todo el formulario
   * @param {Object} formData - Datos del formulario
   * @returns {boolean} - true si es válido, false si no
   */
  const validateForm = useCallback((formData) => {
    let newErrors = {};
    console.log('[useFormValidation] validateForm called');
    console.log('[useFormValidation] isFunctionValidation:', isFunctionValidation());
    console.log('[useFormValidation] formData:', formData);

    // Obtener solo los campos visibles
    const visibleFields = getVisibleFields(fields, formData);
    const visibleFieldNames = new Set(visibleFields.map(f => f.name));

    if (isFunctionValidation()) {
      // Validación por función - recibe todos los valores y retorna errores
      newErrors = validationRules(formData) || {};
      // Filtrar errores de campos ocultos
      Object.keys(newErrors).forEach(fieldName => {
        if (!visibleFieldNames.has(fieldName)) {
          delete newErrors[fieldName];
        }
      });
    } else {
      // Validación por reglas de campo - solo campos visibles
      Object.keys(validationRules).forEach((fieldName) => {
        // Saltar campos ocultos
        if (!visibleFieldNames.has(fieldName)) return;
        
        const value = formData[fieldName];
        const error = validateField(fieldName, value);

        if (error) {
          newErrors[fieldName] = error;
        }
      });
    }

    console.log('[useFormValidation] newErrors:', newErrors);
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log('[useFormValidation] isValid:', isValid);

    return isValid;
  }, [validationRules, validateField, isFunctionValidation, fields]);

  /**
   * Valida solo los campos de una página específica
   * @param {Object} formData - Datos del formulario
   * @param {Array} pageFieldNames - Nombres de campos de la página a validar
   * @returns {boolean} - true si la página es válida
   */
  const validatePage = useCallback((formData, pageFieldNames) => {
    let newErrors = {};

    // Obtener solo los campos visibles
    const visibleFields = getVisibleFields(fields, formData);
    const visibleFieldNames = new Set(visibleFields.map(f => f.name));

    if (isFunctionValidation()) {
      // Validación por función - validamos todos los campos pero solo mostramos errores de la página
      const allErrors = validationRules(formData) || {};
      pageFieldNames.forEach((fieldName) => {
        // Solo incluir errores de campos visibles
        if (allErrors[fieldName] && visibleFieldNames.has(fieldName)) {
          newErrors[fieldName] = allErrors[fieldName];
          console.log('[useFormValidation] newError:', newErrors[fieldName]);
        }
      });
    } else {
      // Validación por reglas de campo
      pageFieldNames.forEach((fieldName) => {
        // Saltar campos ocultos
        if (!visibleFieldNames.has(fieldName)) return;
        
        const rules = validationRules[fieldName];
        if (!rules) return;

        const value = formData[fieldName];
        const error = validateField(fieldName, value);

        if (error) {
          newErrors[fieldName] = error;
          console.log('[useFormValidation] newError:', newErrors[fieldName]);
        }
      });
    }

    // Merge con errores existentes (para mantener errores de otras páginas)
    setErrors((prev) => ({
      ...prev,
      ...newErrors
    }));

    const isValid = Object.keys(newErrors).length === 0;

    return isValid;
  }, [validationRules, validateField, isFunctionValidation, fields]);

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
