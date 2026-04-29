import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * FunctionManager - Gestor para ejecutar SQL parametrizado desde archivos
 * Lee archivos .sql de la carpeta functions/ y ejecuta con parámetros
 */
class FunctionManager {
  static functionsPath = path.join(__dirname, 'functions');

  /**
   * Obtener lista de archivos de funciones disponibles
   */
  static async listFunctions() {
    try {
      const files = await fs.readdir(this.functionsPath);
      return files
        .filter(file => file.endsWith('.sql'))
        .map(file => path.basename(file, '.sql'))
        .sort();
    } catch (error) {
      console.log('📁 No se encontró directorio de functions o está vacío');
      return [];
    }
  }

  /**
   * Extraer nombres de parámetros del SQL (formato :NOMBRE_PARAMETRO)
   */
  static extractParams(sql, uniqueOnly = true) {
    const sqlWithoutComments = sql.replace(/--.*$/gm, '');
    const paramRegex = /:([A-Za-z_][A-Za-z0-9_]*)/g;
    const params = [];
    const seen = new Set();
    let match;

    while ((match = paramRegex.exec(sqlWithoutComments)) !== null) {
      const paramName = match[1];
      if (uniqueOnly) {
        if (!seen.has(paramName)) {
          seen.add(paramName);
          params.push(paramName);
        }
      } else {
        params.push(paramName);
      }
    }

    return params;
  }

  /**
   * Ejecutar una función SQL con parámetros nombrados
   * @param {string} filename - Nombre del archivo (sin .sql)
   * @param {Object} params - Objeto con parámetros { NOMBRE_PARAM: valor }
   * @param {Function} dbQuery - Función de query del DatabaseManager
   * @returns {Array} - Array de resultados
   */
  static async execute(filename, params = {}, dbQuery) {
    try {
      const filePath = path.join(this.functionsPath, `${filename}.sql`);
      const sql = await fs.readFile(filePath, 'utf8');

      // Extraer TODAS las ocurrencias de parámetros del SQL
      const allParamOccurrences = this.extractParams(sql, false);

      // Construir array de parámetros en el orden de aparición
      const paramArray = allParamOccurrences.map(name => {
        const value = params[name];
        if (value === undefined) {
          console.warn(`⚠️ Parámetro '${name}' no proporcionado, usando NULL`);
          return null;
        }
        return value;
      });

      // Reemplazar placeholders nombrados por ? para SQLite
      const sqlPositional = sql.replace(/:[A-Za-z_][A-Za-z0-9_]*/g, '?');

      console.log(`📋 [FunctionManager] Ejecutando: ${filename}`);
      console.log(`📋 [FunctionManager] Params: ${JSON.stringify(paramArray)}`);

      // Ejecutar la query
      const results = await dbQuery(sqlPositional, ...paramArray);

      return results;
    } catch (error) {
      console.error(`❌ Error ejecutando función ${filename}:`, error.message);
      throw error;
    }
  }

  /**
   * Ejecutar una función SQL y devolver solo el primer resultado
   */
  static async executeOne(filename, params = {}, dbQuery) {
    const results = await this.execute(filename, params, dbQuery);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Obtener el SQL de una función sin ejecutar
   */
  static async getSql(filename) {
    try {
      const filePath = path.join(this.functionsPath, `${filename}.sql`);
      return await fs.readFile(filePath, 'utf8');
    } catch (error) {
      console.error(`❌ Error leyendo función ${filename}:`, error.message);
      throw error;
    }
  }

  /**
   * Obtener información de los parámetros de una función
   */
  static async getFunctionInfo(filename) {
    const sql = await this.getSql(filename);
    const paramNames = this.extractParams(sql);
    return { paramNames, sql };
  }
}

export default FunctionManager;
