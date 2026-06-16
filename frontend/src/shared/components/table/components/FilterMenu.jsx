import React, { useState, useRef, useEffect, useMemo } from 'react';

/**
 * Componente menú para opciones de filtrado
 * Maneja solo la lógica de filtrado - sin portal
 */
const FilterMenu = ({ 
  header, 
  uniqueValues, 
  originalValues,
  activeFilters, 
  onFilterChange, 
  dataType,
  onClose,
  isEmbedded = false
}) => {
  const menuRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectAll, setSelectAll] = useState(true);
  const [intentionallyDeselected, setIntentionallyDeselected] = useState(false);

  // Calcular filtros actuales para esta columna
  const currentFilters = useMemo(() => {
    const filters = activeFilters[header] || [];
    return filters;
  }, [activeFilters, header]);

  // Helper para obtener label de valor (maneja null/undefined)
  const getValueLabel = (value) => {
    if (value === null || value === undefined) return '(vacío)';
    return String(value);
  };

  // Helper para verificar si un valor está seleccionado (maneja null)
  const isValueSelected = (value) => {
    return currentFilters.some(filter => 
      (filter === value) || (filter === null && value === null)
    );
  };

  // DEBUG: Ver qué valores llegan al filtro
  useEffect(() => {
    console.log(`[FilterMenu:${header}] uniqueValues:`, uniqueValues);
    console.log(`[FilterMenu:${header}] dataType:`, dataType);
    console.log(`[FilterMenu:${header}] activeFilters:`, activeFilters);
  }, [header, uniqueValues, dataType, activeFilters]);

  // Determinar estado de "seleccionar todo"
  useEffect(() => {
    const filteredValues = uniqueValues.filter(value => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (intentionallyDeselected) {
      setSelectAll(false);
    } else if (filteredValues.length === 0) {
      // Si no hay valores para mostrar, no mostrar seleccionar todo
      setSelectAll(false);
    } else if (currentFilters.length === 0 && uniqueValues.length > 0) {
      // Si no hay filtros seleccionados pero hay valores disponibles, significa que todo está deseleccionado
      setSelectAll(false);
    } else if (filteredValues.length > 0 && filteredValues.every(value => currentFilters.includes(value))) {
      // Si todos los valores filtrados están en los filtros seleccionados
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [currentFilters, uniqueValues, searchTerm, intentionallyDeselected]);

  const filteredValues = uniqueValues.filter(value => 
    getValueLabel(value).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = () => {
    if (selectAll) {
      // Si estaba todo seleccionado, deseleccionar todo (ocultar todos los datos)
      onFilterChange(header, []);
      setSelectAll(false);
      setIntentionallyDeselected(true);
    } else {
      // Si no estaba todo seleccionado, seleccionar TODOS los valores originales
      const valuesToSelect = originalValues || uniqueValues;
      onFilterChange(header, [...valuesToSelect]);
      setSelectAll(true);
      setIntentionallyDeselected(false);
    }
  };

  const handleToggleValue = (value) => {
    const newFilters = [...currentFilters];
    const valueIndex = newFilters.indexOf(value);
    
    if (valueIndex > -1) {
      // Deseleccionar valor
      newFilters.splice(valueIndex, 1);
    } else {
      // Seleccionar valor
      newFilters.push(value);
    }
    
    // Si el usuario modifica manualmente, resetear el estado de deselección intencional
    setIntentionallyDeselected(false);
    onFilterChange(header, newFilters);
  };

  const hasActiveFilters = currentFilters.length > 0;

  // Renderizar el menú (sin posicionamiento, lo maneja el portal)
  return (
    <div 
      ref={menuRef}
      className="filter-menu-content bg-white border border-gray-200 rounded-lg shadow-lg py-2 w-64"
    >
      {/* Header del filtro */}
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">
            Filtrar {header}
          </h3>
        </div>
        
        {/* Búsqueda dentro del filtro */}
        <div className="px-3 pb-2">
          <input
            type="text"
            placeholder="Buscar valores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Opción seleccionar todo */}
      <div className="px-3 py-2 border-b border-gray-200">
        <div className="flex items-center hover:bg-gray-50 rounded px-2 py-1">
          <input
            type="checkbox"
            checked={selectAll}
            onChange={handleSelectAll}
            className="mr-2 rounded border-gray-300 text-blue-600"
          />
          <span 
            className="font-medium text-xs cursor-pointer flex-1"
            onClick={handleSelectAll}
          >
            Seleccionar todo
          </span>
        </div>
      </div>

      {/* Lista de valores */}
      <div className="max-h-64 overflow-y-auto">
        {filteredValues.length === 0 ? (
          <div className="px-3 py-4 text-center text-gray-500 text-sm">
            No se encontraron valores
          </div>
        ) : (
          filteredValues.map((value, index) => (
            <div 
              key={index}
              className="px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={isValueSelected(value)}
                  onChange={() => handleToggleValue(value)}
                  className="mr-2 rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm text-gray-700 flex-1">
                  {getValueLabel(value)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer con acciones */}
      <div className="px-3 py-2 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-between">
          <span className="text-xs text-gray-500">
            {hasActiveFilters ? `${currentFilters.length} seleccionados` : `${uniqueValues.length} valores`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default FilterMenu;
