import cacheService from './cacheService';
import { API_BASE_URL } from '../config/api';

console.log('[crudService] API_BASE_URL:', API_BASE_URL);

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
   * @param {string} tableName - Nombre de la tabla
   * @param {Object} params - Parámetros opcionales (fields, filters, page, pageSize)
   */
  async getTableData(tableName, params = {}) {
    try {
      // ← NUEVO: Construir query string con parámetros
      const queryParams = new URLSearchParams();
      
      if (params.fields && Array.isArray(params.fields)) {
        queryParams.append('fields', params.fields.join(','));
      }
      
      if (params.filters && Array.isArray(params.filters)) {
        queryParams.append('filters', JSON.stringify(params.filters));
      }
      
      if (params.page) {
        queryParams.append('page', params.page);
      }
      
      if (params.pageSize) {
        queryParams.append('pageSize', params.pageSize);
      }
      
      const queryString = queryParams.toString();
      const url = `${API_BASE_URL}/tables/${tableName}${queryString ? `?${queryString}` : ''}`;
      
      console.log(`[crudService] getTableData: Attempting connection to ${url}`);
      
      const response = await fetch(url);
      
      console.log(`[crudService] getTableData: Response status ${response.status} for ${tableName}`);
      
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
    // console.log('[crudService] createRecord llamado');
    // console.log('[crudService] tableName:', tableName);
    // console.log('[crudService] record:', record);
    
    try {
      const response = await fetch(`${API_BASE_URL}/tables/${tableName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(record),
      });
      
      // console.log('[crudService] Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        
        // Detectar error de registro duplicado
        if (response.status === 409 && errorData?.error === 'DUPLICATE_RECORD') {
          throw new Error('Ya existe un registro con esta combinación de datos. No se permiten duplicados.');
        }
        
        const errorText = errorData?.message || await response.text();
        // console.error('[crudService] Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }
      
      const data = await response.json();
      // console.log('[crudService] Response data:', data);
      cacheService.invalidateAll();
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
        const errorData = await response.json().catch(() => null);
        
        // Detectar error de registro duplicado
        if (response.status === 409 && errorData?.error === 'DUPLICATE_RECORD') {
          throw new Error('Ya existe otro registro con esta combinación de datos. Por favor, seleccione valores diferentes.');
        }
        
        const errorText = errorData?.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorText);
      }
      
      const data = await response.json();
      cacheService.invalidateAll();
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
      cacheService.invalidateAll();
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

  /**
   * Obtener valores únicos de una columna (para UniqueSelectInput)
   * GET /api/tables/:tableName/unique?column=X
   */
  async getUniqueValues(tableName, columnName) {
    try {
      // Intentar endpoint específico
      const response = await fetch(
        `${API_BASE_URL}/tables/${tableName}/unique?column=${encodeURIComponent(columnName)}`
      );
      if (response.ok) {
        const data = await response.json();
        return data.data?.values || [];
      }
    } catch (e) {
      // Fallback: cargar todos y extraer únicos
    }

    const allData = await this.getTableData(tableName);
    const records = allData.data?.records || [];
    const values = [...new Set(records.map(r => r[columnName]))]
      .filter(v => v !== null && v !== undefined)
      .sort();
    return values;
  }

  /**
   * Obtener datos para ReferenceSelect (campos específicos)
   * GET /api/tables/:tableName/select?fields=a,b&filters=[...]
   * @param {string} tableName - Nombre de tabla o view
   * @param {Array} fields - Campos a seleccionar
   * @param {Array} filters - Filtros [{field, op, value}]
   */
  async getReferenceData(tableName, fields = [], filters = []) {
    try {
      const params = new URLSearchParams();
      if (fields.length) {
        params.append('fields', fields.join(','));
      }
      if (filters && filters.length > 0) {
        params.append('filters', JSON.stringify(filters));
      }
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const response = await fetch(
        `${API_BASE_URL}/tables/${tableName}/select${queryString}`
      );

      if (response.ok) {
        const data = await response.json();
        return data.data?.records || [];
      } else {
        console.error(`Error ${response.status} en getReferenceData para ${tableName}`);
        return [];
      }
    } catch (error) {
      console.error('Error en getReferenceData:', error);
      return [];
    }
  }
}

export default new CrudService();
