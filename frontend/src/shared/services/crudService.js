// API base URL
const API_BASE_URL = 'http://localhost:3001/api';

/**
 * Servicio para conectar con el backend CRUD
 */
class CrudService {
  /**
   * Obtener todas las tablas disponibles
   */
  async getTables() {
    try {
      const response = await fetch(`${API_BASE_URL}/tables`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error obteniendo tablas:', error);
      throw error;
    }
  }

  /**
   * Obtener datos de una tabla específica
   */
  async getTableData(tableName) {
    try {
      const response = await fetch(`${API_BASE_URL}/tables/${tableName}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error obteniendo datos de ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Buscar registros en una tabla
   */
  async searchTable(tableName, searchTerm, field = null) {
    try {
      const params = new URLSearchParams({ q: searchTerm });
      if (field) params.append('field', field);
      
      const response = await fetch(`${API_BASE_URL}/tables/${tableName}/search?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error buscando en ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de una tabla
   */
  async getTableStats(tableName) {
    try {
      const response = await fetch(`${API_BASE_URL}/tables/${tableName}/stats`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error obteniendo estadísticas de ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Crear un nuevo registro en una tabla
   */
  async createRecord(tableName, record) {
    console.log('[crudService] createRecord llamado');
    console.log('[crudService] tableName:', tableName);
    console.log('[crudService] record:', record);
    
    try {
      const response = await fetch(`${API_BASE_URL}/tables/${tableName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(record),
      });
      
      console.log('[crudService] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[crudService] Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('[crudService] Response data:', data);
      return data;
    } catch (error) {
      console.error(`[crudService] Error creando registro en ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Actualizar un registro en una tabla
   */
  async updateRecord(tableName, id, record) {
    try {
      const response = await fetch(`${API_BASE_URL}/tables/${tableName}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(record),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error actualizando registro en ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Eliminar un registro de una tabla
   */
  async deleteRecord(tableName, id) {
    try {
      const response = await fetch(`${API_BASE_URL}/tables/${tableName}/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error eliminando registro de ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Obtener un registro específico de una tabla
   */
  async getRecordById(tableName, id) {
    try {
      const response = await fetch(`${API_BASE_URL}/tables/${tableName}/${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error obteniendo registro ${id} de ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Obtener solo el schema de una tabla (sin registros)
   * Útil para validar formularios contra la estructura de la BD
   */
  async getTableSchema(tableName) {
    try {
      const response = await fetch(`${API_BASE_URL}/tables/${tableName}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data.schema;
    } catch (error) {
      console.error(`Error obteniendo schema de ${tableName}:`, error);
      throw error;
    }
  }
}

export default new CrudService();
