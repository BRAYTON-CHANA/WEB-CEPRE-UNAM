/**
 * Servicio central de cache para invalidación entre hooks
 * Permite que useFunctionData y useReferenceData se recarguen
 * automáticamente después de operaciones CRUD
 */
class CacheService {
  constructor() {
    this.listeners = new Set();
    this.invalidationLog = [];
    this.maxLogSize = 50;
  }

  /**
   * Registrar un callback para escuchar eventos de invalidación
   * @param {Function} callback - Función a llamar cuando se invalide cache
   * @returns {Function} - Función para desuscribirse
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Invalidar caches específicos o todos
   * @param {Object} options - Opciones de invalidación
   * @param {string} options.tableName - Invalidar caches de tabla específica
   * @param {string} options.functionName - Invalidar caches de función específica
   * @param {boolean} options.all - Invalidar todos los caches
   */
  invalidate(options = {}) {
    const { tableName, functionName, all = false } = options;
    
    const event = {
      timestamp: Date.now(),
      tableName,
      functionName,
      all
    };
    
    // Guardar en log para debugging
    this.invalidationLog.push(event);
    if (this.invalidationLog.length > this.maxLogSize) {
      this.invalidationLog.shift();
    }
    
    // Notificar a todos los listeners
    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (err) {
        console.error('[CacheService] Error en listener:', err);
      }
    });
  }

  /**
   * Invalidar todos los caches (útil después de cualquier operación CRUD)
   */
  invalidateAll() {
    this.invalidate({ all: true });
  }

  /**
   * Obtener log de invalidaciones (para debugging)
   */
  getInvalidationLog() {
    return [...this.invalidationLog];
  }

  /**
   * Limpiar log de invalidaciones
   */
  clearLog() {
    this.invalidationLog = [];
  }
}

export default new CacheService();
