// Importar backend como módulo (sin Express)
import { backend as db, executeFunction as execFn } from './backend.js';

/**
 * Ejecutar cualquier función del backend
 */
export async function executeFunction(functionName, params = {}) {
  return await execFn(functionName, params);
}

/**
 * CRUD operations helper
 */
export async function crudOperation(table, operation, data) {
  const operations = {
    select: () => db.select(table, data.filters, data.fields),
    insert: () => db.insert(table, data),
    update: () => db.update(table, data.id, data.data, data.idColumn),
    delete: () => db.delete(table, data.id, data.idColumn),
    getById: () => db.getById(table, data.id, data.idColumn)
  };
  
  if (!operations[operation]) {
    throw new Error(`Operación ${operation} no soportada`);
  }
  
  return await operations[operation]();
}

/**
 * Health check
 */
export async function healthCheck() {
  try {
    await db.connect();
    const result = await db.query('SELECT 1 as status');
    await db.close();
    return { success: true, status: 'ok' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Exportar backend directamente para acceso completo
export { db };
