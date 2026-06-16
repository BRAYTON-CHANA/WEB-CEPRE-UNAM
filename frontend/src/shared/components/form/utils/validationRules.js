/**
 * Utilidades de validación para formularios
 */

export const validators = {
  /**
   * Valida que el campo no esté vacío
   * @param {*} value - Valor a validar
   * @returns {string|null} - Mensaje de error o null
   */
  required: (value) => {
    if (!value || value.toString().trim() === '') {
      return 'Este campo es requerido';
    }
    return null;
  },

  /**
   * Valida longitud mínima
   * @param {*} value - Valor a validar
   * @param {number} length - Longitud mínima
   * @returns {string|null} - Mensaje de error o null
   */
  minLength: (value, length) => {
    if (value && value.length < length) {
      return `Mínimo ${length} caracteres`;
    }
    return null;
  },

  /**
   * Valida longitud máxima
   * @param {*} value - Valor a validar
   * @param {number} length - Longitud máxima
   * @returns {string|null} - Mensaje de error o null
   */
  maxLength: (value, length) => {
    if (value && value.length > length) {
      return `Máximo ${length} caracteres`;
    }
    return null;
  },

  /**
   * Valida patrón regex
   * @param {*} value - Valor a validar
   * @param {RegExp} pattern - Patrón a validar
   * @param {string} message - Mensaje de error personalizado
   * @returns {string|null} - Mensaje de error o null
   */
  pattern: (value, pattern, message = 'Formato inválido') => {
    if (value && !pattern.test(value)) {
      return message;
    }
    return null;
  },

  /**
   * Valida que el valor sea un email válido
   * @param {*} value - Valor a validar
   * @returns {string|null} - Mensaje de error o null
   */
  email: (value) => {
    if (!value) return null;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(value)) {
      return 'Correo electrónico inválido';
    }
    return null;
  },

  /**
   * Valida que el valor sea un número
   * @param {*} value - Valor a validar
   * @returns {string|null} - Mensaje de error o null
   */
  numeric: (value) => {
    if (!value) return null;
    if (isNaN(value)) {
      return 'Debe ser un número válido';
    }
    return null;
  },

  /**
   * Valida rango numérico
   * @param {*} value - Valor a validar
   * @param {number} min - Valor mínimo
   * @param {number} max - Valor máximo
   * @returns {string|null} - Mensaje de error o null
   */
  range: (value, min, max) => {
    if (!value && value !== 0) return null;
    const num = Number(value);
    if (num < min || num > max) {
      return `Debe estar entre ${min} y ${max}`;
    }
    return null;
  }
};

/**
 * Ejecuta múltiples validadores y retorna el primer error encontrado
 * @param {*} value - Valor a validar
 * @param {Array} validations - Array de funciones de validación
 * @returns {string} - Mensaje de error o string vacío
 */
export const validate = (value, validations) => {
  for (const validation of validations) {
    const error = validation(value);
    if (error) return error;
  }
  return '';
};

/**
 * Crea una función de validación compuesta basada en reglas
 * @param {Object} rules - Reglas de validación
 * @returns {Function} - Función de validación
 */
export const createValidator = (rules) => {
  return (value) => {
    const validations = [];

    if (rules.required) {
      validations.push((v) => validators.required(v));
    }

    if (rules.minLength) {
      validations.push((v) => validators.minLength(v, rules.minLength));
    }

    if (rules.maxLength) {
      validations.push((v) => validators.maxLength(v, rules.maxLength));
    }

    if (rules.pattern) {
      validations.push((v) => validators.pattern(v, rules.pattern, rules.message));
    }

    if (rules.email) {
      validations.push((v) => validators.email(v));
    }

    if (rules.numeric) {
      validations.push((v) => validators.numeric(v));
    }

    if (rules.min !== undefined || rules.max !== undefined) {
      validations.push((v) => validators.range(v, rules.min ?? -Infinity, rules.max ?? Infinity));
    }

    return validate(value, validations);
  };
};

export default validators;
