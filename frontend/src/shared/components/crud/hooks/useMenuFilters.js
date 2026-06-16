import { useState, useCallback } from 'react';

/**
 * Hook para manejar el estado de los filtros del menú (MenuFilters)
 * @param {Array} initialFilters - Filtros iniciales
 * @returns {Object} Estado y handlers para MenuFilters
 */
export const useMenuFilters = (initialFilters = []) => {
  const [filters, setFilters] = useState(initialFilters);
  const [isExpanded, setIsExpanded] = useState(false);

  /**
   * Aplicar nuevos filtros
   * @param {Array} newFilters - Array de {column, op, value}
   */
  const applyFilters = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  /**
   * Limpiar todos los filtros
   */
  const clearFilters = useCallback(() => {
    setFilters([]);
  }, []);

  /**
   * Toggle de expansión del panel
   */
  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  /**
   * Establecer expansión directamente
   * @param {boolean} value
   */
  const setExpanded = useCallback((value) => {
    setIsExpanded(value);
  }, []);

  return {
    filters,
    isExpanded,
    applyFilters,
    clearFilters,
    toggleExpanded,
    setExpanded
  };
};

export default useMenuFilters;
