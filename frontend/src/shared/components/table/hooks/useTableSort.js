import { useState, useCallback } from 'react';

/**
 * Hook personalizado para manejar el ordenamiento en tablas
 * @param {boolean} sortable - Si la tabla es ordenable
 * @param {function} onSort - Callback externo para cambios de ordenamiento
 * @returns {Object} - Configuración y manejadores de ordenamiento
 */
export const useTableSort = (sortable = false, onSort = null) => {
  const [sortConfig, setSortConfig] = useState({ key: null, type: null });

  const handleSort = useCallback((header, sortType) => {
    if (!sortable) return;
    
    // Si es el mismo header y mismo tipo, no hacer nada (evitar toggle)
    if (sortConfig.key === header && sortConfig.type === sortType) {
      return;
    }
    
    // Aplicar nuevo ordenamiento
    const newConfig = sortType ? { key: header, type: sortType } : { key: null, type: null };
    setSortConfig(newConfig);
    
    if (onSort) {
      onSort(newConfig);
    }
  }, [sortable, sortConfig, onSort]);

  return {
    sortConfig,
    handleSort
  };
};
