import React, { useState, useRef, useContext, useEffect } from 'react';
import FilterMenu from './FilterMenu';
import { useMenuContext } from './MenuContext';
import MenuPortal from './MenuPortal';

/**
 * Componente indicador para filtrado
 * Maneja solo la lógica de filtrado
 */
const FilterIndicator = ({ 
  filterable,
  header, 
  uniqueValues,
  originalValues,
  activeFilters, 
  dataType,
  onFilterChange
}) => {
  const { activeMenu, setActiveMenu } = useMenuContext();
  const isMenuOpen = activeMenu === `filter-${header}`;
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [positionCalculated, setPositionCalculated] = useState(false);
  
  // Calcular posición del menú cuando se abre
  useEffect(() => {
    if (!isMenuOpen || !buttonRef.current) {
      setPositionCalculated(false);
      return;
    }
    
    const updatePosition = () => {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        left: rect.left
      });
      setPositionCalculated(true);
    };
    
    updatePosition();
    
    // Actualizar posición en scroll/resize
    const handleScroll = () => updatePosition();
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isMenuOpen]);
  
  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    if (!isMenuOpen) return;
    
    const handleClickOutside = (event) => {
      // Verificar si el clic es fuera del contenedor Y fuera del portal del menú
      const isOutsideContainer = containerRef.current && !containerRef.current.contains(event.target);
      const isOutsideMenu = !event.target.closest('.menu-portal-container');
      
      if (isOutsideContainer && isOutsideMenu) {
        setActiveMenu(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen, setActiveMenu]);
  
  if (!filterable) return null;
  
  // Verificar si los filtros activos incluyen todos los valores únicos ORIGINALES (incluyendo null)
  const hasAllOriginalValuesSelected = originalValues && originalValues.length > 0 && 
    activeFilters[header] && 
    activeFilters[header].length === originalValues.length &&
    originalValues.every(value => activeFilters[header].includes(value));

  // Activo cuando hay filtros definidos Y (NO están todos seleccionados O el array está vacío)
  const filterCount = hasAllOriginalValuesSelected ? 0 : (activeFilters[header] ? activeFilters[header].length : 0);
  const hasActiveFilters = activeFilters[header] && (!hasAllOriginalValuesSelected || activeFilters[header].length === 0 );
  
  

  
  const handleClick = (e) => {
    e.stopPropagation();
    
    // Toggle del menú usando el contexto global
    if (isMenuOpen) {
      setActiveMenu(null);
    } else {
      setActiveMenu(`filter-${header}`);
    }
  };
  
  const handleCloseMenu = () => {
    setActiveMenu(null);
  };
  
  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={buttonRef}
        onClick={handleClick}
        className={`p-2 rounded hover:bg-gray-100 transition-colors relative ${
          hasActiveFilters ? 'text-blue-600' : 'text-gray-400'
        }`}
        title={`Filtrar ${header}${
          hasActiveFilters ? ' (filtrado)' : ''
        }`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M3 4.6C3 4.03995 3 3.75992 3.10899 3.54601C3.20487 3.35785 3.35785 3.20487 3.54601 3.10899C3.75992 3 4.03995 3 4.6 3H19.4C19.9601 3 20.2401 3 20.454 3.10899C20.6422 3.20487 20.7951 3.35785 20.891 3.54601C21 3.75992 21 4.03995 21 4.6V6.33726C21 6.58185 21 6.70414 20.9724 6.81923C20.9479 6.92127 20.9075 7.01881 20.8526 7.10828C20.7908 7.2092 20.7043 7.29568 20.5314 7.46863L14.4686 13.5314C14.2957 13.7043 14.2092 13.7908 14.1474 13.8917C14.0925 13.9812 14.0521 14.0787 14.0276 14.1808C14 14.2959 14 14.4182 14 14.6627V17L10 21V14.6627C10 14.4182 10 14.2959 9.97237 14.1808C9.94787 14.0787 9.90747 13.9812 9.85264 13.8917C9.7908 13.7908 9.70432 13.7043 9.53137 13.5314L3.46863 7.46863C3.29568 7.29568 3.2092 7.2092 3.14736 7.10828C3.09253 7.01881 3.05213 6.92127 3.02763 6.81923C3 6.70414 3 6.58185 3 6.33726V4.6Z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        
        {/* Indicador visual de filtros activos */}
        {hasActiveFilters && (
          <span className="absolute -top-0 -right-3 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
              <path d="M3 4.6C3 4.03995 3 3.75992 3.10899 3.54601C3.20487 3.35785 3.35785 3.20487 3.54601 3.10899C3.75992 3 4.03995 3 4.6 3H19.4C19.9601 3 20.2401 3 20.454 3.10899C20.6422 3.20487 20.7951 3.35785 20.891 3.54601C21 3.75992 21 4.03995 21 4.6V6.33726C21 6.58185 21 6.70414 20.9724 6.81923C20.9479 6.92127 20.9075 7.01881 20.8526 7.10828C20.7908 7.2092 20.7043 7.29568 20.5314 7.46863L14.4686 13.5314C14.2957 13.7043 14.2092 13.7908 14.1474 13.8917C14.0925 13.9812 14.0521 14.0787 14.0276 14.1808C14 14.2959 14 14.4182 14 14.6627V17L10 21V14.6627C10 14.4182 10 14.2959 9.97237 14.1808C9.94787 14.0787 9.90747 13.9812 9.85264 13.8917C9.7908 13.7908 9.70432 13.7043 9.53137 13.5314L3.46863 7.46863C3.29568 7.29568 3.2092 7.2092 3.14736 7.10828C3.09253 7.01881 3.05213 6.92127 3.02763 6.81923C3 6.70414 3 6.58185 3 6.33726V4.6Z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        )}
      </button>
      
      <MenuPortal isOpen={isMenuOpen && positionCalculated}>
        <div className="fixed" style={{ top: menuPosition.top, left: menuPosition.left, zIndex: 1 }}>
          <FilterMenu
            header={header}
            uniqueValues={uniqueValues}
            originalValues={originalValues}
            activeFilters={activeFilters}
            onFilterChange={onFilterChange}
            dataType={dataType}
            onClose={handleCloseMenu}
          />
        </div>
      </MenuPortal>
    </div>
  );
};

export default FilterIndicator;
