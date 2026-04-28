import React from 'react';
import Layout from '@/shared/components/layout/Layout';
import ConfigSidebar from './ConfigSidebar';

const Configuracion = () => {
  return (
    <Layout>
      <div className="flex">
        <ConfigSidebar />
        <div className="flex-1 container mx-auto p-6">
          <h1 className="text-3xl font-bold mb-6">Configuración</h1>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">Selecciona una opción del menú para configurar el sistema.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Configuracion;
