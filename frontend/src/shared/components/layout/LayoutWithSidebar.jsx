import React, { useState } from 'react';
import Layout from './Layout';

/**
 * Layout genérico con Sidebar.
 * Recibe header, footer y sidebar como componentes (no como elementos JSX).
 *
 * @param {React.ComponentType} header - Componente de header (opcional)
 * @param {React.ComponentType} footer - Componente de footer (opcional)
 * @param {React.ComponentType} sidebar - Componente de sidebar (opcional)
 */
const LayoutWithSidebar = ({ 
  children, 
  header = null,
  footer = null,
  sidebar: Sidebar = null,
  defaultOpen = true
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(defaultOpen);

  return (
    <Layout header={header} footer={footer}>
      <div className="flex relative min-w-0 w-full min-h-[calc(100vh-4rem)]">
        {/* Botón toggle desktop — flecha para abrir/cerrar */}
        {Sidebar && (
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`hidden lg:flex fixed top-20 z-50 p-1.5 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-100 transition-all duration-300 items-center justify-center ${
              isSidebarOpen ? 'left-[250px]' : 'left-2'
            }`}
            title={isSidebarOpen ? 'Ocultar menú' : 'Mostrar menú'}
            aria-label={isSidebarOpen ? 'Ocultar menú' : 'Mostrar menú'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${isSidebarOpen ? '' : 'rotate-180'}`}>
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
        )}

        {/* Overlay para móvil */}
        {Sidebar && isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          />
        )}

        {/* Sidebar */}
        {Sidebar && (
          <div className={`
            fixed lg:sticky top-16 lg:top-16 bottom-0 left-0 z-50
            h-[calc(100vh-4rem)]
            transform transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0
            ${!isSidebarOpen ? 'lg:hidden' : ''}
          `}>
            <Sidebar />
          </div>
        )}

        {/* Botón toggle móvil — flecha para abrir/cerrar, igual que desktop */}
        {Sidebar && (
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`lg:hidden fixed top-20 z-[60] p-1.5 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-100 transition-all duration-300 items-center justify-center flex ${
              isSidebarOpen ? 'left-[260px]' : 'left-4'
            }`}
            title={isSidebarOpen ? 'Ocultar menú' : 'Mostrar menú'}
            aria-label={isSidebarOpen ? 'Ocultar menú' : 'Mostrar menú'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${isSidebarOpen ? '' : 'rotate-180'}`}>
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
        )}

        {/* Contenido principal */}
        <div className={`flex-1 min-w-0 p-4 lg:p-6 lg:pr-8 transition-all duration-300 ${
          isSidebarOpen ? 'lg:ml-2' : 'lg:ml-0'
        }`}>
          {children}
        </div>
      </div>
    </Layout>
  );
};

export default LayoutWithSidebar;
