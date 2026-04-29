import React from 'react';
import Layout from './Layout';
import ConfigSidebar from '@/app/views/configuracion/ConfigSidebar';

/**
 * Layout con Sidebar para páginas de configuración
 * Incluye el ConfigSidebar a la izquierda
 */
const LayoutWithSidebar = ({ children, sidebarComponent: Sidebar = ConfigSidebar }) => {
  return (
    <Layout>
      <div className="flex">
        <Sidebar />
        <div className="flex-1 ml-8">
          {children}
        </div>
      </div>
    </Layout>
  );
};

export default LayoutWithSidebar;
