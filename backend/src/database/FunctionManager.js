const fs = require('fs').promises;
const path = require('path');

/**
 * FunctionManager - Gestor genérico para ejecutar SQL parametrizado
 * Similar a ViewManager pero para queries con parámetros dinámicos
 */
class FunctionManager {
  static functionsPath = path.join(__dirname, 'functions');
  static dbManager = null;

  /**
   * Establecer la referencia al DatabaseManager
   */
  static setDatabaseManager(dbManager) {
    this.dbManager = dbManager;
  }

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
   * @param {string} sql - SQL con placeholders nombrados
[4:30:33 p. m.]Funciones cargadas
[
  "fn_cursos_disponibles_area",
  "fn_cursos_disponibles_docente"
]
[4:30:33 p. m.]Funciones cargadas
[
  "fn_cursos_disponibles_area",
  "fn_cursos_disponibles_docente"
]
[4:30:35 p. m.]Info cargada para fn_cursos_disponibles_area
{
  "functionName": "fn_cursos_disponibles_area",
  "paramNames": [
    "ID_AREA",
    "ID_CURSO_ACTUAL"
  ],
  "optionalParams": [
    "ID_CURSO_ACTUAL"
  ],
  "sql": "-- =============================================\n-- FUNCTION: fn_cursos_disponibles_area\n-- Devuelve cursos disponibles para un área\n-- con validación del curso actual en CURSO_AREA\n--\n-- Parámetros:\n--   :ID_AREA (INTEGER) - ID del área (requerido)\n--   :ID_CURSO_ACTUAL (INTEGER/NULL) - Curso actual a validar (opcional)\n--\n-- Uso:\n--   Modo Creación: ID_CURSO_ACTUAL = NULL → solo cursos disponibles del área\n--   Modo Edición: ID_CURSO_ACTUAL = valor → curso actual + disponibles del área\n--                 (solo si existe en CURSO_AREA para ese área)\n-- =============================================\n\nSELECT \n  c.ID_CURSO,\n  c.CODIGO_COMPARTIDO,\n  c.NOMBRE_CURSO,\n  c.EJE_TEMATICO,\n  CASE \n    WHEN c.ID_CURSO = :ID_CURSO_ACTUAL \n         AND EXISTS (\n           SELECT 1 FROM CURSO_AREA ca \n           WHERE ca.ID_AREA = :ID_AREA \n           AND ca.ID_CURSO = :ID_CURSO_ACTUAL\n         ) THEN 'ACTUAL'\n    ELSE 'DISPONIBLE'\n  END AS ESTADO_CURSO\nFROM CURSOS c\nWHERE c.ACTIVO = 1\nAND (\n  -- Incluir el curso actual SOLO si está asignado a esta área\n  (\n    c.ID_CURSO = :ID_CURSO_ACTUAL\n    AND EXISTS (\n      SELECT 1 FROM CURSO_AREA ca2\n      WHERE ca2.ID_AREA = :ID_AREA\n      AND ca2.ID_CURSO = :ID_CURSO_ACTUAL\n    )\n  )\n  OR\n  -- O incluir cursos donde el área NO está asignada\n  NOT EXISTS (\n    SELECT 1 \n    FROM CURSO_AREA ca3\n    WHERE ca3.ID_CURSO = c.ID_CURSO \n    AND ca3.ID_AREA = :ID_AREA\n  )\n)\nORDER BY \n  CASE \n    WHEN c.ID_CURSO = :ID_CURSO_ACTUAL \n         AND EXISTS (SELECT 1 FROM CURSO_AREA ca4 WHERE ca4.ID_AREA = :ID_AREA AND ca4.ID_CURSO = :ID_CURSO_ACTUAL)\n    THEN 0 ELSE 1 \n  END,\n  c.NOMBRE_CURSO;\n"
}
[4:30:37 p. m.]Ejecutando función
{
   * @returns {string[]} - Array de nombres de parámetros
   */
  static extractParams(sql, uniqueOnly = true) {
    // Eliminar comentarios de una línea (-- ...) para no contar parámetros en documentación
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
   * Extraer parámetros opcionales del SQL basándose en comentarios
   * Busca comentarios de línea que preceden a cada parámetro y detecta "opcional"
   * @param {string} sql - SQL con comentarios de parámetros
   * @param {string[]} paramNames - Array de nombres de parámetros
   * @returns {string[]} - Array de nombres de parámetros opcionales
   */
  static extractOptionalParams(sql, paramNames) {
    const optionalParams = [];
    const lines = sql.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Buscar líneas de comentario que contengan un parámetro
      const paramMatch = line.match(/--\s*:([A-Za-z_][A-Za-z0-9_]*)/);
      if (paramMatch) {
        const paramName = paramMatch[1];
        
        // Verificar si este parámetro está en nuestra lista
        if (paramNames.includes(paramName)) {
          // Verificar si el comentario contiene la palabra "opcional" (case-insensitive)
          if (/opcional/i.test(line)) {
            optionalParams.push(paramName);
          }
        }
      }
    }

    return optionalParams;
  }

  /**
   * Ejecutar una función SQL con parámetros nombrados
   * @param {string} filename - Nombre del archivo (sin .sql)
   * @param {Object} params - Objeto con parámetros { NOMBRE_PARAM: valor }
   * @returns {Array} - Array de resultados
   * 
   * Ejemplo:
   *   FunctionManager.execute('fn_cursos_disponibles_docente', {
   *     ID_DOCENTE: 5,
   *     ID_CURSO_ACTUAL: 3  // o null
   *   });
   */
  static async execute(filename, params = {}) {
    if (!this.dbManager) {
      throw new Error('DatabaseManager no ha sido inyectado. Llama a FunctionManager.setDatabaseManager() primero.');
    }

    try {
      const filePath = path.join(this.functionsPath, `${filename}.sql`);
      const sql = await fs.readFile(filePath, 'utf8');

      // Extraer TODAS las ocurrencias de parámetros del SQL (no solo únicas)
      const allParamOccurrences = this.extractParams(sql, false);

      // Construir array de parámetros en el orden de aparición en el SQL
      // Cada ocurrencia del mismo parámetro obtiene el mismo valor
      const paramArray = allParamOccurrences.map(name => {
        const value = params[name];
        if (value === undefined) {
          console.warn(`⚠️ Parámetro '${name}' no proporcionado, usando NULL`);
          return null;
        }
        return value;
      });

      // Reemplazar placeholders nombrados por ? para sql.js / SQLite
      // sql.js usa placeholders posicionales (?)
      const sqlPositional = sql.replace(/:[A-Za-z_][A-Za-z0-9_]*/g, '?');

      console.log(`📋 [execute] SQL: ${sqlPositional.substring(0, 100)}...`);
      console.log(`📋 [execute] Params: ${JSON.stringify(paramArray)}`);

      // Ejecutar la query
      const results = await this.dbManager.all(sqlPositional, paramArray);

      return results;
    } catch (error) {
      console.error(`❌ Error ejecutando función ${filename}:`, error.message);
      throw error;
    }
  }

  /**
   * Ejecutar una función SQL y devolver solo el primer resultado
   * @param {string} filename - Nombre del archivo (sin .sql)
   * @param {Object} params - Objeto con parámetros
   * @returns {Object|null} - Primer resultado o null
   */
  static async executeOne(filename, params = {}) {
    const results = await this.execute(filename, params);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Obtener el SQL de una función sin ejecutar
   * @param {string} filename - Nombre del archivo (sin .sql)
   * @returns {string} - Contenido SQL
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
   * @param {string} filename - Nombre del archivo (sin .sql)
   * @returns {Object} - { paramNames: string[], optionalParams: string[], sql: string }
   */
  static async getFunctionInfo(filename) {
    const sql = await this.getSql(filename);
    const paramNames = this.extractParams(sql);
    const optionalParams = this.extractOptionalParams(sql, paramNames);
    return { paramNames, optionalParams, sql };
  }
}

module.exports = FunctionManager;
