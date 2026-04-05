const DatabaseManager = require('../database/DatabaseManager');
const TableSchema = require('../database/TableSchema');

/**
 * Controlador CRUD Genérico - Maneja cualquier tabla dinámicamente
 * Proporciona operaciones CRUD estándar para cualquier tabla en la base de datos
 */
class GenericCrudController {
  /**
   * Obtener todas las tablas disponibles
   */
  async getTables(req, res) {
    try {
      const tables = await DatabaseManager.getAllTables();
      res.json({
        success: true,
        data: {
          tables,
          count: tables.length
        },
        message: 'Tablas obtenidas exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener las tablas',
        error: error.message
      });
    }
  }

  /**
   * Obtener todos los registros de una tabla específica
   */
  async getAll(req, res) {
    try {
      const { tableName } = req.params;
      
      // Validar que la tabla exista
      await this.validateTable(tableName);
      
      const data = await DatabaseManager.all(`SELECT * FROM ${tableName}`);
      const schema = await DatabaseManager.getTableSchema(tableName);
      
      res.json({
        success: true,
        data: {
          records: data,
          schema,
          tableName,
          count: data.length
        },
        message: `Registros de ${tableName} obtenidos exitosamente`
      });
    } catch (error) {
      this.handleError(res, error, 'obtener los registros');
    }
  }

  /**
   * Obtener un registro específico por ID
   */
  async getById(req, res) {
    try {
      const { tableName, id } = req.params;
      
      await this.validateTable(tableName);
      this.validateId(id);
      
      // Detectar el campo ID primario de la tabla
      const schema = await DatabaseManager.getTableSchema(tableName);
      const idField = Object.keys(schema).find(field => 
        schema[field].primary_key || field === 'ID' || field === 'id'
      ) || 'ID';
      
      console.log(`[GET BY ID] Tabla: ${tableName}, ID field: ${idField}, valor: ${id}`);
      
      const record = await DatabaseManager.get(
        `SELECT * FROM ${tableName} WHERE ${idField} = ?`, 
        [id]
      );
      
      if (!record) {
        return res.status(404).json({
          success: false,
          message: `Registro con ID ${id} no encontrado en ${tableName}`
        });
      }
      
      res.json({
        success: true,
        data: { record },
        message: 'Registro obtenido exitosamente'
      });
    } catch (error) {
      console.error(`[GET BY ID] Error:`, error);
      this.handleError(res, error, 'obtener el registro');
    }
  }

  /**
   * Crear un nuevo registro
   */
  async create(req, res) {
    try {
      const { tableName } = req.params;
      const recordData = req.body;
      
      await this.validateTable(tableName);
      await this.validateRecordData(tableName, recordData);
      
      // Agregar timestamps si la tabla los tiene
      const schema = await DatabaseManager.getTableSchema(tableName);
      const now = new Date().toISOString();
      
      if (schema.created_at) {
        recordData.created_at = now;
      }
      if (schema.updated_at) {
        recordData.updated_at = now;
      }
      
      // Construir query de inserción
      const fields = Object.keys(recordData);
      const placeholders = fields.map(() => '?').join(', ');
      const values = Object.values(recordData);
      
      const sql = `INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
      
      const result = await DatabaseManager.run(sql, values);
      
      // Obtener el registro creado usando el campo ID correcto
      const tableSchema = await DatabaseManager.getTableSchema(tableName);
      const idField = Object.keys(tableSchema).find(field => 
        tableSchema[field].primary_key || field === 'ID' || field === 'id'
      ) || 'ID';
      
      const createdRecord = await DatabaseManager.get(
        `SELECT * FROM ${tableName} WHERE ${idField} = ?`, 
        [result.id]
      );
      
      res.status(201).json({
        success: true,
        data: { record: createdRecord },
        message: 'Registro creado exitosamente'
      });
    } catch (error) {
      this.handleError(res, error, 'crear el registro');
    }
  }

  /**
   * Actualizar un registro existente
   */
  async update(req, res) {
    try {
      const { tableName, id } = req.params;
      const updateData = req.body;
      
      await this.validateTable(tableName);
      this.validateId(id);
      await this.validateRecordData(tableName, updateData, true);
      
      // Obtener esquema y detectar campo ID primario
      const schema = await DatabaseManager.getTableSchema(tableName);
      const idField = Object.keys(schema).find(field => 
        schema[field].primary_key || field === 'ID' || field === 'id'
      ) || 'ID';
      
      // Verificar que el registro exista
      const existingRecord = await DatabaseManager.get(
        `SELECT * FROM ${tableName} WHERE ${idField} = ?`, 
        [id]
      );
      
      if (!existingRecord) {
        return res.status(404).json({
          success: false,
          message: `Registro con ID ${id} no encontrado en ${tableName}`
        });
      }
      
      // Agregar updated_at si la tabla lo tiene
      if (schema.updated_at) {
        updateData.updated_at = new Date().toISOString();
      }
      
      // Construir query de actualización
      const fields = Object.keys(updateData);
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const values = [...Object.values(updateData), id];
      
      const sql = `UPDATE ${tableName} SET ${setClause} WHERE ${idField} = ?`;
      
      await DatabaseManager.run(sql, values);
      
      // Obtener el registro actualizado usando el campo ID correcto
      const updatedRecord = await DatabaseManager.get(
        `SELECT * FROM ${tableName} WHERE ${idField} = ?`, 
        [id]
      );
      
      res.json({
        success: true,
        data: { record: updatedRecord },
        message: 'Registro actualizado exitosamente'
      });
    } catch (error) {
      this.handleError(res, error, 'actualizar el registro');
    }
  }

  /**
   * Eliminar un registro
   */
  async delete(req, res) {
    try {
      const { tableName, id } = req.params;
      
      await this.validateTable(tableName);
      this.validateId(id);
      
      // Obtener esquema y detectar campo ID primario
      const schema = await DatabaseManager.getTableSchema(tableName);
      const idField = Object.keys(schema).find(field => 
        schema[field].primary_key || field === 'ID' || field === 'id'
      ) || 'ID';
      
      // Verificar que el registro exista
      const existingRecord = await DatabaseManager.get(
        `SELECT * FROM ${tableName} WHERE ${idField} = ?`, 
        [id]
      );
      
      if (!existingRecord) {
        return res.status(404).json({
          success: false,
          message: `Registro con ID ${id} no encontrado en ${tableName}`
        });
      }
      
      await DatabaseManager.run(
        `DELETE FROM ${tableName} WHERE ${idField} = ?`, 
        [id]
      );
      
      res.json({
        success: true,
        data: { deletedRecord: existingRecord },
        message: 'Registro eliminado exitosamente'
      });
    } catch (error) {
      this.handleError(res, error, 'eliminar el registro');
    }
  }

  /**
   * Buscar registros en una tabla
   */
  async search(req, res) {
    try {
      const { tableName } = req.params;
      const { q: searchTerm, field, limit = 50 } = req.query;
      
      await this.validateTable(tableName);
      
      if (!searchTerm) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere un término de búsqueda (parámetro "q")'
        });
      }
      
      let sql = `SELECT * FROM ${tableName} WHERE `;
      let params = [];
      
      if (field) {
        // Búsqueda en campo específico
        sql += `${field} LIKE ?`;
        params.push(`%${searchTerm}%`);
      } else {
        // Búsqueda en todos los campos de texto
        const schema = await DatabaseManager.getTableSchema(tableName);
        const textFields = Object.keys(schema).filter(fieldName => 
          schema[fieldName].type?.toLowerCase().includes('text') || 
          schema[fieldName].type?.toLowerCase().includes('char')
        );
        
        if (textFields.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'No se encontraron campos de texto para buscar'
          });
        }
        
        const whereConditions = textFields.map(field => `${field} LIKE ?`);
        sql += whereConditions.join(' OR ');
        params = textFields.map(() => `%${searchTerm}%`);
      }
      
      sql += ` LIMIT ${parseInt(limit)}`;
      
      const results = await DatabaseManager.all(sql, params);
      
      res.json({
        success: true,
        data: {
          records: results,
          count: results.length,
          searchTerm,
          tableName
        },
        message: 'Búsqueda completada exitosamente'
      });
    } catch (error) {
      this.handleError(res, error, 'realizar la búsqueda');
    }
  }

  /**
   * Obtener estadísticas de una tabla
   */
  async getStats(req, res) {
    try {
      const { tableName } = req.params;
      
      await this.validateTable(tableName);
      
      const totalRecords = await DatabaseManager.get(
        `SELECT COUNT(*) as total FROM ${tableName}`
      );
      
      // Obtener estadísticas básicas
      const schema = await DatabaseManager.getTableSchema(tableName);
      const stats = { total: totalRecords.total };
      
      // Agregar estadísticas para campos específicos
      for (const [fieldName, fieldConfig] of Object.entries(schema)) {
        if (fieldConfig.type?.toLowerCase().includes('int') || 
            fieldConfig.type?.toLowerCase().includes('float') ||
            fieldConfig.type?.toLowerCase().includes('real')) {
          const avgResult = await DatabaseManager.get(
            `SELECT AVG(${fieldName}) as avg FROM ${tableName} WHERE ${fieldName} IS NOT NULL`
          );
          stats[`avg_${fieldName}`] = avgResult.avg;
        }
        
        if (fieldConfig.type?.toLowerCase().includes('boolean') || 
            fieldConfig.type?.toLowerCase().includes('tinyint')) {
          const boolStats = await DatabaseManager.get(
            `SELECT 
              COUNT(CASE WHEN ${fieldName} = 1 THEN 1 END) as true_count,
              COUNT(CASE WHEN ${fieldName} = 0 THEN 1 END) as false_count
            FROM ${tableName}`
          );
          stats[`${fieldName}_true`] = boolStats.true_count;
          stats[`${fieldName}_false`] = boolStats.false_count;
        }
      }
      
      res.json({
        success: true,
        data: { stats, tableName, schema },
        message: 'Estadísticas obtenidas exitosamente'
      });
    } catch (error) {
      this.handleError(res, error, 'obtener las estadísticas');
    }
  }

  /**
   * Validar que una tabla exista
   */
  async validateTable(tableName) {
    const tables = await DatabaseManager.getAllTables();
    if (!tables.includes(tableName)) {
      throw new Error(`La tabla "${tableName}" no existe`);
    }
  }

  /**
   * Validar ID
   */
  validateId(id) {
    if (!id || isNaN(parseInt(id))) {
      throw new Error('ID inválido: debe ser un número entero');
    }
  }

  /**
   * Validar datos del registro
   */
  async validateRecordData(tableName, data, isUpdate = false) {
    if (!data || typeof data !== 'object') {
      throw new Error('Datos del registro inválidos');
    }
    
    if (!isUpdate && Object.keys(data).length === 0) {
      throw new Error('Se requiere al menos un campo para crear un registro');
    }
    
    const schema = await DatabaseManager.getTableSchema(tableName);
    
    // Validar que los campos existan en la tabla
    for (const fieldName of Object.keys(data)) {
      if (!schema[fieldName]) {
        throw new Error(`El campo "${fieldName}" no existe en la tabla "${tableName}"`);
      }
    }
  }

  /**
   * Manejar errores de forma consistente
   */
  handleError(res, error, operation) {
    console.error(`Error al ${operation}:`, error);
    
    if (error.message.includes('no existe')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message.includes('inválido')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: `Error al ${operation}`,
      error: error.message
    });
  }
}

module.exports = new GenericCrudController();
