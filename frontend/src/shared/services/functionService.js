import { db } from '../api';

/**
 * Servicio para ejecutar funciones SQL del backend
 * Usa el nuevo API (módulo directo) en lugar de HTTP
 */
class FunctionService {
  /**
   * Ejecutar una función SQL con parámetros
   * @param {string} functionName - Nombre del archivo sin .sql
   * @param {Object} params - Parámetros { ID_DOCENTE: 5, ID_CURSO_ACTUAL: 3 }
   * @returns {Array} - Array de resultados
   */
  async execute(functionName, params = {}) {
    console.log(`[functionService] Executing function:`, functionName);
    console.log(`[functionService] Params being sent:`, params);

    try {
      const result = await db.executeFunction(functionName, params);
      console.log(`[functionService] Returning data:`, result);
      return result;
    } catch (error) {
      console.error('[functionService] Error:', error.message);
      throw error;
    }
  }

  /**
   * Listar funciones SQL disponibles
   * @returns {string[]} - Array de nombres de funciones
   */
  async listFunctions() {
    try {
      return await db.listFunctions();
    } catch (error) {
      console.error('[functionService] Error listando funciones:', error);
      throw error;
    }
  }

  /**
   * Obtener información de una función (parámetros y SQL)
   * @param {string} functionName - Nombre de la función
   * @returns {Object} - { paramNames, sql }
   */
  async getFunctionInfo(functionName) {
    try {
      return await db.getFunctionInfo(functionName);
    } catch (error) {
      console.error(`[functionService] Error obteniendo info de ${functionName}:`, error);
      throw error;
    }
  }
}

export default new FunctionService();
