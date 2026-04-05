/**
 * Definición de esquemas para todas las tablas del sistema
 * Ahora genera schemas automáticamente desde la estructura real de la base de datos
 */
const DatabaseManager = require('./DatabaseManager');

class TableSchema {
  static schemas = new Map(); // Cache dinámico de esquemas detectados
  static initialized = false; // Bandera para inicialización automática

  /**
   * Obtener esquema por nombre de tabla (con auto-detección)
   * @param {string} tableName - Nombre de la tabla
   * @returns {Object|null} - Esquema de la tabla o null si no existe
   */
  static async getSchema(tableName) {
    // Inicializar si es necesario
    if (!this.initialized) {
      await this.initializeSchemas();
    }

    // Verificar cache primero
    if (this.schemas.has(tableName)) {
      return this.schemas.get(tableName);
    }

    // Intentar detectar desde la base de datos
    const detectedSchema = await DatabaseManager.getTableSchema(tableName);
    if (detectedSchema) {
      this.schemas.set(tableName, detectedSchema);
      return detectedSchema;
    }

    console.warn(`Esquema no encontrado para tabla: ${tableName}`);
    return null;
  }

  /**
   * Obtener esquema síncrono (versión legacy para compatibilidad)
   * @param {string} tableName - Nombre de la tabla
   * @returns {Object|null} - Esquema de la tabla o null si no existe
   */
  static getSchemaSync(tableName) {
    // Verificar cache primero
    if (this.schemas.has(tableName)) {
      return this.schemas.get(tableName);
    }

    // Para compatibilidad, intentar con esquemas estáticos si existen
    return this[tableName] || null;
  }

  /**
   * Inicializar todos los esquemas desde la base de datos
   */
  static async initializeSchemas() {
    if (this.initialized) return;

    try {
      console.log(' Inicializando esquemas desde la base de datos...');
      
      const schemas = await DatabaseManager.updateAllSchemas();
      
      // Guardar en cache
      for (const [tableName, schema] of Object.entries(schemas)) {
        this.schemas.set(tableName, schema);
      }
      
      this.initialized = true;
      console.log(` Esquemas inicializados: ${this.schemas.size} tablas detectadas`);
    } catch (error) {
      console.error(' Error inicializando esquemas:', error);
    }
  }

  /**
   * Forzar actualización de esquemas desde la base de datos
   */
  static async refreshSchemas() {
    // Limpiar cache
    this.schemas.clear();
    DatabaseManager.clearSchemaCache();
    
    // Reinicializar
    this.initialized = false;
    await this.initializeSchemas();
  }

  /**
   * Agregar manualmente un esquema (para compatibilidad)
   * @param {string} tableName - Nombre de la tabla
   * @param {Object} schema - Esquema de la tabla
   */
  static addSchema(tableName, schema) {
    this.schemas.set(tableName, schema);
    console.log(` Esquema agregado manualmente: ${tableName}`);
  }

  /**
   * Verificar si una tabla existe
   * @param {string} tableName - Nombre de la tabla
   * @returns {boolean} - True si existe
   */
  static async tableExists(tableName) {
    const schema = await this.getSchema(tableName);
    return schema !== null;
  }

  /**
   * Obtener todas las tablas disponibles
   * @returns {Array} - Array con nombres de tablas
   */
  static getAvailableTables() {
    return Array.from(this.schemas.keys());
  }

  /**
   * Obtener todas las tablas con sus esquemas
   * @returns {Object} - Objeto con todas las tablas y sus esquemas
   */
  static getAllSchemas() {
    const schemas = {};
    for (const [tableName, schema] of this.schemas) {
      schemas[tableName] = schema;
    }
    return schemas;
  }

  /**
   * Validar que un objeto cumpla con el esquema de una tabla
   * @param {Object} obj - Objeto a validar
   * @param {string} tableName - Nombre de la tabla
   * @returns {boolean} - True si es válido
   */
  static async validate(obj, tableName) {
    const schema = await this.getSchema(tableName);
    if (!schema) {
      console.warn(`Esquema no encontrado para tabla: ${tableName}`);
      return false;
    }

    return this.validateWithSchema(obj, schema);
  }

  /**
   * Validar con un esquema específico (versión síncrona)
   * @param {Object} obj - Objeto a validar
   * @param {Object} schema - Esquema de validación
   * @returns {boolean} - True si es válido
   */
  static validateWithSchema(obj, schema) {
    for (const [key, expectedType] of Object.entries(schema)) {
      if (key === 'id') continue; // El ID se maneja automáticamente
      
      if (obj[key] !== undefined) {
        const actualType = typeof obj[key];
        
        // Validación especial para fechas
        if (expectedType === 'string' && (key.includes('fecha') || key.includes('date'))) {
          // Validar formato de fecha básico
          const dateRegex = /^\d{4}-\d{2}-\d{2}/;
          if (!dateRegex.test(obj[key])) {
            console.warn(`Formato de fecha inválido en campo ${key}: ${obj[key]}`);
            return false;
          }
        }
        
        // Validación de tipos básicos
        if (expectedType === 'number' && actualType !== 'number') {
          console.warn(`Tipo inválido para ${key}: se esperaba ${expectedType}, se recibió ${actualType}`);
          return false;
        }
        
        if (expectedType === 'string' && actualType !== 'string') {
          console.warn(`Tipo inválido para ${key}: se esperaba ${expectedType}, se recibió ${actualType}`);
          return false;
        }
        
        if (expectedType === 'boolean' && actualType !== 'boolean') {
          console.warn(`Tipo inválido para ${key}: se esperaba ${expectedType}, se recibió ${actualType}`);
          return false;
        }
        
        if (expectedType === 'object' && actualType !== 'object') {
          console.warn(`Tipo inválido para ${key}: se esperaba ${expectedType}, se recibió ${actualType}`);
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * Crear objeto con valores por defecto según el esquema
   * @param {string} tableName - Nombre de la tabla
   * @returns {Object} - Objeto con valores por defecto
   */
  static async createDefaultObject(tableName) {
    const schema = await this.getSchema(tableName);
    if (!schema) {
      return {};
    }

    return this.createDefaultFromSchema(schema);
  }

  /**
   * Crear objeto por defecto desde un esquema específico
   * @param {Object} schema - Esquema de la tabla
   * @returns {Object} - Objeto con valores por defecto
   */
  static createDefaultFromSchema(schema) {
    const defaultObj = {};
    const now = new Date().toISOString();

    for (const [key, type] of Object.entries(schema)) {
      if (key === 'id') continue;
      
      switch (type) {
        case 'string':
          if (key.includes('fecha') || key.includes('date')) {
            defaultObj[key] = now.split('T')[0]; // Formato YYYY-MM-DD
          } else if (key.includes('created_at') || key.includes('updated_at')) {
            defaultObj[key] = now;
          } else {
            defaultObj[key] = '';
          }
          break;
        case 'number':
          defaultObj[key] = 0;
          break;
        case 'boolean':
          defaultObj[key] = false;
          break;
        case 'object':
          defaultObj[key] = {};
          break;
        default:
          defaultObj[key] = null;
      }
    }

    return defaultObj;
  }

  /**
   * Lista de todas las tablas disponibles (legacy)
   * @returns {Array} - Array con nombres de tablas
   */
  static getAvailableTablesLegacy() {
    return Object.keys(this).filter(key => 
      typeof this[key] === 'object' && 
      !key.includes('availableTables') && 
      !key.includes('prototype')
    );
  }

  /**
   * Obtener información del sistema de esquemas
   * @returns {Object} - Información del estado actual
   */
  static getSystemInfo() {
    return {
      initialized: this.initialized,
      totalSchemas: this.schemas.size,
      availableTables: this.getAvailableTables(),
      cacheSize: this.schemas.size
    };
  }

  /**
   * Limpiar todos los esquemas (para testing)
   */
  static clear() {
    this.schemas.clear();
    this.initialized = false;
    DatabaseManager.clearSchemaCache();
  }
}

module.exports = TableSchema;
