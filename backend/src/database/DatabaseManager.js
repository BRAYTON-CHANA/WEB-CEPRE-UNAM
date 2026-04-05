const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const MigrationManager = require('./MigrationManager');
const ViewManager = require('./ViewManager');

class DatabaseManager {
  // Ruta autocontenida - misma carpeta que la aplicación
  static dbPath = (() => {
    const path = require('path');
    
    // En producción (Neutralino), usar la carpeta resources/datos
    if (process.env.NL_PORT || process.platform === 'neutralino') {
      return path.join(process.resourcesPath || '.', 'datos', 'database.sqlite');
    }
    
    // En desarrollo, usar carpeta local
    return path.join(__dirname, '../../data', 'database.sqlite');
  })();
  static db = null;
  static schemaCache = new Map(); // Cache para esquemas detectados

  /**
   * Conectar a la base de datos SQLite
   */
  static connect() {
    if (!this.db) {
      // Asegurar que el directorio exista
      const fs = require('fs');
      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
        console.log(`📁 Directorio creado: ${dbDir}`);
      }
      
      this.db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
        if (err) {
          console.error('❌ Error conectando a SQLite:', err.message);
          console.error('❌ Ruta de la base de datos:', this.dbPath);
        } else {
          console.log('✅ Conectado a SQLite exitosamente');
          console.log('📍 Base de datos en:', this.dbPath);
          // Habilitar claves foráneas después de conectar
          setTimeout(() => {
            if (this.db) {
              this.db.run('PRAGMA foreign_keys = ON');
            }
          }, 100);
          
          // Inyectar dependencia en MigrationManager y ViewManager (DatabaseManager es el "mayor")
          MigrationManager.setDatabaseManager(this);
          ViewManager.setDatabaseManager(this);
        }
      });
    }
    return this.db;
  }

  /**
   * Cerrar conexión
   */
  static close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('❌ Error cerrando conexión:', err.message);
        } else {
          console.log('✅ Conexión a SQLite cerrada');
        }
      });
      this.db = null;
    }
  }

  /**
   * Ejecutar una consulta que no devuelve resultados (INSERT, UPDATE, DELETE)
   */
  static run(sql, params = []) {
    return new Promise((resolve, reject) => {
      const db = this.connect();
      db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ 
            id: this.lastID, 
            changes: this.changes 
          });
        }
      });
    });
  }

  /**
   * Obtener un solo registro
   */
  static get(sql, params = []) {
    return new Promise((resolve, reject) => {
      const db = this.connect();
      db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  /**
   * Obtener múltiples registros
   */
  static all(sql, params = []) {
    return new Promise((resolve, reject) => {
      const db = this.connect();
      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Inicializar base de datos y ejecutar migraciones
   */
  static async init() {
    try {
      console.log('🔄 Inicializando base de datos...');
      
      // Conectar primero (esto inyectará la dependencia)
      this.connect();
      
      // Pequeña espera para asegurar que la inyección se complete
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Ejecutar migraciones pendientes
      await MigrationManager.runMigrations();
      
      // Ejecutar views después de las migraciones (para que las tablas existan)
      await ViewManager.runViews();
      
      console.log('✅ Base de datos inicializada correctamente');
    } catch (error) {
      console.error('❌ Error inicializando base de datos:', error);
      throw error;
    }
  }

  /**
   * Validar que un objeto cumpla con el esquema básico
   */
  static validateObject(obj, schema) {
    for (const [key, type] of Object.entries(schema)) {
      if (key === 'id') continue;
      
      if (obj[key] !== undefined) {
        const actualType = typeof obj[key];
        if (type === 'number' && actualType !== 'number') {
          return false;
        }
        if (type === 'string' && actualType !== 'string') {
          return false;
        }
        if (type === 'boolean' && actualType !== 'boolean') {
          return false;
        }
        if (type === 'object' && actualType !== 'object') {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Crear backup de la base de datos
   */
  static async backup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(__dirname, `../../database_backup_${timestamp}.sqlite`);
    
    return new Promise((resolve, reject) => {
      const db = this.connect();
      db.backup(backupPath, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log(`✅ Backup creado en: ${backupPath}`);
          resolve(backupPath);
        }
      });
    });
  }

  /**
   * Obtener estado de las migraciones
   */
  static async getMigrationStatus() {
    return await MigrationManager.getStatus();
  }

  /**
   * Obtener estructura de una tabla desde SQLite usando PRAGMA
   * @param {string} tableName - Nombre de la tabla
   * @returns {Object|null} - Esquema en formato TableSchema o null si no existe
   */
  static async getTableSchema(tableName) {
    // Verificar cache primero
    if (this.schemaCache.has(tableName)) {
      return this.schemaCache.get(tableName);
    }

    try {
      const sql = `PRAGMA table_info(${tableName})`;
      const columns = await this.all(sql);
      
      if (!columns || columns.length === 0) {
        console.warn(`Tabla ${tableName} no encontrada o sin columnas`);
        return null;
      }

      const schema = this.convertPragmaToSchema(columns);
      
      // Guardar en cache
      this.schemaCache.set(tableName, schema);
      
      console.log(`🔍 Esquema detectado para ${tableName}:`, Object.keys(schema));
      return schema;
    } catch (error) {
      console.error(`Error obteniendo esquema de ${tableName}:`, error);
      return null;
    }
  }

  /**
   * Convertir resultado de PRAGMA table_info a formato TableSchema
   * @param {Array} pragmaColumns - Resultado de PRAGMA table_info
   * @returns {Object} - Esquema en formato TableSchema
   */
  static convertPragmaToSchema(pragmaColumns) {
    const schema = {};
    
    for (const column of pragmaColumns) {
      const columnName = column.name;
      const columnType = column.type;
      
      // Convertir tipos SQLite a tipos TableSchema
      const mappedType = this.mapSqliteTypeToSchemaType(columnType);
      
      // Determinar límites según el tipo de dato (solo tipo, no nombre)
      const limits = this.getFieldLimits(columnType);
      
      schema[columnName] = {
        type: mappedType,
        nullable: column.notnull === 0, // 0 = nullable, 1 = not null
        primary_key: column.pk === 1, // 1 = primary key
        default_value: column.dflt_value,
        auto_increment: column.pk === 1 && (columnType.includes('INTEGER') || columnType.includes('INT')),
        // Información adicional
        original_type: columnType,
        cid: column.cid,
        // Límites del campo (basado únicamente en tipo)
        ...limits
      };
    }
    
    console.log(`🔍 Schema completo para tabla:`, schema);
    return schema;
  }

  /**
   * Determinar límites de campo según tipo de dato
   * @param {string} fieldType - Tipo de dato SQLite
   * @returns {Object} - Objeto con límites y validaciones
   */
  static getFieldLimits(fieldType) {
    const typeUpper = fieldType.toUpperCase();
    const limits = {};
    
    // Límites para TEXT - basado únicamente en TIPO de dato
    if (typeUpper.includes('TEXT') || typeUpper.includes('VARCHAR') || typeUpper.includes('CHAR')) {
      limits.max_length = 1000;
      limits.description = 'Texto estándar (máximo 1000 caracteres)';
    }
    
    // Límites para INTEGER - basado únicamente en TIPO de dato
    if (typeUpper.includes('INTEGER') || typeUpper.includes('INT')) {
      limits.min = -2147483648;
      limits.max = 2147483647;
      limits.description = 'Entero estándar (0 a 2,147,483,647)';
    }
    
    // Límites para REAL/FLOAT - basado únicamente en TIPO de dato
    if (typeUpper.includes('REAL') || typeUpper.includes('FLOAT') || typeUpper.includes('DOUBLE')) {
      limits.min = -1.7976931348623e308;
      limits.max = 1.7976931348623e308;
      limits.description = 'Número decimal (precisión doble)';
    }
    
    // Límites para BOOLEAN - basado únicamente en TIPO de dato
    if (typeUpper.includes('BOOLEAN') || typeUpper.includes('BOOL')) {
      limits.allowed_values = [0, 1, true, false];
      limits.description = 'Booleano (0/1, true/false)';
    }
    
    // Límites para JSON - basado únicamente en TIPO de dato
    if (typeUpper.includes('JSON')) {
      limits.max_length = 1000000; // 1MB aprox
      limits.description = 'JSON (máximo ~1MB)';
    }
    
    // Límites para DATETIME - basado únicamente en TIPO de dato
    if (typeUpper.includes('DATE') || typeUpper.includes('DATETIME')) {
      limits.description = 'Fecha y hora (YYYY-MM-DD HH:MM:SS)';
    }
    
    return Object.keys(limits).length > 0 ? limits : null;
  }

  /**
   * Mapear tipos de datos SQLite a tipos de TableSchema
   * @param {string} sqliteType - Tipo de dato SQLite
   * @returns {string} - Tipo de dato TableSchema
   */
  static mapSqliteTypeToSchemaType(sqliteType) {
    const typeUpper = sqliteType.toUpperCase();
    
    // Mapeo específico para diferenciar tipos numéricos
    if (typeUpper.includes('INTEGER') || typeUpper.includes('INT')) {
      return 'integer';
    }
    if (typeUpper.includes('REAL') || typeUpper.includes('FLOAT') || typeUpper.includes('DOUBLE') || typeUpper.includes('DECIMAL')) {
      return 'float';
    }
    if (typeUpper.includes('BOOLEAN') || typeUpper.includes('BOOL')) {
      return 'boolean';
    }
    if (typeUpper.includes('TEXT') || typeUpper.includes('VARCHAR') || typeUpper.includes('CHAR')) {
      return 'string';
    }
    if (typeUpper.includes('JSON') || typeUpper.includes('OBJECT')) {
      return 'object';
    }
    
    // Por defecto, tratar como string
    return 'string';
  }

  /**
   * Obtener todas las tablas y views de la base de datos
   * @returns {Array} - Lista de nombres de tablas y views
   */
  static async getAllTables() {
    try {
      const sql = "SELECT name, type FROM sqlite_master WHERE type IN ('table', 'view') AND name NOT LIKE 'sqlite_%'";
      const items = await this.all(sql);
      console.log('📊 Tablas y views detectadas:', items.map(i => `${i.name}(${i.type})`).join(', '));
      return items.map(item => item.name);
    } catch (error) {
      console.error('Error obteniendo lista de tablas:', error);
      return [];
    }
  }

  /**
   * Actualizar esquemas de todas las tablas
   * @returns {Object} - Esquemas detectados
   */
  static async updateAllSchemas() {
    console.log('🔄 Actualizando esquemas de todas las tablas...');
    
    const tables = await this.getAllTables();
    const schemas = {};
    
    for (const tableName of tables) {
      const schema = await this.getTableSchema(tableName);
      if (schema) {
        schemas[tableName] = schema;
      }
    }
    
    console.log(`✅ Esquemas actualizados: ${Object.keys(schemas).length} tablas`);
    return schemas;
  }

  /**
   * Limpiar cache de esquemas
   */
  static clearSchemaCache() {
    this.schemaCache.clear();
    console.log('🧹 Cache de esquemas limpiado');
  }

  /**
   * Forzar actualización de esquema de una tabla específica
   * @param {string} tableName - Nombre de la tabla
   * @returns {Object|null} - Esquema actualizado
   */
  static async refreshTableSchema(tableName) {
    // Limpiar cache para esta tabla
    this.schemaCache.delete(tableName);
    
    // Obtener esquema actualizado
    return await this.getTableSchema(tableName);
  }
}

module.exports = DatabaseManager;
