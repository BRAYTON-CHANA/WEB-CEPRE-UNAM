import { useMemo } from 'react';
import { sortData } from '../../../utils/dataUtils';
import { applyFixatedFilters } from '../utils/filterData';

/**
 * Hook específico del componente Table para procesamiento de datos
 * @param {Array} data           - Datos originales
 * @param {Array} fixatedFilters - Filtros fijos externos [{column, op, value}]
 * @param {boolean} sortable     - Si está habilitado el ordenamiento
 * @param {Object} sortConfig    - Configuración de ordenamiento activa
 * @returns {Object} - { processedData }
 */
export const useTableData = ({ data, fixatedFilters, sortable, sortConfig }) => {
  const safeData = Array.isArray(data) ? data : [];

  const processedData = useMemo(() => {
    let filtered = fixatedFilters?.length
      ? applyFixatedFilters(safeData, fixatedFilters)
      : [...safeData];

    if (sortable && sortConfig.key && sortConfig.type) {
      filtered = sortData(filtered, sortConfig.key, sortConfig.type);
    }

    return filtered;
  }, [data, fixatedFilters, sortable, sortConfig]);

  return { processedData };
};
