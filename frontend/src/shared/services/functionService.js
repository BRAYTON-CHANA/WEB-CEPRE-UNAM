import { API_BASE_URL } from '../config/api';

/**
 * Servicio para ejecutar funciones SQL del backend
 * Se conecta al endpoint /api/functions
 */
class FunctionService {
  /**
   * Ejecutar una función SQL con parámetros
   * @param {string} functionName - Nombre del archivo sin .sql
   * @param {Object} params - Parámetros { ID_DOCENTE: 5, ID_CURSO_ACTUAL: 3 }
   * @returns {Array} - Array de resultados
   */
  async execute(functionName, params = {}) {
    const url = `${API_BASE_URL}/functions/${functionName}`;

    console.log(`[functionService] Executing function:`, functionName);
    console.log(`[functionService] Params being sent:`, params);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ params })
      });

      console.log(`[functionService] Response status:`, response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[functionService] HTTP Error ${response.status}:`, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log(`[functionService] Response data:`, result);

      if (!result.success) {
        console.error('[functionService] API Error:', result.message);
        throw new Error(result.message || 'Error en la respuesta de la API');
      }

      console.log(`[functionService] Returning data:`, result.data);
      return result.data;
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
      const response = await fetch(`${API_BASE_URL}/functions`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
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
      const response = await fetch(`${API_BASE_URL}/functions/${functionName}/info`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error(`[functionService] Error obteniendo info de ${functionName}:`, error);
      throw error;
    }
  }
}

export default new FunctionService();
