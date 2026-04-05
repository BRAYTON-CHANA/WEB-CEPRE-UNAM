/**
 * Utilidades reutilizables para operaciones de base de datos y modelos
 * Funciones genéricas que pueden ser usadas por múltiples clases
 */

/**
 * Manejo estandarizado de errores con logging
 * @param {string} operation - Nombre de la operación que falló
 * @param {string} tableName - Nombre de la tabla
 * @param {Error} error - Error original
 * @param {string} customMessage - Mensaje personalizado (opcional)
 */
const handleDatabaseError = (operation, tableName, error, customMessage = null) => {
  const message = customMessage || `Error en ${operation} (${tableName})`;
  console.error(`${message}:`, error);
  throw error;
};

/**
 * Validar que un objeto cumpla con las reglas de un esquema
 * @param {Object} data - Datos a validar
 * @param {Object} schema - Esquema de validación
 * @param {string} tableName - Nombre de la tabla (para logging)
 * @returns {boolean} - True si es válido
 */
const validateSchema = (data, schema, tableName) => {
  if (!data || typeof data !== 'object') {
    throw new Error(`Datos inválidos para la tabla: ${tableName}`);
  }
  
  // Validación básica de tipos
  for (const [key, expectedType] of Object.entries(schema)) {
    if (key === 'id') continue; // El ID se maneja automáticamente
    
    if (data[key] !== undefined) {
      const actualType = typeof data[key];
      
      // Validación especial para fechas
      if (expectedType === 'string' && (key.includes('fecha') || key.includes('date'))) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}/;
        if (!dateRegex.test(data[key])) {
          throw new Error(`Formato de fecha inválido en campo ${key}: ${data[key]}`);
        }
      }
      
      // Validación de tipos básicos
      if (expectedType === 'number' && actualType !== 'number') {
        throw new Error(`Tipo inválido para ${key}: se esperaba ${expectedType}, se recibió ${actualType}`);
      }
      
      if (expectedType === 'string' && actualType !== 'string') {
        throw new Error(`Tipo inválido para ${key}: se esperaba ${expectedType}, se recibió ${actualType}`);
      }
      
      if (expectedType === 'boolean' && actualType !== 'boolean') {
        throw new Error(`Tipo inválido para ${key}: se esperaba ${expectedType}, se recibió ${actualType}`);
      }
      
      if (expectedType === 'object' && actualType !== 'object') {
        throw new Error(`Tipo inválido para ${key}: se esperaba ${expectedType}, se recibió ${actualType}`);
      }
    }
  }
  
  return true;
};

/**
 * Obtener valor por defecto según tipo de dato
 * @param {string} type - Tipo de dato
 * @returns {any} - Valor por defecto
 */
const getDefaultValue = (type) => {
  switch (type) {
    case 'string': return '';
    case 'number': return 0;
    case 'boolean': return false;
    case 'object': return '{}';
    default: return null;
  }
};

/**
 * Procesar valor para almacenamiento en base de datos
 * @param {any} value - Valor a procesar
 * @param {string} key - Nombre del campo
 * @param {string} type - Tipo de dato esperado
 * @param {string} now - Timestamp actual
 * @returns {any} - Valor procesado
 */
const processValueForStorage = (value, key, type, now) => {
  // Manejar timestamps
  if (key.includes('created_at') || key.includes('updated_at')) {
    return now;
  }
  
  // Manejar valores undefined
  if (value === undefined) {
    return getDefaultValue(type);
  }
  
  // Convertir objetos a JSON
  if (typeof value === 'object' && value !== null && type === 'object') {
    return JSON.stringify(value);
  }
  
  return value;
};

/**
 * Parsear campos JSON de resultados de base de datos
 * @param {Array} rows - Filas de la base de datos
 * @param {Object} schema - Esquema de la tabla
 * @returns {Array} - Filas con campos JSON parseados
 */
const parseJsonFields = (rows, schema) => {
  return rows.map(row => {
    const parsedRow = { ...row };
    
    // Convertir campos JSON de texto a objeto
    Object.keys(schema).forEach(key => {
      if (schema[key] === 'object' && parsedRow[key]) {
        try {
          parsedRow[key] = JSON.parse(parsedRow[key]);
        } catch (error) {
          parsedRow[key] = {};
        }
      }
    });
    
    return parsedRow;
  });
};

/**
 * Construir cláusula WHERE a partir de un objeto de condiciones
 * @param {Object} conditions - Condiciones WHERE
 * @returns {Object} - { whereClause, params }
 */
const buildWhereClause = (conditions) => {
  if (!conditions || typeof conditions !== 'object') {
    return { whereClause: '', params: [] };
  }
  
  const whereParts = [];
  const params = [];
  
  Object.keys(conditions).forEach(field => {
    whereParts.push(`${field} = ?`);
    params.push(conditions[field]);
  });
  
  return {
    whereClause: whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '',
    params
  };
};

/**
 * Construir cláusula ORDER BY
 * @param {string|Array} orderBy - Campo y dirección o array de campos
 * @returns {string} - Cláusula ORDER BY completa
 */
const buildOrderByClause = (orderBy) => {
  if (!orderBy) return 'ORDER BY created_at DESC';
  
  if (Array.isArray(orderBy)) {
    return `ORDER BY ${orderBy.join(', ')}`;
  }
  
  return `ORDER BY ${orderBy}`;
};

/**
 * Construir cláusula LIMIT
 * @param {number} limit - Límite de resultados
 * @param {number} offset - Desplazamiento (opcional)
 * @returns {Object} - { limitClause, params }
 */
const buildLimitClause = (limit, offset = null) => {
  if (!limit) return { limitClause: '', params: [] };
  
  const params = [limit];
  let clause = `LIMIT ?`;
  
  if (offset !== null) {
    clause += ' OFFSET ?';
    params.push(offset);
  }
  
  return { limitClause: clause, params };
};

/**
 * Validar y normalizar campo ID
 * @param {any} id - ID a validar
 * @param {string} idField - Nombre del campo ID
 * @returns {any} - ID validado
 */
const validateId = (id, idField = 'id') => {
  if (id === undefined || id === null) {
    throw new Error(`El campo ${idField} es requerido`);
  }
  
  // Convertir a número si es string numérico
  if (typeof id === 'string' && !isNaN(id)) {
    return parseInt(id, 10);
  }
  
  return id;
};

/**
 * Crear objeto de paginación
 * @param {number} page - Página actual
 * @param {number} limit - Límite por página
 * @param {number} total - Total de registros
 * @returns {Object} - Metadata de paginación
 */
const createPaginationMetadata = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page * limit < total,
    hasPrev: page > 1,
    isFirst: page === 1,
    isLast: page >= totalPages
  };
};

/**
 * Filtrar campos por tipo
 * @param {Object} schema - Esquema de la tabla
 * @param {string} type - Tipo a filtrar
 * @param {Array} excludeFields - Campos a excluir (opcional)
 * @returns {Array} - Lista de campos del tipo especificado
 */
const filterFieldsByType = (schema, type, excludeFields = []) => {
  return Object.keys(schema).filter(key => 
    schema[key] === type && 
    !excludeFields.includes(key)
  );
};

/**
 * Generar timestamp ISO actual
 * @returns {string} - Timestamp en formato ISO
 */
const getCurrentTimestamp = () => {
  return new Date().toISOString();
};

module.exports = {
  handleDatabaseError,
  validateSchema,
  getDefaultValue,
  processValueForStorage,
  parseJsonFields,
  buildWhereClause,
  buildOrderByClause,
  buildLimitClause,
  validateId,
  createPaginationMetadata,
  filterFieldsByType,
  getCurrentTimestamp
};
