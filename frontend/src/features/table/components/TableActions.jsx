import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Icon } from '@/shared/components';
import MenuPortal from './MenuPortal';

/**
 * Componente para renderizar acciones de fila de forma dinámica
 * - Objetos con enabled=true se renderizan como botones directos
 * - Arrays se renderizan como menú desplegable (todos los arrays se combinan en un solo menú)
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

  // Separar acciones en botones directos y menú desplegable
  const { directActions, dropdownActions } = useMemo(() => {
    if (!actions) return { directActions: [], dropdownActions: [] };

    const direct = [];
    const dropdown = [];

    Object.entries(actions).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        dropdown.push(...value.filter(item => item.enabled !== false));
      } else if (typeof value === 'object' && value !== null && value.enabled === true) {
        direct.push({ ...value, key });
      }
    });

    return { directActions: direct, dropdownActions: dropdown };
  }, [actions]);

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
      {/* Menú desplegable para arrays de acciones */}
      {dropdownActions.length > 0 && (
        <div className="relative">
          <button
            ref={buttonRef}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded transition-colors text-gray-600 hover:bg-gray-100"
            title="Más acciones"
          >
            <Icon name="more-vertical" className="w-4 h-4" />
          </button>

          <MenuPortal isOpen={isMenuOpen}>
            <div
              ref={menuRef}
              className="fixed w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-[9999] py-1"
              style={{
                top: `${menuPosition.top}px`,
                right: `${menuPosition.right}px`
              }}
            >
              {dropdownActions.map((action, actionIndex) => (
                <button
                  key={actionIndex}
                  onClick={() => {
                    action.onClick(row, rowIndex);
                    setIsMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors ${
                    action.className || 'text-gray-700'
                  }`}
                >
                  <Icon name={action.icon} className="w-4 h-4" />
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </MenuPortal>
        </div>
      )}

      {/* Botones directos para objetos habilitados */}
      {directActions.map((action) => (
        <button
          key={action.key}
          onClick={() => action.onClick(row, rowIndex)}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
            action.className || 'text-gray-600 hover:bg-gray-100'
          }`}
          title={action.label || action.key}
        >
          <Icon name={action.icon || 'circle'} className="w-4 h-4" />
          <span>{action.label || action.key}</span>
        </button>
      ))}
    </div>
  );
};

export default TableActions;
