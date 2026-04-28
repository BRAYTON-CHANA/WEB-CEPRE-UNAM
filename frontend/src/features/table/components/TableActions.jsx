import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@/shared/components';
import MenuPortal from './MenuPortal';

/**
 * Componente simplificado para renderizar acciones de fila
 * Maneja acciones personalizadas en menú desplegable, editar y eliminar
 */
const TableActions = ({ 
  actions, 
  row, 
  rowIndex, 
  cellClassName 
}) => {
  // Estado para controlar el menú desplegable
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  
  // Calcular posición del menú cuando se abre
  useEffect(() => {
    if (!isMenuOpen || !buttonRef.current) return;
    
    const updatePosition = () => {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right
      });
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

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    if (!isMenuOpen) return;
    
    const handleClickOutside = (event) => {
      const isOutsideButton = buttonRef.current && !buttonRef.current.contains(event.target);
      const isOutsideMenu = menuRef.current && !menuRef.current.contains(event.target);
      const isOutsidePortal = !event.target.closest('.menu-portal-container');
      
      if (isOutsideButton && (isOutsideMenu || isOutsidePortal)) {
        setIsMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <div className="flex gap-2">
      {/* Menú desplegable para acciones personalizadas */}
      {actions?.custom && actions.custom.length > 0 && (
        <div className="relative">
          {/* Botón de tres puntos */}
          <button
            ref={buttonRef}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded transition-colors text-gray-600 hover:bg-gray-100"
            title="Más acciones"
          >
            <Icon name="more-vertical" className="w-4 h-4" />
          </button>
          
          {/* Menú desplegable con portal */}
          <MenuPortal isOpen={isMenuOpen}>
            <div 
              ref={menuRef}
              className="fixed w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-[9999] py-1"
              style={{ 
                top: `${menuPosition.top}px`, 
                right: `${menuPosition.right}px` 
              }}
            >
              {actions.custom.map((customAction, actionIndex) => (
                <button
                  key={actionIndex}
                  onClick={() => {
                    customAction.onClick(row, rowIndex);
                    setIsMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors ${
                    customAction.className || 'text-gray-700'
                  }`}
                >
                  <Icon name={customAction.icon} className="w-4 h-4" />
                  <span>{customAction.label}</span>
                </button>
              ))}
            </div>
          </MenuPortal>
        </div>
      )}
      
      {/* Botón de editar */}
      {actions?.edit?.enabled && (
        <button
          onClick={() => actions.edit.onClick(row, rowIndex)}
          className={`p-2 rounded transition-colors ${
            actions.edit.className || 'text-blue-600 hover:bg-blue-100'
          }`}
          title={actions.edit.label || 'Editar'}
        >
          <Icon name={actions.edit.icon || 'edit'} className="w-4 h-4" />
        </button>
      )}
      
      {/* Botón de eliminar */}
      {actions?.delete?.enabled && (
        <button
          onClick={() => actions.delete.onClick(row, rowIndex)}
          className={`p-2 rounded transition-colors ${
            actions.delete.className || 'text-red-600 hover:bg-red-100'
          }`}
          title={actions.delete.label || 'Eliminar'}
        >
          <Icon name={actions.delete.icon || 'trash'} className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default TableActions;
