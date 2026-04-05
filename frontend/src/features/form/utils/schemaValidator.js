/**
 * Utilidad para validar campos de formulario contra el schema de la base de datos
 */

/**
 * Valida que los campos del formulario existan en el schema de la tabla
 * @param {Object} formData - Datos del formulario
 * @param {Object} schema - Schema de la tabla desde el backend
 * @param {Array} formFields - Array de definiciones de campos del form
 * @param {string} tableName - Nombre de la tabla (para mensajes de error)
 * @returns {Array} - Array de errores de mismatch, vacío si todo OK
 */
export const validateFieldsAgainstSchema = (formData, schema, formFields, tableName = '') => {
  const mismatches = [];
  
  //console.log('[schemaValidator] Validando campos contra schema...');
  //console.log('[schemaValidator] formData:', formData);
  //console.log('[schemaValidator] schema:', schema);
  //console.log('[schemaValidator] formFields:', formFields.map(f => f.name));
  
  if (!schema || typeof schema !== 'object') {
    console.error('[schemaValidator] Schema inválido:', schema);
    return [{ field: '*', error: 'No se pudo obtener el schema de la tabla' }];
  }
  
  const schemaFields = Object.keys(schema);
  //console.log('[schemaValidator] Campos en schema:', schemaFields);
  
  formFields.forEach(field => {
    const fieldName = field.name;
    
    // Verificar que el campo exista en el schema
    if (!schemaFields.includes(fieldName)) {
      console.warn(`[schemaValidator] Campo "${fieldName}" NO existe en el schema`);
      mismatches.push({
        field: fieldName,
        error: `El campo "${fieldName}" no existe en la tabla${tableName ? ` "${tableName}"` : ''}`
      });
    } else {
      //console.log(`[schemaValidator] Campo "${fieldName}" ✓ existe en schema`);
    }
  });
  
  //console.log('[schemaValidator] Mismatches totales:', mismatches);
  return mismatches;
};

/**
 * Construye el payload para enviar al backend
 * Filtra solo campos que existen en el schema y excluye el primary key
 * @param {Object} formData - Datos del formulario
 * @param {Object} schema - Schema de la tabla
 * @param {string} primaryKey - Nombre del campo primary key
 * @returns {Object} - Payload filtrado y limpio
 */
export const buildPayload = (formData, schema, primaryKey) => {
  const payload = {};
  
  //console.log('[schemaValidator] Construyendo payload...');
  //console.log('[schemaValidator] formData:', formData);
  //console.log('[schemaValidator] schema:', schema);
  //console.log('[schemaValidator] primaryKey:', primaryKey);
  
  if (!schema || typeof schema !== 'object') {
    console.warn('[schemaValidator] Schema inválido, payload vacío');
    return payload;
  }
  
  const schemaFields = Object.keys(schema);
  
  Object.keys(formData).forEach(key => {
    // Solo incluir campos que existen en schema
    if (schemaFields.includes(key) && key !== primaryKey) {
      const value = formData[key];
      
      // No incluir campos undefined o null (a menos que sea explícito)
      if (value !== undefined) {
        payload[key] = value;
        console.log(`[schemaValidator] Campo "${key}" incluido en payload:`, value);
      } else {
        console.log(`[schemaValidator] Campo "${key}" es undefined, excluido`);
      }
    } else {
      if (!schemaFields.includes(key)) {
        console.log(`[schemaValidator] Campo "${key}" NO está en schema, excluido`);
      }
      if (key === primaryKey) {
        console.log(`[schemaValidator] Campo "${key}" es primaryKey, excluido`);
      }
    }
  });
  
  //console.log('[schemaValidator] Payload final:', payload);
  return payload;
};

/**
 * Obtiene la lista de campos del schema que no están en el formulario
 * Útil para detectar campos opcionales que faltan
 * @param {Object} schema - Schema de la tabla
 * @param {Array} formFields - Array de definiciones de campos del form
 * @returns {Array} - Campos del schema no presentes en el form
 */
export const getMissingSchemaFields = (schema, formFields) => {
  if (!schema || typeof schema !== 'object') {
    return [];
  }
  
  const formFieldNames = formFields.map(f => f.name);
  const schemaFields = Object.keys(schema);
  
  return schemaFields.filter(schemaField => !formFieldNames.includes(schemaField));
};

/**
 * Valida el tipo de dato de un campo contra el schema
 * @param {string} fieldName - Nombre del campo
 * @param {any} value - Valor del campo
 * @param {Object} schema - Schema de la tabla
 * @returns {string|null} - Mensaje de error si no coincide, null si OK
 */
export const validateFieldType = (fieldName, value, schema) => {
  if (!schema || !schema[fieldName]) {
    return null; // Campo no existe en schema, ya se valida en otra función
  }
  
  const fieldSchema = schema[fieldName];
  const fieldType = fieldSchema.type?.toLowerCase() || 'text';
  
  // Validaciones básicas por tipo SQLite
  switch (fieldType) {
    case 'integer':
    case 'int':
    case 'number':
      if (value !== '' && value !== null && value !== undefined && isNaN(Number(value))) {
        return `El campo "${fieldName}" debe ser un número`;
      }
      break;
      
    case 'real':
    case 'float':
    case 'decimal':
    case 'numeric':
      if (value !== '' && value !== null && value !== undefined && isNaN(Number(value))) {
        return `El campo "${fieldName}" debe ser un número decimal`;
      }
      break;
      
    case 'text':
    case 'varchar':
    case 'char':
      // Cualquier valor es válido como texto
      break;
      
    case 'blob':
      // Datos binarios - generalmente no se validan desde form
      break;
      
    default:
      // Tipo desconocido, no validar
      break;
  }
  
  return null;
};

/**
 * Valida todos los campos de un formulario contra sus tipos en el schema
 * @param {Object} formData - Datos del formulario
 * @param {Object} schema - Schema de la tabla
 * @returns {Array} - Array de errores de tipo
 */
export const validateAllFieldTypes = (formData, schema) => {
  const errors = [];
  
  if (!schema || typeof schema !== 'object') {
    return errors;
  }
  
  Object.keys(formData).forEach(fieldName => {
    const error = validateFieldType(fieldName, formData[fieldName], schema);
    if (error) {
      errors.push({ field: fieldName, error });
    }
  });
  
  return errors;
};

/**
 * Verifica si un campo es requerido según el schema
 * @param {string} fieldName - Nombre del campo
 * @param {Object} schema - Schema de la tabla
 * @returns {boolean} - true si el campo es NOT NULL sin default
 */
export const isFieldRequired = (fieldName, schema) => {
  if (!schema || !schema[fieldName]) {
    return false;
  }
  
  const field = schema[fieldName];
  
  // NOT NULL y sin valor por defecto = requerido
  if (field.notNull && !field.dfltValue) {
    return true;
  }
  
  return false;
};

export default {
  validateFieldsAgainstSchema,
  buildPayload,
  getMissingSchemaFields,
  validateFieldType,
  validateAllFieldTypes,
  isFieldRequired
};
