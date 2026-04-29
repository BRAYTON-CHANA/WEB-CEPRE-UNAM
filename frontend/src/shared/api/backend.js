// API URL para Vercel Serverless Functions
const API_BASE_URL = '/api';

/**
 * Ejecutar cualquier función del backend via HTTP
 */
export async function executeFunction(functionName, params = {}) {
  const response = await fetch(`${API_BASE_URL}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ functionName, params })
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message);
  }
  return result.data;
}

/**
 * CRUD operations helper
 */
export const backend = {
  select: (table, filters, fields) => executeFunction('select', { table, filters, fields }),
  insert: (table, data) => executeFunction('insert', { table, data }),
  update: (table, id, data, idColumn) => executeFunction('update', { table, id, data, idColumn }),
  delete: (table, id, idColumn) => executeFunction('delete', { table, id, idColumn }),
  getById: (table, id, idColumn) => executeFunction('getById', { table, id, idColumn }),
  
  // Batch
  insertBatch: (table, dataArray) => executeFunction('insertBatch', { table, dataArray }),
  updateBatch: (table, updates, idColumn) => executeFunction('updateBatch', { table, updates, idColumn }),
  deleteBatch: (table, ids, idColumn) => executeFunction('deleteBatch', { table, ids, idColumn }),
  
  // Upsert
  upsert: (table, conflictColumns, data, conflictTarget) => executeFunction('upsert', { table, conflictColumns, data, conflictTarget }),
  upsertBatch: (table, items, conflictTarget) => executeFunction('upsertBatch', { table, items, conflictTarget }),
  
  // Advanced SELECT
  selectWithLimit: (table, limit, offset, filters, fields) => executeFunction('selectWithLimit', { table, limit, offset, filters, fields }),
  selectWithOrderBy: (table, orderBy, order, filters, fields) => executeFunction('selectWithOrderBy', { table, orderBy, order, filters, fields }),
  selectWithGroupBy: (table, groupBy, having, filters, fields) => executeFunction('selectWithGroupBy', { table, groupBy, having, filters, fields }),
  selectWithJoin: (table, joins, filters, fields) => executeFunction('selectWithJoin', { table, joins, filters, fields }),
  selectPaginated: (table, page, pageSize, filters, fields) => executeFunction('selectPaginated', { table, page, pageSize, filters, fields }),
  rawSelect: (sql, ...params) => executeFunction('rawSelect', { sql, params }),
  
  // Aggregations
  count: (table, filters) => executeFunction('count', { table, filters }),
  aggregate: (table, aggregate, column, filters, groupBy) => executeFunction('aggregate', { table, aggregate, column, filters, groupBy }),
  
  // Import/Export
  exportToJson: (table, filters) => executeFunction('exportToJson', { table, filters }),
  importFromJson: (jsonData, options) => executeFunction('importFromJson', { jsonData, options }),
  
  // Query genérico
  query: (sql, ...params) => executeFunction('query', { sql, params }),
  
  // Functions SQL
  executeFunction: async (filename, params) => {
    const response = await fetch(`${API_BASE_URL}/functions/${filename}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ params })
    });
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message);
    }
    return result.data;
  },
  executeFunctionOne: async (filename, params) => {
    const data = await backend.executeFunction(filename, params);
    return data[0] || null;
  },
  listFunctions: async () => {
    // Para listar funciones, necesitamos crear otro endpoint
    // Por ahora retornamos array vacío
    return [];
  },
  getFunctionInfo: async (filename) => {
    const response = await fetch(`${API_BASE_URL}/functions/${filename}?info=true`);
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message);
    }
    return result.data;
  },
  
  // Schema
  getTableSchema: (table) => executeFunction('getTableSchema', { table }),
  
  // Connection
  connect: () => executeFunction('connect', {}),
  close: () => executeFunction('close', {})
};

export default backend;
