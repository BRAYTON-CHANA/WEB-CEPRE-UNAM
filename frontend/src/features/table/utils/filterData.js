/**
 * Utilidades para filtrado de datos en tablas
 * Soporta operadores: =, !=, >, >=, <, <=, contains, starts, ends, empty, !empty, in, notIn
 */

/**
 * Aplica filtros fijos a los datos
 * @param {Array} data - Datos originales
 * @param {Array} fixatedFilters - Array de {column, op, value}
 * @returns {Array} Datos filtrados
 */
export const applyFixatedFilters = (data, fixatedFilters) => {
  if (!fixatedFilters || fixatedFilters.length === 0) return data;

  return data.filter((row) => {
    return fixatedFilters.every((filter) => {
      const { column, op, value } = filter;
      const rowValue = row[column];
      return evaluateOperator(rowValue, op, value);
    });
  });
};

/**
 * Evalúa un operador de filtrado
 * @param {*} rowValue - Valor de la celda
 * @param {string} op - Operador (=, !=, >, etc.)
 * @param {*} filterValue - Valor a comparar
 * @returns {boolean} Resultado de la comparación
 */
export const evaluateOperator = (rowValue, op, filterValue) => {
  const operators = {
    '=': (a, b) => a == b,
    '!=': (a, b) => a != b,
    '>': (a, b) => a > b,
    '>=': (a, b) => a >= b,
    '<': (a, b) => a < b,
    '<=': (a, b) => a <= b,
    contains: (a, b) =>
      String(a).toLowerCase().includes(String(b).toLowerCase()),
    starts: (a, b) =>
      String(a).toLowerCase().startsWith(String(b).toLowerCase()),
    ends: (a, b) =>
      String(a).toLowerCase().endsWith(String(b).toLowerCase()),
    empty: (a) => a === null || a === undefined || a === '',
    '!empty': (a) => a !== null && a !== undefined && a !== '',
    in: (a, b) => Array.isArray(b) && b.includes(a),
    notIn: (a, b) => Array.isArray(b) && !b.includes(a),
  };

  const operatorFn = operators[op];
  if (!operatorFn) return true; // Si no existe operador, pasar

  return operatorFn(rowValue, filterValue);
};

export default {
  applyFixatedFilters,
  evaluateOperator,
};
