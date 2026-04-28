import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Componente ViewMenu - Menú sidebar contenido dentro del Calendar
 * Se abre como un panel deslizable dentro del contenedor padre
 * @param {string} currentView - Vista actual: 'year'|'month'|'week'|'day'
 * @param {function} onViewChange - Callback cuando se selecciona una vista
 */
const ViewMenu = ({ currentView, onViewChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const isButtonClickedRef = useRef(false);

  const views = [
    { key: 'year', label: 'Año', icon: '📅' },
    { key: 'month', label: 'Mes', icon: '📆' },
    { key: 'week', label: 'Semana', icon: '🗓️' },
    { key: 'day', label: 'Día', icon: '📋' }
  ];

  const currentLabel = views.find(v => v.key === currentView)?.label || 'Mes';

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleDocumentClick = (event) => {
      // Si se acaba de hacer clic en el botón, no cerrar
      if (isButtonClickedRef.current) {
        isButtonClickedRef.current = false;
        return;
      }
      
      // Cerrar si no se hizo clic en el menú ni en el botón
      const clickedInMenu = menuRef.current && menuRef.current.contains(event.target);
      const clickedInButton = buttonRef.current && buttonRef.current.contains(event.target);
      
      if (!clickedInMenu && !clickedInButton && isOpen) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setMenuPosition({
          top: rect.bottom + 4,
          left: rect.left
        });
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleDocumentClick);
      window.addEventListener('scroll', handleScroll, true);
      
      // Calcular posición del botón
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setMenuPosition({
          top: rect.bottom + 4,
          left: rect.left
        });
      }
    }

    return () => {
      document.removeEventListener('click', handleDocumentClick);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  const handleButtonClick = (e) => {
    e.stopPropagation();
    isButtonClickedRef.current = true;
    setIsOpen(prev => !prev);
  };

  return (
    <div ref={menuRef} className="relative z-[20]">
      {/* Botón para abrir el menú */}
      <button
        ref={buttonRef}
        onClick={handleButtonClick}
        className={`
          flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg border shadow-md transition-all tracking-wide
          ${isOpen 
            ? 'bg-indigo-50 text-indigo-600 border-indigo-300' 
            : 'bg-white text-gray-700 hover:bg-indigo-50/50 border-gray-200'}
        `}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <span>{currentLabel}</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Panel desplegable contenido */}
      {isOpen && createPortal(
        <div 
          ref={menuRef}
          className="fixed bg-white border border-gray-200/60 rounded-lg shadow-xl shadow-gray-900/10 z-[20] overflow-hidden"
          style={{ top: menuPosition.top, left: menuPosition.left }}
        >
          {/* Header del panel */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200/60 bg-gray-50/80">
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Vista</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Opciones de vista */}
          <div className="p-1">
            {views.map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => handleSelect(key)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 text-sm text-left rounded-md transition-colors
                  ${currentView === key 
                    ? 'bg-indigo-50 text-indigo-600 font-semibold' 
                    : 'text-gray-700 hover:bg-indigo-50/50'}
                `}
              >
                <span className="text-lg">{icon}</span>
                <span>{label}</span>
                {currentView === key && (
                  <svg className="w-4 h-4 ml-auto text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ViewMenu;
