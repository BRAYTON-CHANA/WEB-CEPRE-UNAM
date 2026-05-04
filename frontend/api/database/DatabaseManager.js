import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import FunctionManager from './FunctionManager.js';

/**
 * DatabaseManager - Supabase Client
 * Usa Supabase REST API para CRUD y RPC para SQL crudo.
 *
 * REQUISITO: Crear en Supabase la funcion PostgreSQL execute_sql(sql_query TEXT)
 *   CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT)
 *   RETURNS JSONB AS $$
 *   DECLARE result JSONB;
 *   BEGIN
 *     EXECUTE format('SELECT jsonb_agg(row_to_json(t)) FROM (%s) t', sql_query)
 *     INTO result;
 *     RETURN COALESCE(result, '[]'::JSONB);
 *   END;
 *   $$ LANGUAGE plpgsql SECURITY DEFINER;
 */
class DatabaseManager {
  static supabase = null;
  static schemaCache = {};

  /**
   * Conectar a Supabase (singleton)
   */
  static async connect() {
    if (!DatabaseManager.supabase) {
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

      if (!url || !key) {
        throw new Error('SUPABASE_URL y SUPABASE_ANON_KEY/SUPABASE_SERVICE_ROLE_KEY deben estar configurados');
      }

      DatabaseManager.supabase = createClient(url, key);
    }
    return DatabaseManager.supabase;
  }

  /**
   * Ejecutar query genérico con SQL crudo
   * Interpola parametros ? de forma segura antes de enviar a execute_sql RPC
   */
  static async query(sql, ...params) {
    const supabase = await DatabaseManager.connect();

    const safeParams = params.map(p => {
      if (p === null || p === undefined) return 'NULL';
      if (typeof p === 'number') return String(p);
      if (typeof p === 'boolean') return p ? 'TRUE' : 'FALSE';
      return `'${String(p).replace(/'/g, "''")}'`;
    });

    let finalSql = sql;
    for (const param of safeParams) {
      finalSql = finalSql.replace('?', param);
    }

    const { data, error } = await supabase.rpc('execute_sql', { sql_query: finalSql });
    if (error) throw new Error(`[execute_sql] ${error.message}`);
    return data || [];
  }

  /**
   * Obtener esquema de tabla (con cache) - PostgreSQL information_schema
   */
  static async getTableSchema(table) {
    if (DatabaseManager.schemaCache[table]) {
      return DatabaseManager.schemaCache[table];
    }

    const sql = `
      SELECT
        c.column_name AS name,
        c.data_type AS type,
        CASE WHEN c.is_nullable = 'NO' THEN 1 ELSE 0 END AS notnull,
        c.column_default AS dflt_value,
        CASE WHEN tc.constraint_type = 'PRIMARY KEY' THEN 1 ELSE 0 END AS pk
      FROM information_schema.columns c
      LEFT JOIN information_schema.key_column_usage kcu
        ON c.table_name = kcu.table_name
        AND c.column_name = kcu.column_name
        AND c.table_schema = kcu.table_schema
      LEFT JOIN information_schema.table_constraints tc
        ON kcu.constraint_name = tc.constraint_name
        AND kcu.table_schema = tc.table_schema
        AND tc.constraint_type = 'PRIMARY KEY'
      WHERE c.table_name = ?
        AND c.table_schema = 'public'
      ORDER BY c.ordinal_position
    `;

    const result = await DatabaseManager.query(sql, table);
    const schema = {};

    for (const column of result) {
      schema[column.name] = {
        type: column.type,
        nullable: column.notnull === 0,
        primaryKey: column.pk > 0,
        dfltValue: column.dflt_value
      };
    }

    DatabaseManager.schemaCache[table] = schema;
    return schema;
  }

  /**
   * SELECT - Obtener registros de una tabla
   */
  static async select(table, filters = {}, fields = null) {
    const supabase = await DatabaseManager.connect();
    const selectFields = Array.isArray(fields) ? fields.join(',') : (fields || '*');
    let query = supabase.from(table).select(selectFields);
    console.log(`[DatabaseManager] SELECT from ${table}, fields=${selectFields}, filters=${JSON.stringify(filters)}`);

    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value);
    }

    const { data, error } = await query;
    if (error) {
      console.error(`[DatabaseManager] SELECT error on ${table}:`, error);
      throw error;
    }
    console.log(`[DatabaseManager] SELECT result on ${table}: ${(data || []).length} rows`);
    return data || [];
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
    const supabase = await DatabaseManager.connect();
    const { data: result, error } = await supabase.from(table).insert(data).select();
    if (error) throw error;
    return result;
  }

  /**
   * INSERT batch
   */
  static async insertBatch(table, dataArray) {
    const supabase = await DatabaseManager.connect();
    const { data: result, error } = await supabase.from(table).insert(dataArray).select();
    if (error) throw error;
    return result;
  }

  /**
   * UPDATE - Actualizar registro
   */
  static async update(table, id, data, idColumn = 'id') {
    const supabase = await DatabaseManager.connect();
    const { data: result, error } = await supabase.from(table).update(data).eq(idColumn, id).select();
    if (error) throw error;
    return result;
  }

  /**
   * UPDATE batch
   */
  static async updateBatch(table, updates, idColumn = 'id') {
    const results = [];
    for (const { id, data } of updates) {
      const result = await DatabaseManager.update(table, id, data, idColumn);
      results.push(result);
    }
    return results;
  }

  /**
   * DELETE - Eliminar registro
   */
  static async delete(table, id, idColumn = 'id') {
    const supabase = await DatabaseManager.connect();
    const { error } = await supabase.from(table).delete().eq(idColumn, id);
    if (error) throw error;
    return { deleted: true };
  }

  /**
   * DELETE batch
   */
  static async deleteBatch(table, ids, idColumn = 'id') {
    const results = [];
    for (const id of ids) {
      const result = await DatabaseManager.delete(table, id, idColumn);
      results.push(result);
    }
    return results;
  }

  /**
   * UPSERT - Insertar o actualizar si existe
   */
  static async upsert(table, conflictColumns, data, conflictTarget = 'id') {
    const supabase = await DatabaseManager.connect();
    const allData = { ...conflictColumns, ...data };
    const { data: result, error } = await supabase
      .from(table)
      .upsert(allData, { onConflict: Array.isArray(conflictTarget) ? conflictTarget.join(',') : conflictTarget })
      .select();
    if (error) throw error;
    return result;
  }

  /**
   * UPSERT batch
   */
  static async upsertBatch(table, items, conflictTarget = 'id') {
    const results = [];
    for (const { conflictColumns, data } of items) {
      const result = await DatabaseManager.upsert(table, conflictColumns, data, conflictTarget);
      results.push(result);
    }
    return results;
  }

  /**
   * Exportar tabla a JSON
   */
  static async exportToJson(table, filters = {}) {
    const data = await DatabaseManager.select(table, filters);
    return { table, data, exportedAt: new Date().toISOString() };
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
      return await DatabaseManager.insertBatch(table, data);
    }
  }

  /**
   * SELECT con LIMIT y OFFSET
   */
  static async selectWithLimit(table, limit, offset = 0, filters = {}, fields = null) {
    const supabase = await DatabaseManager.connect();
    let query = supabase.from(table).select(fields || '*');

    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value);
    }

    const { data, error } = await query.range(offset, offset + limit - 1);
    if (error) throw error;
    return data || [];
  }

  /**
   * SELECT con ORDER BY
   */
  static async selectWithOrderBy(table, orderBy, order = 'ASC', filters = {}, fields = null) {
    const supabase = await DatabaseManager.connect();
    let query = supabase.from(table).select(fields || '*');

    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value);
    }

    query = query.order(orderBy, { ascending: order.toUpperCase() === 'ASC' });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
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
    const supabase = await DatabaseManager.connect();
    let query = supabase.from(table).select('*', { count: 'exact', head: true });

    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value);
    }

    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
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
    }

    const result = await DatabaseManager.query(sql, ...params);
    if (groupBy) return result;
    return result[0]?.result || 0;
  }

  /**
   * SELECT paginado
   */
  static async selectPaginated(table, page = 1, pageSize = 10, filters = {}, fields = null) {
    const offset = (page - 1) * pageSize;
    return await DatabaseManager.selectWithLimit(table, pageSize, offset, filters, fields);
  }

  /**
   * SELECT SQL personalizado
   */
  static async rawSelect(sql, ...params) {
    return await DatabaseManager.query(sql, ...params);
  }

  /**
   * Ejecutar función PostgreSQL via RPC (stored procedure en Supabase)
   */
  static async executeFunction(filename, params = {}) {
    const supabase = await DatabaseManager.connect();
    return await FunctionManager.execute(filename, params, supabase);
  }

  /**
   * Ejecutar función PostgreSQL y retornar primer resultado
   */
  static async executeFunctionOne(filename, params = {}) {
    const supabase = await DatabaseManager.connect();
    return await FunctionManager.executeOne(filename, params, supabase);
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
