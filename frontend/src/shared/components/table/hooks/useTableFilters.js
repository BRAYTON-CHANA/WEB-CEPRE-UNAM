import { useState, useCallback } from 'react';

/**
 * Hook personalizado para manejar el filtrado en tablas
 * @param {boolean} filterable - Si la tabla es filtrable
 * @returns {Object} - Configuración y manejadores de filtrado
 */
export const useTableFilters = (filterable = false) => {
  const [activeFilters, setActiveFilters] = useState({});
  const [initializedColumns, setInitializedColumns] = useState(new Set());

  // Inicializar filtros con todos los valores seleccionados por defecto
  const initializeColumnFilters = useCallback((column, uniqueValues) => {
    if (!filterable || initializedColumns.has(column)) return;
    
    // Si column es un objeto (de processHeader), extraer el title
    // Si ya es un string (title), usarlo directamente
    const columnName = typeof column === 'object' ? column.title : column;
    
    setActiveFilters(prev => ({
      ...prev,
      [columnName]: [...uniqueValues] // Todos los valores seleccionados por defecto
    }));
    
    setInitializedColumns(prev => new Set([...prev, columnName]));
  }, [filterable, initializedColumns]);

  const handleFilterChange = useCallback((column, values) => {
    if (!filterable) return;
    
    // Si column es un objeto (de processHeader), extraer el title
    const columnName = typeof column === 'object' ? column.title : column;
    
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      
      // Siempre mantener la columna en los filtros, incluso si está vacía
      // Esto permite diferenciar entre "sin filtro" y "filtro vacío (ocultar todo)"
      newFilters[columnName] = values;
      
      return newFilters;
    });
  }, [filterable]);

  const clearAllFilters = useCallback(() => {
    if (!filterable) return;
    setActiveFilters({});
  }, [filterable]);

  const hasActiveFilters = useCallback(() => {
    return Object.keys(activeFilters).length > 0;
  }, [activeFilters]);

  const getFilterCount = useCallback(() => {
    return Object.values(activeFilters).reduce((total, values) => total + values.length, 0);
  }, [activeFilters]);

  const isColumnFiltered = useCallback((column) => {
    // Si column es un objeto (de processHeader), extraer el title
    const columnName = typeof column === 'object' ? column.title : column;
    
    return activeFilters[columnName] && activeFilters[columnName].length > 0;
  }, [activeFilters]);

  // Resetear inicialización de columnas (útil cuando los datos cambian)
  const resetColumnInitialization = useCallback((column = null) => {
    if (column === null) {
      // Resetear todas las columnas
      setInitializedColumns(new Set());
    } else {
      // Resetear columna específica
      setInitializedColumns(prev => {
        const newSet = new Set(prev);
        newSet.delete(column);
        return newSet;
      });
    }
  }, []);

  return {
    activeFilters,
    handleFilterChange,
    clearAllFilters,
    hasActiveFilters,
    getFilterCount,
    isColumnFiltered,
    initializeColumnFilters,
    resetColumnInitialization  // ← NUEVO
  };
};
