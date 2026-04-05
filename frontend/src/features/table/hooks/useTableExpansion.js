import { useState, useCallback } from 'react';

/**
 * Hook personalizado para manejar la expansión de filas en tablas
 * @returns {Object} - Estado y manejadores de expansión
 */
export const useTableExpansion = () => {
  const [expandedRows, setExpandedRows] = useState(new Set());

  const handleExpand = useCallback((rowIndex) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowIndex)) {
      newExpanded.delete(rowIndex);
    } else {
      newExpanded.add(rowIndex);
    }
    setExpandedRows(newExpanded);
  }, [expandedRows]);

  const isExpanded = useCallback((rowIndex) => {
    return expandedRows.has(rowIndex);
  }, [expandedRows]);

  const clearExpansion = useCallback(() => {
    setExpandedRows(new Set());
  }, []);

  return {
    expandedRows,
    handleExpand,
    isExpanded,
    clearExpansion
  };
};
