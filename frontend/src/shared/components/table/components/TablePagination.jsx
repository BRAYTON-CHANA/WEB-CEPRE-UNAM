import React from 'react';
import { PAGINATION_CONFIG } from '../constants/tableConstants';

/**
 * Componente para la paginación de la tabla
 */
const TablePagination = ({ 
  pagination, 
  processedData, 
  itemsPerPage, 
  currentPage, 
  onPageChange,
  onItemsPerPageChange 
}) => {
  if (!pagination) {
    return null;
  }

  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  
  // Opciones para itemsPerPage - siempre mostrar todas las opciones
  const itemsPerPageOptions = [5, 10, 25, 50, 100, 500, 1000];

  return (
    <div className="mt-4 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <div className="text-sm text-gray-700">
          {processedData.length > 0 
            ? `Mostrando ${((currentPage - 1) * itemsPerPage) + 1} a ${Math.min(currentPage * itemsPerPage, processedData.length)} de ${processedData.length} resultados`
            : `No hay resultados`
          }
        </div>
        
        {/* Selector de items por página - siempre visible */}
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-700">Items por página:</label>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange && onItemsPerPageChange(Number(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {itemsPerPageOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Navegación - siempre visible si hay paginación activada */}
      {processedData.length > 0 && (
        <div className="flex space-x-2">
          <button
            onClick={() => onPageChange && onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Anterior
          </button>
          <span className="px-3 py-1 text-sm">
            Página {currentPage} de {totalPages || 1}
          </span>
          <button
            onClick={() => onPageChange && onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
};

export default TablePagination;
