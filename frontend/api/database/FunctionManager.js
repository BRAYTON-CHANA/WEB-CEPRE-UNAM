/**
 * FunctionManager - Lightweight RPC caller for Supabase stored procedures
 *
 * All SQL functions now live as PostgreSQL stored procedures in Supabase.
 * This module only maps JS parameter objects to supabase.rpc() calls.
 */
class FunctionManager {
  /**
   * Ejecutar una función PostgreSQL via supabase.rpc()
   * @param {string} filename - Nombre de la función en Supabase
   * @param {Object} params - Objeto con parámetros { nombre_param: valor }
   * @param {Object} supabase - Cliente Supabase instanciado
   * @returns {Array} - Array de resultados
   */
  static async execute(filename, params = {}, supabase) {
    if (!supabase) {
      throw new Error('[FunctionManager] Se requiere instancia de supabase');
    }
    if (!supabase.rpc) {
      throw new Error('[FunctionManager] El objeto proporcionado no tiene método rpc()');
    }

    // Mapear parámetros a formato p_snake_case para PostgreSQL
    const rpcParams = {};
    for (const [key, value] of Object.entries(params)) {
      let snakeKey;
      if (key.includes('_')) {
        // Ya es snake_case (ej: ID_AREA, ID_CURSO_ACTUAL)
        snakeKey = key.toLowerCase();
      } else {
        // Es camelCase (ej: idArea)
        snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
      }
      // Agregar prefijo p_ si no lo tiene (convenión de funciones PostgreSQL)
      if (!snakeKey.startsWith('p_')) {
        snakeKey = 'p_' + snakeKey;
      }
      rpcParams[snakeKey] = value;
    }
    console.log('[FunctionManager] Mapped params:', { original: params, rpcParams });

    const { data, error } = await supabase.rpc(filename, rpcParams);
    if (error) throw new Error(`[FunctionManager] RPC ${filename}: ${error.message}`);

    // Las funciones PostgreSQL retornan JSONB array; parse si es string
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch {
        return data;
      }
    }
    return data || [];
  }

  /**
   * Ejecutar una función y devolver solo el primer resultado
   */
  static async executeOne(filename, params = {}, supabase) {
    const results = await this.execute(filename, params, supabase);
    return Array.isArray(results) && results.length > 0 ? results[0] : null;
  }

  /**
   * Obtener lista de funciones disponibles (ya no depende de archivos locales)
   */
  static async listFunctions() {
    return [];
  }

  /**
   * Obtener información de una función (ya no lee archivos locales)
   */
  static async getFunctionInfo(filename) {
    return { paramNames: [], sql: null };
  }
}

export default FunctionManager;
