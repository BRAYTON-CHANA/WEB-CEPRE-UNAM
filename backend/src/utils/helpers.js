/**
 * Utilidades de formato y validación
 */

/**
 * Formatea una fecha al formato YYYY-MM-DD
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} - Fecha formateada
 */
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

/**
 * Genera un ID único
 * @returns {string} - ID único
 */
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Valida si un email tiene formato válido
 * @param {string} email - Email a validar
 * @returns {boolean} - True si es válido
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Limpia y sanitiza un string
 * @param {string} str - String a limpiar
 * @returns {string} - String limpio
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[<>]/g, '');
};

/**
 * Pagina un array de resultados
 * @param {Array} data - Datos a paginar
 * @param {number} page - Página actual
 * @param {number} limit - Límite por página
 * @returns {Object} - Objeto con datos paginados
 */
const paginateArray = (data, page = 1, limit = 10) => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  return {
    data: data.slice(startIndex, endIndex),
    currentPage: page,
    totalPages: Math.ceil(data.length / limit),
    totalItems: data.length
  };
};

module.exports = {
  formatDate,
  generateId,
  isValidEmail,
  sanitizeString,
  paginateArray
};
