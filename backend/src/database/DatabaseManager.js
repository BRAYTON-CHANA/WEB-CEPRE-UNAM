const { Database } = require('@sqlitecloud/drivers');
const FunctionManager = require('./FunctionManager');

/**
 * DatabaseManager - SQLite Cloud only
 * Conecta a SQLite Cloud y expone helpers run/get/all + introspección.
 * NO crea tablas, views, triggers ni migraciones.
 */
class DatabaseManager {
  static cloudDb = null;
  static schemaCache = new Map();

  /**
   * Conectar (lazy) a SQLite Cloud
   */
  static async connect() {
    if (!this.cloudDb) {
      const url = process.env.SQLITE_CLOUD_URL;
      if (!url) {
        throw new Error('SQLITE_CLOUD_URL env var no configurada');
      }
      try {
        this.cloudDb = new Database(url);
        console.log('✅ Conectado a SQLite Cloud');
        FunctionManager.setDatabaseManager(this);
      } catch (err) {
        console.error('❌ Error conectando a SQLite Cloud:', err.message);
        throw err;
      }
    }
    return this.cloudDb;
  }

  /**
   * Cerrar conexión
   */
  static async close() {
    if (this.cloudDb) {
      try {
        await this.cloudDb.close();
        console.log('✅ Conexión SQLite Cloud cerrada');
      } catch (err) {
        console.error('❌ Error cerrando conexión:', err.message);
      }
      this.cloudDb = null;
    }
  }

  /**
   * Convertir parámetros para SQLite (boolean → 0/1)
   */
  static normalizeParams(params = []) {
    return params.map(p => (typeof p === 'boolean' ? (p ? 1 : 0) : p));
  }

  /**
   * Ejecutar INSERT/UPDATE/DELETE
   * @returns {{ id: number|null, changes: number }}
   */
  static async run(sql, params = []) {
    const db = await this.connect();
    const result = await db.sql(sql, this.normalizeParams(params));
    return {
      id: result?.[0]?.id ?? null,
      changes: result?.[0]?.changes ?? 0,
    };
  }

  /**
   * Obtener un registro
   */
  static async get(sql, params = []) {
    const db = await this.connect();
    const result = await db.sql(sql, this.normalizeParams(params));
    return result?.[0] || null;
  }

  /**
   * Obtener múltiples registros
   */
  static async all(sql, params = []) {
    const db = await this.connect();
    const result = await db.sql(sql, this.normalizeParams(params));
    return result || [];
  }

  // =====================================================
  // INTROSPECCIÓN (NO modifica BD)
  // =====================================================

  /**
   * Obtener todas las tablas y views
   */
  static async getAllTables() {
    try {
      const sql =
        "SELECT name, type FROM sqlite_master WHERE type IN ('table', 'view') AND name NOT LIKE 'sqlite_%'";
      const items = await this.all(sql);
      return items.map(i => i.name);
    } catch (err) {
      console.error('Error obteniendo tablas:', err);
      return [];
    }
  }

  /**
   * Obtener solo las views
   */
  static async getAllViews() {
    try {
      const sql =
        "SELECT name FROM sqlite_master WHERE type = 'view' AND name NOT LIKE 'sqlite_%'";
      const items = await this.all(sql);
      return items.map(i => i.name);
    } catch (err) {
      console.error('Error obteniendo views:', err);
      return [];
    }
  }

  /**
   * Obtener esquema de una tabla via PRAGMA table_info
   */
  static async getTableSchema(tableName) {
    if (this.schemaCache.has(tableName)) {
      return this.schemaCache.get(tableName);
    }
    try {
      const columns = await this.all(`PRAGMA table_info(${tableName})`);
      if (!columns || columns.length === 0) {
        console.warn(`Tabla ${tableName} no encontrada o sin columnas`);
        return null;
      }
      const schema = this.convertPragmaToSchema(columns);
      this.schemaCache.set(tableName, schema);
      return schema;
    } catch (err) {
      console.error(`Error obteniendo esquema de ${tableName}:`, err);
      return null;
    }
  }

  static convertPragmaToSchema(pragmaColumns) {
    const schema = {};
    for (const column of pragmaColumns) {
      const columnType = column.type || '';
      schema[column.name] = {
        type: this.mapSqliteTypeToSchemaType(columnType),
        nullable: column.notnull === 0,
        primary_key: column.pk === 1,
        default_value: column.dflt_value,
        auto_increment:
          column.pk === 1 && /INTEGER|INT/i.test(columnType),
        original_type: columnType,
        cid: column.cid,
        ...(this.getFieldLimits(columnType) || {}),
      };
    }
    return schema;
  }

  static getFieldLimits(fieldType) {
    const t = (fieldType || '').toUpperCase();
    const limits = {};
    if (/TEXT|VARCHAR|CHAR/.test(t)) {
      limits.max_length = 1000;
      limits.description = 'Texto estándar (máximo 1000 caracteres)';
    }
    if (/INTEGER|INT/.test(t)) {
      limits.min = -2147483648;
      limits.max = 2147483647;
      limits.description = 'Entero estándar';
    }
    if (/REAL|FLOAT|DOUBLE/.test(t)) {
      limits.min = -1.7976931348623e308;
      limits.max = 1.7976931348623e308;
      limits.description = 'Número decimal';
    }
    if (/BOOLEAN|BOOL/.test(t)) {
      limits.allowed_values = [0, 1, true, false];
      limits.description = 'Booleano';
    }
    if (/JSON/.test(t)) {
      limits.max_length = 1000000;
      limits.description = 'JSON (~1MB)';
    }
    if (/DATE|DATETIME/.test(t)) {
      limits.description = 'Fecha y hora';
    }
    return Object.keys(limits).length > 0 ? limits : null;
  }

  static mapSqliteTypeToSchemaType(sqliteType) {
    const t = (sqliteType || '').toUpperCase();
    if (/INTEGER|INT/.test(t)) return 'integer';
    if (/REAL|FLOAT|DOUBLE|DECIMAL/.test(t)) return 'float';
    if (/BOOLEAN|BOOL/.test(t)) return 'boolean';
    if (/TEXT|VARCHAR|CHAR/.test(t)) return 'string';
    if (/JSON|OBJECT/.test(t)) return 'object';
    return 'string';
  }

  /**
   * Detectar esquemas de todas las tablas
   */
  static async updateAllSchemas() {
    const tables = await this.getAllTables();
    const schemas = {};
    for (const tableName of tables) {
      const schema = await this.getTableSchema(tableName);
      if (schema) schemas[tableName] = schema;
    }
    return schemas;
  }

  static clearSchemaCache() {
    this.schemaCache.clear();
  }

  static async refreshTableSchema(tableName) {
    this.schemaCache.delete(tableName);
    return await this.getTableSchema(tableName);
  }

  /**
   * Validación básica de tipos
   */
  static validateObject(obj, schema) {
    for (const [key, type] of Object.entries(schema)) {
      if (key === 'id') continue;
      if (obj[key] === undefined) continue;
      const actual = typeof obj[key];
      if (type === 'number' && actual !== 'number') return false;
      if (type === 'string' && actual !== 'string') return false;
      if (type === 'boolean' && actual !== 'boolean') return false;
      if (type === 'object' && actual !== 'object') return false;
    }
    return true;
  }
}

module.exports = DatabaseManager;
module.exports.FunctionManager = FunctionManager;
