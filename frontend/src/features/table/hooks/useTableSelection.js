import { useState, useCallback } from 'react';

/**
 * Hook personalizado para manejar la selección de filas en tablas
 * @param {Array} data - Datos de la tabla
 * @param {function} onSelect - Callback externo para cambios de selección
 * @param {string} boundColumn - Columna de datos para obtener valores ocultos
 * @param {function} onGetSelects - Callback para obtener seleccionados con valores bound
 * @returns {Object} - Estado y manejadores de selección
 */
export const useTableSelection = (data = [], onSelect = null, boundColumn = null, onGetSelects = null) => {
  const [selectedRows, setSelectedRows] = useState(new Set());

  // Función para obtener los valores de las filas seleccionadas
  const getSelectedValues = useCallback(() => {
    if (!boundColumn || selectedRows.size === 0) return [];
    
    return Array.from(selectedRows).map(rowIndex => {
      const rowData = data[rowIndex];
      return rowData ? rowData[boundColumn] : null;
    }).filter(value => value !== null);
  }, [data, selectedRows, boundColumn]);

  const handleSelect = useCallback((rowIndex, checked) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(rowIndex);
    } else {
      newSelected.delete(rowIndex);
    }
    setSelectedRows(newSelected);
    
    if (onSelect) {
      onSelect(Array.from(newSelected));
    }
    
    if (onGetSelects) {
      onGetSelects(getSelectedValues());
    }
  }, [selectedRows, onSelect, onGetSelects, getSelectedValues]);

  const handleSelectAll = useCallback((checked) => {
    if (checked) {
      const allIndices = new Set(data.map((_, index) => index));
      setSelectedRows(allIndices);
      if (onSelect) onSelect(Array.from(allIndices));
      if (onGetSelects) onGetSelects(getSelectedValues());
    } else {
      setSelectedRows(new Set());
      if (onSelect) onSelect([]);
      if (onGetSelects) onGetSelects([]);
    }
  }, [data, onSelect, onGetSelects]);

  const clearSelection = useCallback(() => {
    setSelectedRows(new Set());
    if (onSelect) onSelect([]);
    if (onGetSelects) onGetSelects([]);
  }, [onSelect, onGetSelects]);

  return {
    selectedRows,
    handleSelect,
    handleSelectAll,
    clearSelection,
    getSelectedValues
  };
};
