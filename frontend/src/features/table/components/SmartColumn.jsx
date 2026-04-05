import React from 'react';

/**
 * Componente para columna inteligente que maneja conteo y expansión
 * @param {Object} props - Propiedades del componente
 */
const SmartColumn = ({ 
  showCount, 
  expandable, 
  actualIndex, 
  isExpanded, 
  onExpand, 
  cellClassName 
}) => {
  if (!showCount && !expandable) return null;

  return (
    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${cellClassName}`}>
      <div className="flex items-center">
        {/* Icono de expansión */}
        {expandable && (
          <button
            onClick={() => onExpand(actualIndex)}
            className="p-1 rounded hover:bg-gray-100 transition-colors mr-2"
            title={isExpanded ? "Contraer" : "Expandir"}
          >
            <svg 
              className={`w-4 h-4 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
        
        {/* Número de conteo */}
        {showCount && (
          <span className="text-gray-900">
            {actualIndex + 1}
          </span>
        )}
      </div>
    </td>
  );
};

export default SmartColumn;
