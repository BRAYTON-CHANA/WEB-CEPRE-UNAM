import { Database } from '@sqlitecloud/drivers';
import 'dotenv/config';
import FunctionManager from './FunctionManager.js';

/**
 * DatabaseManager - SQLite Cloud only
 * Conecta a SQLite Cloud y expone helpers básicos.
 */
class DatabaseManager {
  static cloudDb = null;
  static schemaCache = {};

  /**
   * Conectar a SQLite Cloud
   */
  static async connect() {
    if (!DatabaseManager.cloudDb) {
      const url = process.env.SQLITE_CLOUD_URL;
      if (!url) {
        throw new Error('SQLITE_CLOUD_URL env var no configurada');
      }
      try {
        DatabaseManager.cloudDb = new Database(url);
        console.log('✅ Conectado a SQLite Cloud');
      } catch (err) {
        console.error('❌ Error conectando a SQLite Cloud:', err.message);
        throw err;
      }
    }
    return DatabaseManager.cloudDb;
  }

  /**
   * Iniciar transacción
   */
  static async beginTransaction() {
    await DatabaseManager.query('BEGIN TRANSACTION');
  }

  /**
   * Confirmar transacción
   */
  static async commit() {
    await DatabaseManager.query('COMMIT');
  }

  /**
   * Revertir transacción
   */
  static async rollback() {
    await DatabaseManager.query('ROLLBACK');
  }

  /**
   * Ejecutar operación en transacción
   */
  static async transaction(callback) {
    await DatabaseManager.beginTransaction();
    try {
      const result = await callback();
      await DatabaseManager.commit();
      return result;
    } catch (error) {
      await DatabaseManager.rollback();
      throw error;
    }
  }

  /**
   * Obtener esquema de tabla (con cache)
   */
  static async getTableSchema(table) {
    if (DatabaseManager.schemaCache[table]) {
      return DatabaseManager.schemaCache[table];
    }

    const pragmaResult = await DatabaseManager.query(`PRAGMA table_info(${table})`);
    const schema = {};

    for (const column of pragmaResult) {
      schema[column.name] = {
        type: column.type,
        nullable: column.notnull === 0,
        primaryKey: column.pk > 0
      };
    }

    DatabaseManager.schemaCache[table] = schema;
    return schema;
  }

  /**
   * Validar que los campos existen en la tabla
   */
  static async validateFields(table, data) {
    const schema = await this.getTableSchema(table);
    const invalidFields = [];

    for (const field of Object.keys(data)) {
      if (!schema[field]) {
        invalidFields.push(field);
      }
    }

    if (invalidFields.length > 0) {
      throw new Error(`Campos inválidos para tabla ${table}: ${invalidFields.join(', ')}`);
    }

    return true;
  }

  /**
   * Convertir tipos de datos según esquema
   */
  static async convertTypes(table, data) {
    const schema = await this.getTableSchema(table);
    const converted = {};

    for (const [field, value] of Object.entries(data)) {
      const columnSchema = schema[field];
      if (!columnSchema) continue;

      const columnType = (columnSchema.type || '').toUpperCase();

      // Preservar null
      if (value === null || value === undefined) {
        converted[field] = null;
        continue;
      }

      if (columnType.includes('INTEGER')) {
        converted[field] = parseInt(value) || 0;
      } else if (columnType.includes('REAL') || columnType.includes('FLOAT') || columnType.includes('DOUBLE')) {
        converted[field] = parseFloat(value) || 0.0;
      } else if (columnType.includes('TEXT') || columnType.includes('VARCHAR') || columnType.includes('CHAR')) {
        converted[field] = String(value);
      } else if (columnType.includes('BOOLEAN')) {
        // Convertir boolean a entero (1 para true, 0 para false) para SQLite
        converted[field] = value === true || value === 1 || value === '1' ? 1 : 0;
      } else {
        // Para tipos no reconocidos, convertir boolean a entero si es necesario
        converted[field] = typeof value === 'boolean' ? (value ? 1 : 0) : value;
      }
    }

    return converted;
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
   * Ejecutar query genérico
   * Los parámetros se pasan como argumentos separados (spread operator)
   */
  static async query(sql, ...params) {
    const db = await DatabaseManager.connect();
    const result = await db.sql(sql, ...params);
    return result;
  }

  /**
   * SELECT - Obtener registros de una tabla
   * @param {string} table - Nombre de la tabla
   * @param {Object} filters - Filtros { campo: valor }
   * @param {Array} fields - Campos a seleccionar
   */
  static async select(table, filters = {}, fields = null) {
    let sql = `SELECT ${fields ? fields.join(', ') : '*'} FROM ${table}`;
    const params = [];
    const whereClauses = [];

    for (const [key, value] of Object.entries(filters)) {
      whereClauses.push(`${key} = ?`);
      params.push(value);
    }

    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    return await DatabaseManager.query(sql, ...params);
  }

  /**
   * SELECT por ID
   */
  static async getById(table, id, idColumn = 'id') {
    const result = await DatabaseManager.select(table, { [idColumn]: id });
    return result[0] || null;
  }

  /**
   * INSERT - Insertar registro
   */
  static async insert(table, data) {
    // Validar campos
    await DatabaseManager.validateFields(table, data);
    
    // Convertir tipos
    const convertedData = await DatabaseManager.convertTypes(table, data);
    
    const columns = Object.keys(convertedData);
    const values = Object.values(convertedData);
    const placeholders = values.map(() => '?').join(', ');

    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
    const result = await DatabaseManager.query(sql, ...values);
    return result;
  }

  /**
   * INSERT batch con rollback
   * Inserta múltiples registros, hace rollback si alguno falla
   */
  static async insertBatch(table, dataArray) {
    return await DatabaseManager.transaction(async () => {
      const results = [];
      for (const data of dataArray) {
        const result = await DatabaseManager.insert(table, data);
        results.push(result);
      }
      return results;
    });
  }

  /**
   * UPDATE - Actualizar registro
   */
  static async update(table, id, data, idColumn = 'id') {
    // Validar campos
    await DatabaseManager.validateFields(table, data);
    
    // Convertir tipos
    const convertedData = await DatabaseManager.convertTypes(table, data);
    
    const setClauses = [];
    const params = [];

    for (const [key, value] of Object.entries(convertedData)) {
      setClauses.push(`${key} = ?`);
      params.push(value);
    }

    params.push(id);
    const sql = `UPDATE ${table} SET ${setClauses.join(', ')} WHERE ${idColumn} = ?`;
    const result = await DatabaseManager.query(sql, ...params);
    return result;
  }

  /**
   * UPDATE batch con rollback
   * Actualiza múltiples registros, hace rollback si alguno falla
   */
  static async updateBatch(table, updates, idColumn = 'id') {
    return await DatabaseManager.transaction(async () => {
      const results = [];
      for (const { id, data } of updates) {
        const result = await DatabaseManager.update(table, id, data, idColumn);
        results.push(result);
      }
      return results;
    });
  }

  /**
   * DELETE - Eliminar registro
   */
  static async delete(table, id, idColumn = 'id') {
    const sql = `DELETE FROM ${table} WHERE ${idColumn} = ?`;
    const result = await DatabaseManager.query(sql, id);
    return result;
  }

  /**
   * DELETE batch con rollback
   * Elimina múltiples registros, hace rollback si alguno falla
   */
  static async deleteBatch(table, ids, idColumn = 'id') {
    return await DatabaseManager.transaction(async () => {
      const results = [];
      for (const id of ids) {
        const result = await DatabaseManager.delete(table, id, idColumn);
        results.push(result);
      }
      return results;
    });
  }

  /**
   * UPSERT - Insertar o actualizar si existe
   */
  static async upsert(table, conflictColumns, data, conflictTarget = 'id') {
    await DatabaseManager.validateFields(table, { ...conflictColumns, ...data });
    
    const convertedConflict = await DatabaseManager.convertTypes(table, conflictColumns);
    const convertedData = await DatabaseManager.convertTypes(table, data);
    
    const allData = { ...convertedConflict, ...convertedData };
    const columns = Object.keys(allData);
    const values = Object.values(allData);
    const placeholders = values.map(() => '?').join(', ');
    
    const target = Array.isArray(conflictTarget) ? conflictTarget.join(', ') : conflictTarget;
    const updateSet = Object.keys(convertedData)
      .map(key => `${key} = excluded.${key}`)
      .join(', ');

    const sql = `
      INSERT INTO ${table} (${columns.join(', ')}) 
      VALUES (${placeholders}) 
      ON CONFLICT(${target}) DO UPDATE SET ${updateSet}
    `;
    
    const result = await DatabaseManager.query(sql, ...values);
    return result;
  }

  /**
   * UPSERT batch con rollback
   */
  static async upsertBatch(table, items, conflictTarget = 'id') {
    return await DatabaseManager.transaction(async () => {
      const results = [];
      for (const { conflictColumns, data } of items) {
        const result = await DatabaseManager.upsert(table, conflictColumns, data, conflictTarget);
        results.push(result);
      }
      return results;
    });
  }

  /**
   * Exportar tabla a JSON
   */
  static async exportToJson(table, filters = {}) {
    const data = await DatabaseManager.select(table, filters);
    const schema = await this.getTableSchema(table);
    
    return {
      table,
      schema,
      data,
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Importar datos desde JSON
   */
  static async importFromJson(jsonData, options = {}) {
    const { table, data } = jsonData;
    const { mode = 'insert', conflictTarget = 'id' } = options;
    
    if (!table || !data || !Array.isArray(data)) {
      throw new Error('Formato JSON inválido. Se requiere { table, data: [] }');
    }
    
    if (mode === 'upsert') {
      const results = [];
      for (const item of data) {
        const conflictColumns = {};
        if (typeof conflictTarget === 'string') {
          conflictColumns[conflictTarget] = item[conflictTarget];
        } else if (Array.isArray(conflictTarget)) {
          for (const col of conflictTarget) {
            conflictColumns[col] = item[col];
          }
        }
        
        const dataToUpsert = { ...item };
        delete dataToUpsert[conflictTarget];
        
        const result = await DatabaseManager.upsert(table, conflictColumns, dataToUpsert, conflictTarget);
        results.push(result);
      }
      return results;
    } else {
      return await DaDabaaeManagerbaseManager.insertBatch(table, data);
    }
  }

  /**
   * SELECT con LIMIT y OFFSET
   */
  static async selectWithLimit(table, limit, offset = 0, filters = {}, fields = null) {
    let sql = `SELECT ${fields ? fields.join(', ') : '*'} FROM ${table}`;
    const params = [];
    const whereClauses = [];

    for (const [key, value] of Object.entries(filters)) {
      whereClauses.push(`${key} = ?`);
      params.push(value);
    }

    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    sql += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    return await DatabaseManager.query(sql, ...params);
  }

  /**
   * SELECT con ORDER BY
   */
  static async selectWithOrderBy(table, orderBy, order = 'ASC', filters = {}, fields = null) {
    let sql = `SELECT ${fields ? fields.join(', ') : '*'} FROM ${table}`;
    const params = [];
    const whereClauses = [];

    for (const [key, value] of Object.entries(filters)) {
      whereClauses.push(`${key} = ?`);
      params.push(value);
    }

    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    sql += ` ORDER BY ${orderBy} ${order}`;

    return await DatabaseManager.query(sql, ...params);
  }

  /**
   * SELECT con GROUP BY y HAVING
   */
  static async selectWithGroupBy(table, groupBy, having = null, filters = {}, fields = null) {
    let sql = `SELECT ${fields ? fields.join(', ') : '*'} FROM ${table}`;
    const params = [];
    const whereClauses = [];

    for (const [key, value] of Object.entries(filters)) {
      whereClauses.push(`${key} = ?`);
      params.push(value);
    }

    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    sql += ` GROUP BY ${groupBy}`;

    if (having) {
      sql += ` HAVING ${having}`;
    }

    return await DatabaseManager.query(sql, ...params);
  }

  /**
   * SELECT con JOINs
   * @param {string} table - Tabla principal
   * @param {Array} joins - Array de joins: [{ table, on, type: 'INNER' }]
   */
  static async selectWithJoin(table, joins, filters = {}, fields = null) {
    let sql = `SELECT ${fields ? fields.join(', ') : '*'} FROM ${table}`;
    const params = [];

    for (const join of joins) {
      const joinType = join.type || 'INNER';
      sql += ` ${joinType} JOIN ${join.table} ON ${join.on}`;
    }

    const whereClauses = [];
    for (const [key, value] of Object.entries(filters)) {
      whereClauses.push(`${key} = ?`);
      params.push(value);
    }

    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    return await DatabaseManager.query(sql, ...params);
  }

  /**
   * COUNT con filtros opcionales
   */
  static async count(table, filters = {}) {
    let sql = `SELECT COUNT(*) as total FROM ${table}`;
    const params = [];
    const whereClauses = [];

    for (const [key, value] of Object.entries(filters)) {
      whereClauses.push(`${key} = ?`);
      params.push(value);
    }

    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    const result = await DatabaseManager.query(sql, ...params);
    return result[0]?.total || 0;
  }

  /**
   * Funciones de agregación (SUM, AVG, MIN, MAX)
   */
  static async aggregate(table, aggregate, column, filters = {}, groupBy = null) {
    const validAggregates = ['SUM', 'AVG', 'MIN', 'MAX', 'COUNT'];
    const agg = aggregate.toUpperCase();

    if (!validAggregates.includes(agg)) {
      throw new Error(`Aggregate function '${aggregate}' not supported. Use: ${validAggregates.join(', ')}`);
    }

    let sql = `SELECT ${agg}(${column}) as result FROM ${table}`;
    const params = [];
    const whereClauses = [];

    for (const [key, value] of Object.entries(filters)) {
      whereClauses.push(`${key} = ?`);
      params.push(value);
    }

    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    if (groupBy) {
      sql += ` GROUP BY ${groupBy}`;
      const result = await DatabaseManager.query(sql, ...params);
      return result;
    }

    const result = await DatabaseManager.query(sql, ...params);
    return result[0]?.result || 0;
  }

  /**
   * SELECT paginado
   */
  static async selectPaginated(table, page = 1, pageSize = 10, filters = {}, fields = null) {
    const offset = (page - 1) * pageSize;
    return await DaDabaaeManagerbaseManager.selectWithLimit(table, pageSize, offset, filters, fields);
  }

  /**
   * SELECT SQL personalizado
   */
  static async rawSelect(sql, ...params) {
    return await DatabaseManager.query(sql, ...params);
  }

  /**
   * Ejecutar función SQL desde archivo functions/
   */
  static async executeFunction(filename, params = {}) {
    return await FunctionManager.execute(filename, params, DatabaseManager.query.bind(this));
  }

  /**
   * Ejecutar función SQL y retornar primer resultado
   */
  static async executeFunctionOne(filename, params = {}) {
    return await FunctionManager.executeOne(filename, params, DatabaseManager.query.bind(this));
  }

  /**
   * Listar funciones SQL disponibles
   */
  static async listFunctions() {
    return await FunctionManager.listFunctions();
  }

  /**
   * Obtener información de función SQL
   */
  static async getFunctionInfo(filename) {
    return await FunctionManager.getFunctionInfo(filename);
  }
}

export default DatabaseManager;
