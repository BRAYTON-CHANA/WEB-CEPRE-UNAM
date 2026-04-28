/**
 * Utilidades para evaluar condiciones de campos de formulario
 * Soporta operadores: =, !=, >, >=, <, <=, contains, starts, ends, like,
 * empty, !empty, null, !null
 * Soporta grupos: and, or con mode configurable (and/or)
 */

/**
 * Verifica si un valor está vacío (null, undefined, '', [], {})
 * @param {any} value - Valor a verificar
 * @returns {boolean} - true si está vacío
 */
export const isEmptyValue = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Implementa SQL LIKE en JavaScript
 * % = cualquier secuencia, _ = un carácter
 * @param {string} value - Valor a comparar
 * @param {string} pattern - Patrón SQL LIKE
 * @returns {boolean} - true si coincide
 */
export const likeMatch = (value, pattern) => {
  const str = String(value);
  let regexPattern = pattern
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/%/g, '.*')
    .replace(/_/g, '.');
  return new RegExp(`^${regexPattern}$`, 'i').test(str);
};

/**
 * Evalúa una condición individual
 * @param {Object} config - Configuración de la condición
 * @param {Object} formData - Datos del formulario
 * @returns {boolean} - Resultado de la evaluación
 */
const evaluateSingleCondition = (config, formData) => {
  if (!config || typeof config !== 'object') {
    console.warn('[evaluateSingleCondition] Config inválida:', config);
    return false;
  }
  
  if (!config.field || !config.op) {
    console.warn('[evaluateSingleCondition] Falta field u op:', config);
    return false;
  }
  
  const fieldValue = formData[config.field];
  const { op, value } = config;
  
  switch (op) {
    // Comparación
    case '=':
    case '==':
      return fieldValue == value;
    case '!=':
      return fieldValue != value;
    case '>':
      return fieldValue > value;
    case '>=':
      return fieldValue >= value;
    case '<':
      return fieldValue < value;
    case '<=':
      return fieldValue <= value;
    
    // Texto
    case 'contains':
      return String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
    case 'starts':
    case 'startsWith':
      return String(fieldValue).startsWith(value);
    case 'ends':
    case 'endsWith':
      return String(fieldValue).endsWith(value);
    case 'like':
      return likeMatch(fieldValue, value);
    case 'in':
      return Array.isArray(value) && value.includes(fieldValue);
    case 'notIn':
      return Array.isArray(value) && !value.includes(fieldValue);
    
    // Unarios
    case 'empty':
      return isEmptyValue(fieldValue);
    case '!empty':
      return !isEmptyValue(fieldValue);
    case 'null':
      return fieldValue === null || fieldValue === undefined;
    case '!null':
      return fieldValue !== null && fieldValue !== undefined;
    
    default:
      console.warn(`[evaluateSingleCondition] Operador desconocido: ${op}`);
      return false;
  }
};

/**
 * Evalúa condiciones complejas con and/or y modo configurable
 * @param {Object} config - Configuración de condiciones
 * @param {Object} formData - Datos del formulario
 * @returns {boolean} - true si la condición se cumple
 */
export const evaluateOperatorSet = (config, formData) => {
  if (!config || typeof config !== 'object') {
    console.warn('[evaluateOperatorSet] Config inválida:', config);
    return false;
  }
  
  // Condición simple (tiene field y op directamente, sin and/or)
  if (config.field && config.op && !config.and && !config.or) {
    return evaluateSingleCondition(config, formData);
  }
  
  // Evaluar grupos and y or
  const hasAnd = config.and && Array.isArray(config.and) && config.and.length > 0;
  const hasOr = config.or && Array.isArray(config.or) && config.or.length > 0;
  
  // Si no tiene ni and ni or, evaluar como condición simple
  if (!hasAnd && !hasOr) {
    return evaluateSingleCondition(config, formData);
  }
  
  // Evaluar AND interno (todas deben cumplirse)
  let andResult = true;
  if (hasAnd) {
    andResult = config.and.every(condition => 
      evaluateSingleCondition(condition, formData)
    );
  }
  
  // Evaluar OR interno (alguna debe cumplirse)
  let orResult = false;
  if (hasOr) {
    orResult = config.or.some(condition => 
      evaluateSingleCondition(condition, formData)
    );
  }
  
  // Si solo tiene uno de los grupos, devolver ese resultado
  if (hasAnd && !hasOr) return andResult;
  if (!hasAnd && hasOr) return orResult;
  
  // Si tiene ambos grupos, combinar según mode
  const mode = config.mode || 'and';
  
  if (mode === 'or') {
    return andResult || orResult;
  } else {
    return andResult && orResult;
  }
};

/**
 * Evalúa si un campo debe ocultarse (hidden)
 * @param {Object} hidden - Config hidden del campo
 * @param {Object} formData - Datos actuales del formulario
 * @returns {boolean} - true si el campo debe ocultarse
 */
export const evaluateHidden = (hidden, formData) => {
  if (!hidden) return false;
  return evaluateOperatorSet(hidden, formData);
};

/**
 * Evalúa si un campo debe bloquearse (blocked)
 * @param {Object} blocked - Config blocked del campo
 * @param {Object} formData - Datos actuales del formulario
 * @returns {Object} - { isBlocked: boolean, shouldClear: boolean }
 */
export const evaluateBlocked = (blocked, formData) => {
  if (!blocked) return { isBlocked: false, shouldClear: false };
  const { clearOnBlock = false, ...conditions } = blocked;
  const isBlocked = evaluateOperatorSet(conditions, formData);
  return { isBlocked, shouldClear: isBlocked && clearOnBlock };
};

export default {
  isEmptyValue,
  likeMatch,
  evaluateOperatorSet,
  evaluateHidden,
  evaluateBlocked
};
