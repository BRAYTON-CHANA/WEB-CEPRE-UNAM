const DatabaseManager = require('../database/DatabaseManager');
const DynamicModel = require('../models/DynamicModel');

/**
 * Registro centralizado de tablas disponibles
 * Gestiona qué tablas pueden ser accedidas vía API genérica
 */
class TableRegistry {
  constructor() {
    this.tables = new Map();
    this.initialized = false;
  }

  /**
   * Inicializar el registro con todas las tablas disponibles
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      console.log('🔄 Inicializando TableRegistry...');
      
      // Obtener todas las tablas de la base de datos
      const allTables = await DatabaseManager.getAllTables();
      
      // Filtrar y registrar solo las tablas permitidas
      for (const tableName of allTables) {
        const validation = await DynamicModel.validateTable(tableName);
        
        console.log(`[REGISTRY] Validando tabla ${tableName}:`, validation);
        
        if (validation.valid) {
          this.tables.set(tableName, {
            name: tableName,
            schema: validation.schema,
            registeredAt: new Date().toISOString(),
            accessible: true
          });
          
          console.log(`✅ Tabla registrada: ${tableName}`);
        } else {
          console.warn(`⚠️ Tabla omitida: ${tableName} - ${validation.error}`);
        }
      }
      
      this.initialized = true;
      console.log(`📊 Registry inicializado: ${this.tables.size} tablas registradas`);
      
    } catch (error) {
      console.error('❌ Error inicializando TableRegistry:', error);
      throw error;
    }
  }

  /**
   * Verificar si el registro está inicializado
   */
  ensureInitialized() {
    if (!this.initialized) {
      throw new Error('TableRegistry no está inicializado. Llama a initialize() primero.');
    }
  }

  /**
   * Obtener todas las tablas registradas
   */
  getRegisteredTables() {
    this.ensureInitialized();
    
    return Array.from(this.tables.entries()).map(([name, info]) => ({
      name,
      ...info
    }));
  }

  /**
   * Verificar si una tabla está registrada
   */
  isTableRegistered(tableName) {
    this.ensureInitialized();
    return this.tables.has(tableName);
  }

  /**
   * Obtener información de una tabla específica
   */
  getTableInfo(tableName) {
    this.ensureInitialized();
    
    if (!this.tables.has(tableName)) {
      throw new Error(`La tabla "${tableName}" no está registrada`);
    }
    
    return this.tables.get(tableName);
  }

  /**
   * Crear un modelo dinámico para una tabla registrada
   */
  async createModel(tableName) {
    this.ensureInitialized();
    
    if (!this.tables.has(tableName)) {
      throw new Error(`La tabla "${tableName}" no está registrada o no es accesible`);
    }
    
    return await DynamicModel.create(tableName);
  }

  /**
   * Registrar manualmente una tabla (para tablas personalizadas)
   */
  async registerTable(tableName, options = {}) {
    this.ensureInitialized();
    
    const validation = await DynamicModel.validateTable(tableName);
    
    if (!validation.valid) {
      throw new Error(`No se puede registrar la tabla "${tableName}": ${validation.error}`);
    }
    
    this.tables.set(tableName, {
      name: tableName,
      schema: validation.schema,
      registeredAt: new Date().toISOString(),
      accessible: true,
      manuallyRegistered: true,
      ...options
    });
    
    console.log(`✅ Tabla registrada manualmente: ${tableName}`);
  }

  /**
   * Eliminar una tabla del registro
   */
  unregisterTable(tableName) {
    this.ensureInitialized();
    
    if (this.tables.delete(tableName)) {
      console.log(`🗑️ Tabla eliminada del registro: ${tableName}`);
      return true;
    }
    
    return false;
  }

  /**
   * Obtener estadísticas del registro
   */
  getRegistryStats() {
    this.ensureInitialized();
    
    const stats = {
      totalTables: this.tables.size,
      accessibleTables: 0,
      manuallyRegistered: 0,
      tables: []
    };
    
    for (const [name, info] of this.tables) {
      if (info.accessible) stats.accessibleTables++;
      if (info.manuallyRegistered) stats.manuallyRegistered++;
      
      stats.tables.push({
        name,
        fieldCount: info.schema ? Object.keys(info.schema).length : 0,
        registeredAt: info.registeredAt,
        manuallyRegistered: info.manuallyRegistered || false
      });
    }
    
    return stats;
  }

  /**
   * Refrescar el registro (volver a escanear tablas)
   */
  async refresh() {
    console.log('🔄 Refrescando TableRegistry...');
    
    // Limpiar registro actual
    this.tables.clear();
    this.initialized = false;
    
    // Volver a inicializar
    await this.initialize();
    
    console.log('✅ TableRegistry refrescado');
  }

  /**
   * Validar acceso a una tabla
   */
  async validateTableAccess(tableName, operation = 'read') {
    this.ensureInitialized();
    
    if (!this.tables.has(tableName)) {
      return {
        allowed: false,
        reason: `La tabla "${tableName}" no está registrada`
      };
    }
    
    const tableInfo = this.tables.get(tableName);
    
    if (!tableInfo.accessible) {
      return {
        allowed: false,
        reason: `La tabla "${tableName}" no es accesible`
      };
    }
    
    // Validaciones adicionales según la operación
    if (operation === 'write') {
      // Verificar que la tabla tenga campos actualizables
      const schema = tableInfo.schema;
      const updatableFields = Object.keys(schema).filter(field => 
        field !== 'ID' && field !== 'id' && 
        field !== 'CREATED_AT' && field !== 'created_at'
      );
      
      if (updatableFields.length === 0) {
        return {
          allowed: false,
          reason: `La tabla "${tableName}" no tiene campos actualizables`
        };
      }
    }
    
    return {
      allowed: true,
      tableInfo
    };
  }

  /**
   * Buscar tablas por criterios
   */
  searchTables(criteria = {}) {
    this.ensureInitialized();
    
    const results = [];
    
    for (const [name, info] of this.tables) {
      let matches = true;
      
      // Búsqueda por nombre
      if (criteria.name && !name.toLowerCase().includes(criteria.name.toLowerCase())) {
        matches = false;
      }
      
      // Búsqueda por número de campos
      if (criteria.minFields && info.schema && Object.keys(info.schema).length < criteria.minFields) {
        matches = false;
      }
      
      if (criteria.maxFields && info.schema && Object.keys(info.schema).length > criteria.maxFields) {
        matches = false;
      }
      
      // Búsqueda por fecha de registro
      if (criteria.registeredAfter && new Date(info.registeredAt) < new Date(criteria.registeredAfter)) {
        matches = false;
      }
      
      // Búsqueda por registro manual
      if (criteria.manuallyRegistered !== undefined && info.manuallyRegistered !== criteria.manuallyRegistered) {
        matches = false;
      }
      
      if (matches) {
        results.push({
          name,
          ...info
        });
      }
    }
    
    return results;
  }

  /**
   * Exportar configuración del registro
   */
  exportRegistry() {
    this.ensureInitialized();
    
    return {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      tables: this.getRegisteredTables(),
      stats: this.getRegistryStats()
    };
  }

  /**
   * Limpiar el registro
   */
  clear() {
    this.tables.clear();
    this.initialized = false;
    console.log('🗑️ TableRegistry limpiado');
  }
}

// Instancia singleton del registro
const tableRegistry = new TableRegistry();

module.exports = tableRegistry;
