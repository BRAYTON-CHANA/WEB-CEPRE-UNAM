const DatabaseManager = require('../database/DatabaseManager');
const TableSchema = require('../database/TableSchema');
const {
  handleDatabaseError,
  validateSchema,
  getDefaultValue,
  processValueForStorage,
  parseJsonFields,
  buildWhereClause,
  buildOrderByClause,
  buildLimitClause,
  validateId,
  createPaginationMetadata,
  filterFieldsByType,
  getCurrentTimestamp
} = require('../utils/databaseUtils');

/**
 * Clase base abstracta para todas las tablas con operaciones CRUD genéricas
 * Proporciona funcionalidades completas de base de datos de forma reutilizable
 * 
 * ⚠️  ADVERTENCIA: Esta es una clase ABSTRACTA y no debe ser instanciada directamente.
 *    Hereda esta clase en tus modelos específicos (ej: class Users extends Table).
 *    La instanciación directa lanzará un error.
 */
class Table {
  /**
   * Constructor de la clase abstracta Table
   * @param {string} tableName - Nombre de la tabla (requerido para validación)
   * @param {Object} options - Opciones de configuración
   * @param {string} options.idField - Campo ID personalizado (defecto: 'id')
   * @throws {Error} Si se intenta instanciar directamente esta clase abstracta
   */
  constructor(tableName, options = {}) {
    // 🚫 BLOQUEO DE INSTANCIACIÓN DIRECTA
    if (this.constructor === Table) {
      throw new Error(
        '❌ Error: La clase Table es ABSTRACTA y no puede ser instanciada directamente. ' +
        'Hereda esta clase en tu modelo específico: class MiTabla extends Table { ... }'
      );
    }

    // ✅ VALIDACIONES OBLIGATORIAS
    if (!tableName || typeof tableName !== 'string') {
      throw new Error('❌ Error: tableName es requerido y debe ser un string');
    }

    // ⚠️ NOTA: El constructor ahora es async para soportar detección de esquemas
    // Usa: const table = await new MyTable(); o MyTable.create()
    this.initializeAsync(tableName, options);
  }

  /**
   * Inicialización asíncrona
   * @private
   */
  async initializeAsync(tableName, options) {
    this.tableName = tableName;
    this.schema = await this.getSchemaFromTable(tableName);
    this.idField = options.idField || 'id';
    
    if (!this.schema) {
      throw new Error(`❌ Error: Esquema no encontrado para la tabla: ${tableName}`);
    }

    // 📋 LOG DE INICIALIZACIÓN (solo para clases hijas)
    console.log(`✅ Modelo inicializado: ${this.constructor.name} → tabla: ${tableName}`);
  }

  /**
   * Obtener esquema desde TableSchema (con auto-detección)
   * @private
   * @param {string} tableName - Nombre de la tabla
   * @returns {Object|null} - Esquema detectado
   */
  async getSchemaFromTable(tableName) {
    try {
      return await TableSchema.getSchema(tableName);
    } catch (error) {
      console.error(`Error obteniendo esquema para ${tableName}:`, error);
      return null;
    }
  }

  /**
   * Método estático para crear instancias (maneja async)
   * @param {string} tableName - Nombre de la tabla
   * @param {Object} options - Opciones
   * @returns {Table} - Instancia inicializada
   */
  static async create(tableName, options = {}) {
    const instance = Object.create(this.prototype);
    await instance.initializeAsync(tableName, options);
    return instance;
  }

  /**
   * Método abstracto que debe ser implementado por las clases hijas
   * Este método sirve como recordatorio para implementar lógica específica
   * @throws {Error} Si la clase hija no implementa este método
   */
  getModelInfo() {
    const modelName = this.constructor.name;
    if (this.getModelInfo === Table.prototype.getModelInfo) {
      throw new Error(
        `❌ Error: La clase ${modelName} debe implementar el método getModelInfo() ` +
        'para proporcionar información específica del modelo.'
      );
    }
    return {
      modelName,
      tableName: this.tableName,
      idField: this.idField,
      fields: Object.keys(this.schema)
    };
  }

  /**
   * Verificar si la instancia es de una clase concreta (no abstracta)
   * @returns {boolean} - True si es una implementación válida
   */
  isConcreteImplementation() {
    return this.constructor !== Table && this.tableName;
  }

  /**
   * Obtener metadatos del modelo actual
   * @returns {Object} - Información detallada del modelo
   */
  getMetadata() {
    if (!this.isConcreteImplementation()) {
      throw new Error('❌ Error: Esta instancia no es una implementación concreta válida');
    }

    return {
      modelName: this.constructor.name,
      tableName: this.tableName,
      idField: this.idField,
      schema: this.schema,
      textFields: this.getTextFields(),
      numericFields: filterFieldsByType(this.schema, 'number'),
      booleanFields: filterFieldsByType(this.schema, 'boolean'),
      jsonFields: filterFieldsByType(this.schema, 'object'),
      timestampFields: filterFieldsByType(this.schema, 'string', ['created_at', 'updated_at'])
    };
  }

  /**
   * Obtener todos los registros
   * @param {string} orderBy - Campo y dirección para ordenar (ej: 'created_at DESC')
   * @returns {Array} - Lista de registros
   */
  async findAll(orderBy = 'created_at DESC') {
    this.validateImplementation();
    try {
      const sql = `SELECT * FROM ${this.tableName} ${buildOrderByClause(orderBy)}`;
      const rows = await DatabaseManager.all(sql);
      
      return parseJsonFields(rows, this.schema);
    } catch (error) {
      handleDatabaseError('findAll', this.tableName, error);
    }
  }

  /**
   * Obtener un registro por ID (o campo personalizado)
   * @param {any} id - Valor del ID a buscar
   * @param {string} idField - Campo personalizado para buscar (opcional, usa this.idField por defecto)
   * @returns {Object} - Registro encontrado
   */
  async findById(id, idField = null) {
    this.validateImplementation();
    try {
      const field = idField || this.idField;
      const validatedId = validateId(id, field);
      const sql = `SELECT * FROM ${this.tableName} WHERE ${field} = ?`;
      const row = await DatabaseManager.get(sql, [validatedId]);
      
      if (!row) {
        throw new Error('Registro no encontrado');
      }
      
      return parseJsonFields([row], this.schema)[0];
    } catch (error) {
      handleDatabaseError('findById', this.tableName, error);
    }
  }

  /**
   * Obtener registros por un campo específico
   * @param {string} fieldName - Nombre del campo a buscar
   * @param {any} value - Valor a buscar en el campo
   * @param {string} orderBy - Campo y dirección para ordenar (opcional)
   * @returns {Array} - Lista de registros que coinciden
   */
  async findByField(fieldName, value, orderBy = 'created_at DESC') {
    this.validateImplementation();
    try {
      const sql = `SELECT * FROM ${this.tableName} WHERE ${fieldName} = ? ${buildOrderByClause(orderBy)}`;
      const rows = await DatabaseManager.all(sql, [value]);
      
      return parseJsonFields(rows, this.schema);
    } catch (error) {
      handleDatabaseError('findByField', this.tableName, error);
    }
  }

  /**
   * Crear un nuevo registro
   * @param {Object} data - Datos del nuevo registro
   * @returns {Object} - Registro creado
   */
  async create(data) {
    this.validateImplementation();
    try {
      // Validar datos con el esquema
      validateSchema(data, this.tableName, this.tableName);

      const { fields, placeholders, values } = this.prepareInsertData(data);
      
      const sql = `INSERT INTO ${this.tableName} (${fields}) VALUES (${placeholders})`;
      const result = await DatabaseManager.run(sql, values);
      
      // Devolver el registro creado
      return await this.findById(result.id);
    } catch (error) {
      handleDatabaseError('create', this.tableName, error);
    }
  }

  /**
   * Actualizar un registro
   * @param {any} id - ID del registro a actualizar
   * @param {Object} data - Datos a actualizar
   * @param {string} idField - Campo personalizado para buscar (opcional, usa this.idField por defecto)
   * @returns {Object} - Registro actualizado
   */
  async update(id, data, idField = null) {
    this.validateImplementation();
    try {
      // Validar datos con el esquema
      validateSchema(data, this.tableName, this.tableName);

      const { setClause, values } = this.prepareUpdateData(data);
      const field = idField || this.idField;
      const validatedId = validateId(id, field);
      
      const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE ${field} = ?`;
      const result = await DatabaseManager.run(sql, [...values, validatedId]);
      
      if (result.changes === 0) {
        throw new Error('Registro no encontrado');
      }
      
      // Devolver el registro actualizado
      return await this.findById(validatedId, field);
    } catch (error) {
      handleDatabaseError('update', this.tableName, error);
    }
  }

  /**
   * Actualizar registros por un campo específico
   * @param {string} fieldName - Nombre del campo para filtrar
   * @param {any} fieldValue - Valor del campo para filtrar
   * @param {Object} data - Datos a actualizar
   * @returns {Array} - Registros actualizados
   */
  async updateByField(fieldName, fieldValue, data) {
    this.validateImplementation();
    try {
      // Validar datos con el esquema
      validateSchema(data, this.tableName, this.tableName);

      const { setClause, values } = this.prepareUpdateData(data);
      
      const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE ${fieldName} = ?`;
      const result = await DatabaseManager.run(sql, [...values, fieldValue]);
      
      if (result.changes === 0) {
        throw new Error('No se encontraron registros para actualizar');
      }
      
      // Devolver los registros actualizados
      return await this.findByField(fieldName, fieldValue);
    } catch (error) {
      handleDatabaseError('updateByField', this.tableName, error);
    }
  }

  /**
   * Eliminar un registro
   * @param {any} id - ID del registro a eliminar
   * @param {string} idField - Campo personalizado para buscar (opcional, usa this.idField por defecto)
   * @returns {Object} - Confirmación de eliminación
   */
  async delete(id, idField = null) {
    this.validateImplementation();
    try {
      const field = idField || this.idField;
      const validatedId = validateId(id, field);
      const sql = `DELETE FROM ${this.tableName} WHERE ${field} = ?`;
      const result = await DatabaseManager.run(sql, [validatedId]);
      
      if (result.changes === 0) {
        throw new Error('Registro no encontrado');
      }
      
      return { id: parseInt(validatedId), deleted: true };
    } catch (error) {
      handleDatabaseError('delete', this.tableName, error);
    }
  }

  /**
   * Eliminar registros por un campo específico
   * @param {string} fieldName - Nombre del campo para filtrar
   * @param {any} fieldValue - Valor del campo para filtrar
   * @returns {Object} - Confirmación de eliminación con cantidad
   */
  async deleteByField(fieldName, fieldValue) {
    this.validateImplementation();
    try {
      const sql = `DELETE FROM ${this.tableName} WHERE ${fieldName} = ?`;
      const result = await DatabaseManager.run(sql, [fieldValue]);
      
      if (result.changes === 0) {
        throw new Error('No se encontraron registros para eliminar');
      }
      
      return { 
        field: fieldName, 
        value: fieldValue, 
        deleted: result.changes,
        message: `Se eliminaron ${result.changes} registros`
      };
    } catch (error) {
      handleDatabaseError('deleteByField', this.tableName, error);
    }
  }

  /**
   * Buscar registros con opciones avanzadas
   * 
   * Estructura de searchOptions:
   * {
   *   query: "texto a buscar",                    // Texto para búsqueda LIKE
   *   fields: ["campo1", "campo2"],              // Campos específicos (opcional, usa campos de texto por defecto)
   *   distinct: ["campo_unico"],                 // Campos para SELECT DISTINCT (evita duplicados)
   *   where: {                                   // Condiciones WHERE adicionales
   *     campo: "valor",
   *     activo: true
   *   },
   *   orderBy: "campo DESC",                     // Ordenamiento
   *   limit: 10                                  // Límite de resultados
   * }
   * 
   * @param {string|Object} queryOrOptions - Texto simple u objeto de opciones
   * @param {Array} searchFields - Campos de búsqueda (solo si queryOrOptions es string)
   * @returns {Array} - Resultados de la búsqueda
   */
  async search(queryOrOptions, searchFields = null) {
    this.validateImplementation();
    try {
      let options = {};
      
      // Si es string, convertir a objeto simple
      if (typeof queryOrOptions === 'string') {
        options = {
          query: queryOrOptions,
          fields: searchFields
        };
      } else {
        options = queryOrOptions;
      }

      let sql = `SELECT`;
      let params = [];

      // Manejar SELECT DISTINCT
      if (options.distinct && Array.isArray(options.distinct)) {
        sql += ` DISTINCT ${options.distinct.join(', ')}`;
      } else {
        sql += ' *';
      }

      sql += ` FROM ${this.tableName}`;

      // Construir WHERE
      const whereConditions = [];

      // Condiciones WHERE adicionales
      if (options.where && typeof options.where === 'object') {
        const { whereClause, params: whereParams } = buildWhereClause(options.where);
        if (whereClause) {
          whereConditions.push(whereClause.replace('WHERE ', ''));
          params.push(...whereParams);
        }
      }

      // Búsqueda LIKE en campos de texto
      if (options.query) {
        const fields = options.fields || this.getTextFields();
        const likeConditions = fields.map(field => `${field} LIKE ?`);
        whereConditions.push(`(${likeConditions.join(' OR ')})`);
        
        const searchTerm = `%${options.query}%`;
        params.push(...fields.map(() => searchTerm));
      }

      // Agregar WHERE si hay condiciones
      if (whereConditions.length > 0) {
        sql += ` WHERE ${whereConditions.join(' AND ')}`;
      }

      // Ordenamiento
      sql += ` ${buildOrderByClause(options.orderBy)}`;

      // Límite
      if (options.limit) {
        const { limitClause, params: limitParams } = buildLimitClause(options.limit);
        sql += ` ${limitClause}`;
        params.push(...limitParams);
      }

      const rows = await DatabaseManager.all(sql, params);
      return parseJsonFields(rows, this.schema);
    } catch (error) {
      handleDatabaseError('search', this.tableName, error);
    }
  }

  /**
   * Contar total de registros
   * @returns {number} - Total de registros
   */
  async count() {
    this.validateImplementation();
    try {
      const sql = `SELECT COUNT(*) as total FROM ${this.tableName}`;
      const result = await DatabaseManager.get(sql);
      return result.total || 0;
    } catch (error) {
      handleDatabaseError('count', this.tableName, error);
    }
  }

  /**
   * Verificar si existe un registro
   * @param {any} id - ID a verificar
   * @param {string} idField - Campo personalizado para buscar (opcional, usa this.idField por defecto)
   * @returns {boolean} - True si existe
   */
  async exists(id, idField = null) {
    this.validateImplementation();
    try {
      const field = idField || this.idField;
      const validatedId = validateId(id, field);
      const sql = `SELECT 1 FROM ${this.tableName} WHERE ${field} = ? LIMIT 1`;
      const result = await DatabaseManager.get(sql, [validatedId]);
      return !!result;
    } catch (error) {
      handleDatabaseError('exists', this.tableName, error);
    }
  }

  /**
   * Obtener registros con paginación
   * @param {number} page - Número de página (empezando en 1)
   * @param {number} limit - Registros por página
   * @param {string} orderBy - Campo y dirección para ordenar
   * @returns {Object} - Datos y metadata de paginación
   */
  async paginate(page = 1, limit = 10, orderBy = 'created_at DESC') {
    this.validateImplementation();
    try {
      const offset = (page - 1) * limit;
      const { limitClause, params: limitParams } = buildLimitClause(limit, offset);
      
      const sql = `SELECT * FROM ${this.tableName} ${buildOrderByClause(orderBy)} ${limitClause}`;
      const rows = await DatabaseManager.all(sql, limitParams);
      
      const total = await this.count();
      
      return {
        data: parseJsonFields(rows, this.schema),
        pagination: createPaginationMetadata(page, limit, total)
      };
    } catch (error) {
      handleDatabaseError('paginate', this.tableName, error);
    }
  }

  /**
   * Validar que esta sea una implementación concreta válida
   * @private
   * @throws {Error} Si no es una implementación válida
   */
  validateImplementation() {
    if (!this.isConcreteImplementation()) {
      throw new Error(
        '❌ Error: Operación no permitida. La clase Table es abstracta y debe ser heredada. ' +
        'Usa: class MiModelo extends Table { ... }'
      );
    }
  }

  /**
   * Obtener campos de texto del esquema para búsqueda por defecto
   * @returns {Array} - Lista de campos de texto (excluyendo timestamps)
   */
  getTextFields() {
    return filterFieldsByType(this.schema, 'string', ['created_at', 'updated_at']);
  }

  /**
   * Preparar datos para INSERT
   * @param {Object} data - Datos a insertar
   * @returns {Object} - { fields, placeholders, values }
   */
  prepareInsertData(data) {
    const now = getCurrentTimestamp();
    const fields = [];
    const placeholders = [];
    const values = [];

    // Agregar campos del esquema
    Object.keys(this.schema).forEach(key => {
      if (key === this.idField) return;
      
      const value = processValueForStorage(data[key], key, this.schema[key], now);
      fields.push(key);
      placeholders.push('?');
      values.push(value);
    });

    return { fields: fields.join(', '), placeholders: placeholders.join(', '), values };
  }

  /**
   * Preparar datos para UPDATE
   * @param {Object} data - Datos a actualizar
   * @returns {Object} - { setClause, values }
   */
  prepareUpdateData(data) {
    const now = getCurrentTimestamp();
    const setParts = [];
    const values = [];

    // Agregar campos actualizables
    Object.keys(this.schema).forEach(key => {
      if (key === this.idField) return;
      if (key.includes('created_at')) return; // No actualizar created_at
      
      if (data[key] !== undefined) {
        const value = processValueForStorage(data[key], key, this.schema[key], now);
        setParts.push(`${key} = ?`);
        values.push(value);
      }
    });

    // Siempre actualizar updated_at
    if (!data.updated_at && this.schema.updated_at) {
      setParts.push('updated_at = ?');
      values.push(now);
    }

    return { setClause: setParts.join(', '), values };
  }

  /**
   * Obtener template para nuevo registro con valores por defecto
   * @returns {Object} - Template vacío con estructura correcta
   */
  getNewRecordTemplate() {
    return TableSchema.createDefaultObject(this.tableName);
  }
}

module.exports = Table;
