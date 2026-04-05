import { useMemo } from 'react';
import { sortData } from '../../../shared/utils/dataUtils';

/**
 * Hook específico del componente Table para procesamiento completo de datos
 * @param {Array} data - Datos originales
 * @param {boolean} sortable - Si es sortable
 * @param {Object} sortConfig - Configuración de ordenamiento
 * @param {boolean} filterable - Si es filtrable
 * @param {Object} activeFilters - Filtros activos por columna
 * @returns {Object} - Datos procesados
 */
export const useTableData = ({
  data,
  sortable,
  sortConfig,
  filterable,
  activeFilters
}) => {
  const processedData = useMemo(() => {
    let filtered = [...data];
    
    // Aplicar filtros de columna
    if (filterable && Object.keys(activeFilters).length > 0) {
      // Verificar si hay alguna columna con filtros activos (no vacíos)
      const hasAnyActiveFilters = Object.entries(activeFilters).some(([column, values]) => 
        values && values.length > 0
      );
      
      // Si hay filtros activos (no vacíos), aplicarlos
      if (hasAnyActiveFilters) {
        filtered = filtered.filter(row => {
          return Object.entries(activeFilters).every(([column, values]) => {
            // Si la columna no tiene filtros definidos, permitir la fila
            if (!values) return true;
            // Si la columna tiene filtros pero el array está vacío, ocultar la fila (deseleccionado todo)
            if (values.length === 0) return false;
            // Si la columna tiene filtros activos, verificar si la fila coincide
            const cellValue = row[column];
            
            // Manejar 'vacío (null)' - buscar filas con valor null
            if (values.includes('vacío (null)')) {
              return cellValue === null || cellValue === undefined || values.includes(cellValue);
            }
            
            return values.includes(cellValue);
          });
        });
      }
      // Si no hay filtros activos (todos vacíos o inicializando), mostrar todos los datos
    }
    
    // Ordenamiento tradicional
    if (sortable && sortConfig.key && sortConfig.type) {
      filtered = sortData(filtered, sortConfig.key, sortConfig.type);
    }
    
    return filtered;
  }, [data, sortable, sortConfig, filterable, activeFilters]);

  return {
    processedData
  };
};
