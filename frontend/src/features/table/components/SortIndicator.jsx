import React, { useState, useRef, useContext, useEffect } from 'react';
import SortMenu from './SortMenu';
import { useMenuContext } from './MenuContext';
import MenuPortal from './MenuPortal';

/**
 * Componente indicador para ordenamiento
 * Maneja solo la lógica de ordenamiento
 */
const SortIndicator = ({ 
  sortable,
  header, 
  dataType,
  sortConfig,
  onSortSelect
}) => {
  const { activeMenu, setActiveMenu } = useMenuContext();
  const isMenuOpen = activeMenu === `sort-${header}`;
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
  
  if (!sortable) return null;
  
  const isActiveSort = sortConfig.key === header;
  
  const handleClick = (e) => {
    e.stopPropagation();
    
    // Toggle del menú usando el contexto global
    if (isMenuOpen) {
      setActiveMenu(null);
    } else {
      setActiveMenu(`sort-${header}`);
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
          isActiveSort ? 'text-blue-600' : 'text-gray-400'
        }`}
        title={`Ordenar ${header}${isActiveSort ? ' (ordenado)' : ''}`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        
        {/* Indicador visual de ordenamiento activo */}
        {isActiveSort && sortConfig.type && (
          <span className="absolute -top-0 -right-3 text-white text-xs w-5 h-5 flex items-center justify-center border-2 border-blue-600 bg-blue-600 rounded-full">
            {sortConfig.type?.includes('asc') || sortConfig.type === 'boolean-true' || sortConfig.type === 'za' ? (
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M12,21V3M9,6l3,-3,3,3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M12,3V21M9,18l3,3,3-3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
             
            )}
          </span>
        )}
      </button>
      
      <MenuPortal isOpen={isMenuOpen && positionCalculated}>
        <div className="fixed" style={{ top: menuPosition.top, left: menuPosition.left, zIndex: 1 }}>
          <SortMenu
            header={header}
            dataType={dataType}
            sortConfig={sortConfig}
            onSortSelect={onSortSelect}
            onClose={handleCloseMenu}
          />
        </div>
      </MenuPortal>
    </div>
  );
};

export default SortIndicator;
