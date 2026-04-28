const initSqlJs = require('sql.js'); // LOCAL - sql.js portable
const { Database } = require('@sqlitecloud/drivers'); // SQLite Cloud SDK
const path = require('path');
const fs = require('fs');
const MigrationManager = require('./MigrationManager');
const ViewManager = require('./ViewManager');
const FunctionManager = require('./FunctionManager');
const TriggerManager = require('./TriggerManager');

class DatabaseManager {
  // === CONFIGURACIÓN ===
  static DB_MODE = 'local'; // 'local' o 'online'
  
  // === LOCAL SQLITE (sql.js) ===
  static dbPath = (() => {
    const path = require('path');
    if (process.env.NL_PORT || process.platform === 'neutralino') {
      return path.join(process.resourcesPath || '.', 'datos', 'database.sqlite');
    }
    return path.join(__dirname, '../../data', 'database.sqlite');
  })();
  static db = null;
  static SQL = null; // Instancia de sql.js
  
  // === SQLITE CLOUD ===
  static connectionString = ''; // llenar
  static cloudDb = null;
  static schemaCache = new Map();

  /**
   * Conectar a BD (local o cloud según DB_MODE)
   */
  static async connect() {
    if (this.DB_MODE === 'online') {
      return await this.connectCloud();
    } else {
      return this.connectLocal();
    }
  }
  
  /**
   * Conectar a SQLite Cloud
   */
  static async connectCloud() {
    if (!this.cloudDb) {
      try {
        this.cloudDb = new Database(this.connectionString);
        console.log('✅ Conectado a SQLite Cloud exitosamente');
        console.log('📍 Connection:', this.connectionString);
        MigrationManager.setDatabaseManager(this);
        ViewManager.setDatabaseManager(this);
        FunctionManager.setDatabaseManager(this);
        TriggerManager.setDatabaseManager(this);
      } catch (err) {
        console.error('❌ Error conectando a SQLite Cloud:', err.message);
        throw err;
      }
    }
    return this.cloudDb;
  }
  
  /**
   * Conectar a SQLite local (sql.js)
   */
  static async connectLocal() {
    if (!this.db) {
      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
        console.log(`📁 Directorio creado: ${dbDir}`);
      }
      try {
        // Inicializar sql.js
        if (!this.SQL) {
          this.SQL = await initSqlJs();
        }
        
        // Cargar BD si existe, crear nueva si no
        if (fs.existsSync(this.dbPath)) {
          const fileBuffer = fs.readFileSync(this.dbPath);
          this.db = new this.SQL.Database(fileBuffer);
          console.log('✅ BD local cargada desde archivo');
        } else {
          this.db = new this.SQL.Database();
          console.log('✅ Nueva BD local creada');
        }
        
        console.log('📍 Base de datos en:', this.dbPath);
        
        // Habilitar foreign keys
        this.db.run('PRAGMA foreign_keys = ON');
        
        MigrationManager.setDatabaseManager(this);
        ViewManager.setDatabaseManager(this);
        FunctionManager.setDatabaseManager(this);
        TriggerManager.setDatabaseManager(this);
      } catch (err) {
        console.error('❌ Error conectando a SQLite local:', err.message);
        console.error('❌ Ruta de la base de datos:', this.dbPath);
        throw err;
      }
    }
    return this.db;
  }

  /**
   * Cerrar conexión
   */
  static async close() {
    if (this.DB_MODE === 'online') {
      if (this.cloudDb) {
        try {
          await this.cloudDb.close();
          console.log('✅ Conexión SQLite Cloud cerrada');
        } catch (err) {
          console.error('❌ Error cerrando conexión:', err.message);
        }
        this.cloudDb = null;
      }
    } else {
      if (this.db) {
        try {
          await this.saveDatabase();
          this.db.close();
          console.log('✅ Conexión SQLite local cerrada');
        } catch (err) {
          console.error('❌ Error cerrando conexión:', err.message);
        }
        this.db = null;
      }
    }
  }
  
  /**
   * Guardar BD local a archivo
   */
  static async saveDatabase() {
    if (this.db && this.DB_MODE === 'local') {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(this.dbPath, buffer);
    }
  }

  /**
   * Ejecutar INSERT/UPDATE/DELETE
   */
  static async run(sql, params = []) {
    if (this.DB_MODE === 'online') {
      try {
        const db = await this.connect();
        const convertedParams = params.map(param => {
          if (typeof param === 'boolean') return param ? 1 : 0;
          return param;
        });
        const result = await db.sql(sql, convertedParams);
        return { id: result[0]?.id || null, changes: result[0]?.changes || 0 };
      } catch (err) { throw err; }
    } else {
      try {
        const db = await this.connectLocal();
        const convertedParams = params.map(param => {
          if (typeof param === 'boolean') return param ? 1 : 0;
          return param;
        });
        db.run(sql, convertedParams);
        const changes = db.getRowsModified();
        // Obtener lastInsertRowid solo para INSERTs
        let lastId = null;
        if (/^\s*INSERT/i.test(sql)) {
          const idStmt = db.prepare('SELECT last_insert_rowid() AS id');
          if (idStmt.step()) {
            lastId = idStmt.getAsObject().id;
          }
          idStmt.free();
        }
        await this.saveDatabase();
        return { id: lastId, changes };
      } catch (err) { throw err; }
    }
  }

  /**
   * Obtener un registro
   */
  static async get(sql, params = []) {
    if (this.DB_MODE === 'online') {
      try {
        const db = await this.connect();
        const result = await db.sql(sql, params);
        return result[0] || null;
      } catch (err) { throw err; }
    } else {
      try {
        const db = await this.connectLocal();
        const convertedParams = params.map(param => {
          if (typeof param === 'boolean') return param ? 1 : 0;
          return param;
        });
        const stmt = db.prepare(sql);
        stmt.bind(convertedParams);
        if (stmt.step()) {
          const result = stmt.getAsObject();
          stmt.free();
          return result;
        }
        stmt.free();
        return null;
      } catch (err) { throw err; }
    }
  }

  /**
   * Obtener múltiples registros
   */
  static async all(sql, params = []) {
    if (this.DB_MODE === 'online') {
      try {
        const db = await this.connect();
        return await db.sql(sql, params);
      } catch (err) { throw err; }
    } else {
      try {
        const db = await this.connectLocal();
        const convertedParams = params.map(param => {
          if (typeof param === 'boolean') return param ? 1 : 0;
          return param;
        });
        const stmt = db.prepare(sql);
        stmt.bind(convertedParams);
        const results = [];
        while (stmt.step()) {
          results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
      } catch (err) { throw err; }
    }
  }

  /**
   * Inicializar base de datos
   */
  static async init() {
    try {
      console.log('🔄 Inicializando base de datos...');
      
      await this.connect();
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Solo ejecutar migrations en modo local
      if (this.DB_MODE === 'local') {
        await MigrationManager.runMigrations();
        await ViewManager.runViews();
        await TriggerManager.runTriggers();
      } else {
        console.log('🌐 Modo online: omitiendo migraciones (BD ya configurada)');
      }
      
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
    
    try {
      await this.saveDatabase();
      fs.copyFileSync(this.dbPath, backupPath);
      console.log(`✅ Backup creado en: ${backupPath}`);
      return backupPath;
    } catch (err) {
      throw err;
    }
  }

  /**
   * Obtener estado de las migraciones
   */
  static async getMigrationStatus() {
    return await MigrationManager.getStatus();
  }

  /**
   * Ejecutar todos los triggers
   */
  static async runTriggers() {
    return await TriggerManager.runTriggers();
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
      
      // console.log(`🔍 Esquema detectado para ${tableName}:`, Object.keys(schema));
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
    
    // console.log(`🔍 Schema completo para tabla:`, schema);
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
      // console.log('📊 Tablas y views detectadas:', items.map(i => `${i.name}(${i.type})`).join(', '));
      return items.map(item => item.name);
    } catch (error) {
      console.error('Error obteniendo lista de tablas:', error);
      return [];
    }
  }

  /**
   * Obtener solo las views de la base de datos
   * @returns {Array} - Lista de nombres de views
   */
  static async getAllViews() {
    try {
      const sql = "SELECT name FROM sqlite_master WHERE type = 'view' AND name NOT LIKE 'sqlite_%'";
      const items = await this.all(sql);
      return items.map(item => item.name);
    } catch (error) {
      console.error('Error obteniendo lista de views:', error);
      return [];
    }
  }

  /**
   * Actualizar esquemas de todas las tablas
   * @returns {Object} - Esquemas detectados
   */
  static async updateAllSchemas() {
    // console.log('🔄 Actualizando esquemas de todas las tablas...');
    
    const tables = await this.getAllTables();
    const schemas = {};
    
    for (const tableName of tables) {
      const schema = await this.getTableSchema(tableName);
      if (schema) {
        schemas[tableName] = schema;
      }
    }
    
    // console.log(`✅ Esquemas actualizados: ${Object.keys(schemas).length} tablas`);
    return schemas;
  }

  /**
   * Limpiar cache de esquemas
   */
  static clearSchemaCache() {
    this.schemaCache.clear();
    // console.log('🧹 Cache de esquemas limpiado');
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

// Exportar DatabaseManager y FunctionManager para uso en otros módulos
module.exports = DatabaseManager;
module.exports.FunctionManager = FunctionManager;
