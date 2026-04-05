import React, { useRef, useEffect } from 'react';

/**
 * Componente menú para opciones de ordenamiento
 * Maneja solo la lógica de ordenamiento - sin portal
 */
const SortMenu = ({ 
  header,
  dataType,
  sortConfig,
  onSortSelect,
  onClose
}) => {
  const menuRef = useRef(null);



  // Opciones de ordenamiento según tipo de dato
  const getSortOptions = () => {
    const defaultOption = { key: 'none', label: 'Sin ordenar', icon: '∅' };
    
    switch (dataType) {
      case 'number':
        return [
          defaultOption,
          { key: 'numeric-asc', label: 'Ordenar de menor a mayor', icon: '1→9' },
          { key: 'numeric-desc', label: 'Ordenar de mayor a menor', icon: '9→1' }
        ];
      case 'date':
        return [
          defaultOption,
          { key: 'date-desc', label: 'Ordenar del más reciente al más antiguo', icon: '📅↓' },
          { key: 'date-asc', label: 'Ordenar del más antiguo al más reciente', icon: '📅↑' }
        ];
      case 'boolean':
        return [
          defaultOption,
          { key: 'boolean-true', label: 'Ordenar verdadero primero', icon: '✓' },
          { key: 'boolean-false', label: 'Ordenar falso primero', icon: '✗' }
        ];
      default: // string y otros
        return [
          defaultOption,
          { key: 'az', label: 'Ordenar de A a Z', icon: '↓' },
          { key: 'za', label: 'Ordenar de Z a A', icon: '↑' }
        ];
    }
  };

  const sortOptions = getSortOptions();

  const handleSortOptionClick = (sortType) => {
    if (sortType === 'none') {
      onSortSelect(header, null);
    } else {
      onSortSelect(header, sortType);
    }
    onClose();
  };

  const isActiveSort = (sortType) => {
    if (sortType === 'none') {
      // 'Sin ordenar' está activo solo cuando no hay ordenamiento en ninguna columna
      return sortConfig.key === null;
    }
    return sortConfig.key === header && sortConfig.type === sortType;
  };

  // Renderizar el menú (sin posicionamiento, lo maneja el portal)
  return (
    <div 
      ref={menuRef}
      className="sort-menu-content bg-white border border-gray-200 rounded-lg shadow-lg py-2 w-56"
    >
      {/* Header de ordenamiento */}
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900">
          Ordenar por {header}
        </h3>
      </div>
      
      {/* Opciones de ordenamiento */}
      <div className="p-2">
        {sortOptions.map((option) => (
          <button
            key={option.key}
            onClick={() => handleSortOptionClick(option.key)}
            className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-gray-100 transition-colors ${
              isActiveSort(option.key) 
                ? 'bg-blue-50 text-blue-600 font-medium' 
                : 'text-gray-700'
            }`}
          >
            <span>{option.label}</span>
            <span className="text-xs opacity-60">{option.icon}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SortMenu;
