import React, { useState, useRef, useCallback, useEffect } from 'react';
import Layout from './Layout';
import '../../theme/components/SidebarMenu.css';

/**
 * Layout genérico con Sidebar.
 *
 * Desktop (lg+): el sidebar es "push" — ocupa espacio real en el flex layout
 * y empuja el contenido principal. Contraído ocupa peekWidth px, abierto 280px.
 * Hover sobre el sidebar contraído lo expande. Botón "pin" lo ancla abierto
 * para que no se cierre al salir el mouse. El estado del pin se persiste en
 * localStorage por sidebar (key basada en el nombre del componente) para
 * conservarse al navegar entre páginas que comparten el mismo sidebar.
 *
 * Mobile: toggle manual mediante botón chevron + overlay backdrop con fade.
 *
 * @param {React.ComponentType} header - Componente de header (opcional)
 * @param {React.ComponentType} footer - Componente de footer (opcional)
 * @param {React.ComponentType} sidebar - Componente de sidebar (opcional)
 * @param {boolean} defaultOpen - Si el sidebar inicia abierto
 * @param {boolean} hoverEnabled - Si el hover-to-expand está activo (default true)
 * @param {number} peekWidth - Ancho del sidebar cuando colapsado (default 40)
 * @param {number} hoverDelay - Ms antes de cerrar al salir el mouse (default 300)
 */
const LayoutWithSidebar = ({
  children,
  header = null,
  footer = null,
  sidebar: Sidebar = null,
  defaultOpen = true,
  hoverEnabled = true,
  peekWidth = 40,
  hoverDelay = 300
}) => {
  // Key de localStorage basada en el nombre del componente sidebar
  const sidebarKey = Sidebar?.displayName || Sidebar?.name || 'default';
  const PIN_STORAGE_KEY = `sidebar_pin_${sidebarKey}`;

  const [isSidebarOpen, setIsSidebarOpen] = useState(defaultOpen);
  const [isPinned, setIsPinned] = useState(() => {
    try {
      const saved = localStorage.getItem(PIN_STORAGE_KEY);
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });
  const [isHovering, setIsHovering] = useState(false);
  const closeTimerRef = useRef(null);
  const sidebarRef = useRef(null);

  // Abrir sidebar por hover (solo desktop)
  const handleHoverOpen = useCallback(() => {
    if (!hoverEnabled) return;
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsHovering(true);
    setIsSidebarOpen(true);
  }, [hoverEnabled]);

  // Iniciar timer para cerrar cuando el mouse sale del sidebar (solo desktop)
  const handleHoverClose = useCallback(() => {
    if (!hoverEnabled || isPinned) return;
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setIsHovering(false);
      setIsSidebarOpen(false);
      closeTimerRef.current = null;
    }, hoverDelay);
  }, [hoverEnabled, hoverDelay, isPinned]);

  // Cancelar el cierre si el mouse re-entra al sidebar
  const handleHoverCancelClose = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsHovering(true);
  }, []);

  // Toggle pin (anclar/desanclar sidebar abierto) — persiste en localStorage
  const handleTogglePin = useCallback(() => {
    setIsPinned(prev => {
      const next = !prev;
      try { localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [PIN_STORAGE_KEY]);

  // Toggle manual móvil
  const handleMobileToggle = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  // Limpiar timer al desmontar
  React.useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  // Cerrar sidebar al hacer click fuera del área (solo desktop, respeta pin)
  useEffect(() => {
    if (!hoverEnabled) return;
    const handleClickOutside = (e) => {
      // Si no está abierto o está pineado, no hacer nada
      if (!isSidebarOpen || isPinned) return;
      // Si el click fue dentro del sidebar, no cerrar
      if (sidebarRef.current && sidebarRef.current.contains(e.target)) return;
      // Cancelar cualquier timer pendiente y cerrar inmediatamente
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setIsHovering(false);
      setIsSidebarOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [hoverEnabled, isSidebarOpen, isPinned]);

  return (
    <Layout header={header} footer={footer}>
      <div className="flex relative min-w-0 w-full min-h-[calc(100vh-4rem)]">
        {/* === MÓVIL: overlay backdrop + sidebar fixed === */}
        {Sidebar && (
          <>
            <div
              onClick={() => setIsSidebarOpen(false)}
              className={`lg:hidden fixed inset-0 bg-black z-40 transition-opacity duration-500 ease-out ${
                isSidebarOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
              }`}
            />

            <aside
              className={`lg:hidden fixed top-16 bottom-0 left-0 z-50 h-[calc(100vh-4rem)] w-[280px] transition-transform duration-500 ease-out ${
                isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`}
            >
              <Sidebar />
            </aside>

            <button
              onClick={handleMobileToggle}
              className={`lg:hidden fixed top-20 z-[60] p-1.5 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-100 hover:shadow-md active:scale-95 transition-all duration-500 ease-out items-center justify-center flex ${
                isSidebarOpen ? 'left-[290px]' : 'left-4'
              }`}
              title={isSidebarOpen ? 'Ocultar menú' : 'Mostrar menú'}
              aria-label={isSidebarOpen ? 'Ocultar menú' : 'Mostrar menú'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-500 ease-out ${isSidebarOpen ? '' : 'rotate-180'}`}>
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
          </>
        )}

        {/* === DESKTOP: sidebar push (relative en el flex) === */}
        {Sidebar && (
          <aside
            ref={sidebarRef}
            onMouseEnter={handleHoverOpen}
            onMouseLeave={handleHoverClose}
            className="hidden lg:flex sticky top-16 flex-shrink-0 h-[calc(100vh-4rem)] overflow-hidden"
            style={{
              width: isSidebarOpen ? '280px' : `${peekWidth}px`,
              transition: 'width 500ms cubic-bezier(0.4, 0, 0.2, 1)',
              willChange: 'width'
            }}
          >
            {/* Contenido fijo a 280px — el overflow del aside lo clipa cuando contraído */}
            <div className="h-full w-[280px]" onMouseEnter={handleHoverCancelClose}>
              <Sidebar />
            </div>

            {/* Peek arrow indicator — visible cuando sidebar contraído */}
            <div
              className={`absolute inset-y-0 right-0 flex items-center justify-center transition-opacity duration-300 ease-out group/peek ${
                isSidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
              style={{
                width: `${peekWidth}px`,
                background: '#ffffff',
                borderRight: '2px solid #43B3C1',
                boxShadow: '2px 0 12px -2px rgba(67, 179, 193, 0.35)',
                zIndex: 5,
                cursor: 'pointer'
              }}
            >
              <svg
                className="sidebar-peek-arrow w-7 h-7 transition-all duration-200 ease-out group-hover/peek:scale-125"
                fill="none"
                stroke="#25346A"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                style={{ filter: 'drop-shadow(0 1px 2px rgba(37, 52, 106, 0.2))' }}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>

            {/* Botón pin — píldora con estados visuales claros */}
            {isSidebarOpen && (
              <button
                onClick={handleTogglePin}
                className={`absolute top-3 right-3 z-10 flex items-center justify-center p-1.5 rounded-full transition-all duration-200 ease-out border ${
                  isPinned
                    ? 'bg-[#43B3C1]/15 border-[#43B3C1]/40 text-[#25346A] hover:bg-[#43B3C1]/25 hover:border-[#43B3C1]/60'
                    : 'bg-white/80 border-slate-200 text-slate-500 hover:bg-white hover:border-slate-300 hover:text-slate-700'
                }`}
                style={{ boxShadow: '0 1px 3px rgba(37, 52, 106, 0.12)' }}
                title={isPinned ? 'Desanclar (se cierra al salir el mouse)' : 'Anclar abierto'}
                aria-label={isPinned ? 'Desanclar sidebar' : 'Anclar sidebar'}
                aria-pressed={isPinned}
              >
                {isPinned ? (
                  // Pin relleno (anclado) — color navy sólido
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 17v5" />
                    <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
                  </svg>
                ) : (
                  // Pin outline (desanclado) — gris suave
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 17v5" />
                    <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
                  </svg>
                )}
              </button>
            )}
          </aside>
        )}

        {/* === Contenido principal === */}
        <div className="flex-1 min-w-0 p-4 lg:p-6 lg:pr-8">
          {children}
        </div>
      </div>
    </Layout>
  );
};

export default LayoutWithSidebar;
