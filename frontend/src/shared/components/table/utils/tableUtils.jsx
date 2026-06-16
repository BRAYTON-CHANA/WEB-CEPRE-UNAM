import React from 'react';

/**
 * Utilidades específicas del componente Table
 */

/**
 * Renderiza contenido expandible para una fila (específico de Table)
 * @param {Object} row - Datos de la fila
 * @param {string} expandable - Si el contenido es expandible
 * @returns {React.ReactNode|null} - Elemento React renderizado o null
 */
export const renderExpandedContent = (row, expandable) => {
  if (!expandable) return null;
  
  // Calcular número dinámico de columnas
  const propertyCount = Object.keys(row).length;
  
  // Determinar columnas óptimas según cantidad de propiedades
  let gridCols = 'grid-cols-2'; // Por defecto 2 columnas
  if (propertyCount <= 4) {
    gridCols = 'grid-cols-1'; // 1 columna para 4 o menos propiedades
  } else if (propertyCount <= 8) {
    gridCols = 'grid-cols-2'; // 2 columnas para 5-8 propiedades
  } else if (propertyCount <= 12) {
    gridCols = 'grid-cols-3'; // 3 columnas para 9-12 propiedades
  } else {
    gridCols = 'grid-cols-4'; // 4 columnas para más de 12 propiedades
  }
  
  return (
    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
      <div className={`grid ${gridCols} gap-4 text-sm`}>
        {Object.entries(row).map(([key, value]) => (
          <div key={key}>
            <span className="font-medium text-gray-700">{key}:</span>
            <span className="ml-2 text-gray-600">{JSON.stringify(value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Calcula el colspan para las celdas de la tabla (específico de Table)
 * @param {number} headersLength - Longitud de encabezados
 * @param {boolean} showCount - Si se muestra numeración
 * @param {boolean} selectable - Si es seleccionable
 * @param {boolean} expandable - Si es expandible
 * @param {boolean} hasRowActions - Si hay acciones de fila
 * @returns {number} - Valor de colspan
 */
export const calculateColumnSpan = (headersLength, showCount, selectable, expandable, hasRowActions) => {
  return headersLength + 
    (showCount || expandable ? 1 : 0) + 
    (selectable ? 1 : 0) + 
    (hasRowActions ? 1 : 0);
};
