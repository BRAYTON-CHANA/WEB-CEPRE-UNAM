import React from 'react';

/**
 * Componente para mostrar información de selección
 * @param {number} selectedCount - Cantidad de filas seleccionadas
 * @param {Function} getSelectedValues - Función para obtener valores seleccionados
 * @param {string} boundColumn - Columna de enlace para mostrar valores
 */
const SelectionInfo = ({ selectedCount, getSelectedValues, boundColumn }) => {
  if (selectedCount === 0 || !getSelectedValues) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <span>
        {selectedCount} fila{selectedCount !== 1 ? 's' : ''} seleccionada{selectedCount !== 1 ? 's' : ''}
      </span>
      {boundColumn && (
        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
          Valores: {getSelectedValues().join(', ')}
        </span>
      )}
    </div>
  );
};

export default SelectionInfo;
