import { useState, useMemo } from 'react';

/**
 * Hook personalizado para manejar la lógica de paginación de la tabla
 * @param {Object} params - Parámetros del hook
 * @returns {Object} - Estado y manejadores de paginación
 */
export const useTablePagination = ({
  itemsPerPage = 10,
  currentPage = 1,
  onPageChange,
  pagination = true
}) => {
  // Estados locales
  const [localItemsPerPage, setLocalItemsPerPage] = useState(itemsPerPage);
  const [localCurrentPage, setLocalCurrentPage] = useState(currentPage);

  // Datos paginados
  const paginatedData = useMemo(() => {
    if (!pagination) {
      // Si no hay paginación, devolver una función que retorne todos los datos
      return (processedData) => processedData;
    }
    
    return (processedData) => {
      const startIndex = (localCurrentPage - 1) * localItemsPerPage;
      const endIndex = startIndex + localItemsPerPage;
      return processedData.slice(startIndex, endIndex);
    };
  }, [pagination, localCurrentPage, localItemsPerPage]);

  // Manejar cambio de items por página
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setLocalItemsPerPage(newItemsPerPage);
    // Resetear a la primera página cuando cambia el items per page
    setLocalCurrentPage(1);
    if (onPageChange) {
      onPageChange(1);
    }
  };

  // Manejar cambio de página
  const handlePageChange = (newPage) => {
    setLocalCurrentPage(newPage);
    if (onPageChange) {
      onPageChange(newPage);
    }
  };

  return {
    localItemsPerPage,
    localCurrentPage,
    paginatedData,
    handleItemsPerPageChange,
    handlePageChange
  };
};
