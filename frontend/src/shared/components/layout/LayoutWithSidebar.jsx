import React, { useState } from 'react';
import Layout from './Layout';
import ConfigSidebar from '@/app/views/configuracion/ConfigSidebar';

/**
 * Layout con Sidebar para páginas de configuración
 * Incluye el ConfigSidebar a la izquierda con efecto responsive
 */
const LayoutWithSidebar = ({ children, sidebarComponent: Sidebar = ConfigSidebar }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <Layout>
      <div className="flex relative">
        {/* Botón de menú móvil */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md hover:bg-gray-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        {/* Overlay para móvil */}
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          />
        )}

        {/* Sidebar */}
        <div className={`
          fixed lg:static inset-y-0 left-0 z-50
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}>
          <Sidebar />
        </div>

        {/* Contenido principal */}
        <div className="flex-1 lg:ml-8 p-4 lg:p-0">
          {children}
        </div>
      </div>
    </Layout>
  );
};

export default LayoutWithSidebar;
