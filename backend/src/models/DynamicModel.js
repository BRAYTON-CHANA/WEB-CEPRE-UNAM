const Table = require('./Table');
const DatabaseManager = require('../database/DatabaseManager');

/**
 * Factory para crear modelos de tabla dinámicamente
 * Permite crear instancias de Table para cualquier tabla sin necesidad de clases específicas
 */
class DynamicModel {
  /**
   * Crea una instancia de modelo para cualquier tabla
   * @param {string} tableName - Nombre de la tabla
   * @param {Object} options - Opciones de configuración
   * @returns {Object} - Instancia de Table configurada para la tabla especificada
   */
  static async create(tableName, options = {}) {
    // Validar que la tabla exista
    const tables = await DatabaseManager.getAllTables();
    if (!tables.includes(tableName)) {
      throw new Error(`La tabla "${tableName}" no existe en la base de datos`);
    }
    
    // Crear una clase dinámica que hereda de Table
    class DynamicTable extends Table {
      constructor() {
        super(tableName, { idField: 'ID', ...options });
      }
      
      /**
       * Información del modelo dinámico
       */
      getModelInfo() {
        return {
          modelName: `Dynamic${tableName}`,
          tableName,
          idField: 'ID',
          description: `Modelo dinámico para la tabla ${tableName}`,
          isDynamic: true,
          createdAt: new Date().toISOString()
        };
      }
      
      /**
       * Obtener estadísticas específicas para esta tabla
       */
      async getStats() {
        try {
          const schema = await DatabaseManager.getTableSchema(tableName);
          const stats = {};
          
          // Estadística básica
          const totalResult = await DatabaseManager.get(
            `SELECT COUNT(*) as total FROM ${this.tableName}`
          );
          stats.total = totalResult.total;
          
          // Estadísticas por tipo de campo
          for (const [fieldName, fieldConfig] of Object.entries(schema)) {
            const fieldType = fieldConfig.type?.toLowerCase();
            
            if (fieldType.includes('int') || fieldType.includes('float') || fieldType.includes('real')) {
              // Estadísticas para campos numéricos
              const numStats = await DatabaseManager.get(`
                SELECT 
                  AVG(${fieldName}) as avg,
                  MIN(${fieldName}) as min,
                  MAX(${fieldName}) as max,
                  COUNT(${fieldName}) as count
                FROM ${this.tableName} 
                WHERE ${fieldName} IS NOT NULL
              `);
              stats[fieldName] = {
                type: 'numeric',
                avg: numStats.avg,
                min: numStats.min,
                max: numStats.max,
                count: numStats.count
              };
            } else if (fieldType.includes('boolean') || fieldType.includes('tinyint')) {
              // Estadísticas para campos booleanos
              const boolStats = await DatabaseManager.get(`
                SELECT 
                  COUNT(CASE WHEN ${fieldName} = 1 THEN 1 END) as true_count,
                  COUNT(CASE WHEN ${fieldName} = 0 THEN 1 END) as false_count,
                  COUNT(${fieldName}) as total
                FROM ${this.tableName}
              `);
              stats[fieldName] = {
                type: 'boolean',
                true_count: boolStats.true_count,
                false_count: boolStats.false_count,
                total: boolStats.total
              };
            } else if (fieldType.includes('text') || fieldType.includes('char')) {
              // Estadísticas para campos de texto
              const textStats = await DatabaseManager.get(`
                SELECT 
                  COUNT(${fieldName}) as count,
                  AVG(LENGTH(${fieldName})) as avg_length,
                  MAX(LENGTH(${fieldName})) as max_length
                FROM ${this.tableName} 
                WHERE ${fieldName} IS NOT NULL AND ${fieldName} != ''
              `);
              stats[fieldName] = {
                type: 'text',
                count: textStats.count,
                avg_length: textStats.avg_length,
                max_length: textStats.max_length
              };
            }
          }
          
          return stats;
        } catch (error) {
          console.error(`Error obteniendo estadísticas para ${tableName}:`, error);
          throw error;
        }
      }
      
      /**
       * Validar datos para esta tabla específica
       */
      validateData(data) {
        const schema = this.getSchema();
        const errors = [];
        
        for (const [fieldName, fieldConfig] of Object.entries(schema)) {
          const value = data[fieldName];
          
          // Validación de required
          if (fieldConfig.nullable === false && (value === undefined || value === null || value === '')) {
            errors.push(`El campo ${fieldName} es requerido`);
          }
          
          // Validación de tipo
          if (value !== undefined && value !== null) {
            const fieldType = fieldConfig.type?.toLowerCase();
            
            if (fieldType.includes('int') && !Number.isInteger(Number(value))) {
              errors.push(`El campo ${fieldName} debe ser un entero`);
            }
            
            if ((fieldType.includes('float') || fieldType.includes('real')) && !Number.isFinite(Number(value))) {
              errors.push(`El campo ${fieldName} debe ser un número decimal`);
            }
            
            if (fieldType.includes('boolean') && typeof value !== 'boolean' && ![0, 1, '0', '1'].includes(value)) {
              errors.push(`El campo ${fieldName} debe ser booleano (0/1)`);
            }
          }
        }
        
        if (errors.length > 0) {
          throw new Error(`Validación fallida: ${errors.join(', ')}`);
        }
        
        return true;
      }
      
      /**
       * Transformar datos antes de guardar
       */
      transformData(data) {
        const schema = this.getSchema();
        const transformed = { ...data };
        
        for (const [fieldName, fieldConfig] of Object.entries(schema)) {
          const value = transformed[fieldName];
          
          if (value !== undefined && value !== null) {
            const fieldType = fieldConfig.type?.toLowerCase();
            
            // Transformación de booleanos
            if (fieldType.includes('boolean') || fieldType.includes('tinyint')) {
              if (typeof value === 'boolean') {
                transformed[fieldName] = value ? 1 : 0;
              } else if (value === 'true' || value === '1') {
                transformed[fieldName] = 1;
              } else if (value === 'false' || value === '0') {
                transformed[fieldName] = 0;
              }
            }
            
            // Transformación de números
            if (fieldType.includes('int') || fieldType.includes('float') || fieldType.includes('real')) {
              transformed[fieldName] = Number(value);
            }
            
            // Transformación de JSON
            if (fieldType.includes('json') && typeof value === 'object') {
              transformed[fieldName] = JSON.stringify(value);
            }
          }
        }
        
        return transformed;
      }
      
      /**
       * Obtener schema de la tabla
       */
      async getSchema() {
        return await DatabaseManager.getTableSchema(this.tableName);
      }
    }
    
    // Crear y retornar instancia
    const instance = new DynamicTable();
    await instance.initializeAsync(tableName, { idField: 'ID', ...options });
    
    return instance;
  }
  
  /**
   * Obtener información de todas las tablas disponibles
   */
  static async getAvailableTables() {
    try {
      const tables = await DatabaseManager.getAllTables();
      const tableInfos = [];
      
      for (const tableName of tables) {
        try {
          const schema = await DatabaseManager.getTableSchema(tableName);
          const recordCount = await DatabaseManager.get(
            `SELECT COUNT(*) as count FROM ${tableName}`
          );
          
          tableInfos.push({
            name: tableName,
            fieldCount: Object.keys(schema).length,
            recordCount: recordCount.count,
            schema: schema
          });
        } catch (error) {
          console.warn(`Error obteniendo información de la tabla ${tableName}:`, error.message);
          tableInfos.push({
            name: tableName,
            fieldCount: 0,
            recordCount: 0,
            schema: null,
            error: error.message
          });
        }
      }
      
      return tableInfos;
    } catch (error) {
      console.error('Error obteniendo tablas disponibles:', error);
      throw error;
    }
  }
  
  /**
   * Verificar si una tabla es válida para operaciones CRUD
   */
  static async validateTable(tableName) {
    try {
      const tables = await DatabaseManager.getAllTables();
      if (!tables.includes(tableName)) {
        return {
          valid: false,
          error: `La tabla "${tableName}" no existe`
        };
      }
      
      const schema = await DatabaseManager.getTableSchema(tableName);
      if (!schema || Object.keys(schema).length === 0) {
        return {
          valid: false,
          error: `La tabla "${tableName}" no tiene un schema válido`
        };
      }
      
      // Verificar que tenga un campo ID (ID exacto, id exacto, o cualquier campo que empiece con ID_/id_)
      const hasIdField = Object.keys(schema).some(field => 
        field === 'ID' || field === 'id' || field.startsWith('ID_') || field.startsWith('id_')
      ) || Object.values(schema).some(field => field.primary_key);
      
      if (!hasIdField) {
        return {
          valid: false,
          error: `La tabla "${tableName}" no tiene un campo ID válido`
        };
      }
      
      return {
        valid: true,
        schema,
        tableName
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }
}

module.exports = DynamicModel;
