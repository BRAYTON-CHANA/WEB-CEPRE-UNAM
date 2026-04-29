import React from 'react';
import { Link } from 'react-router-dom';
import LayoutWithSidebar from '@/shared/components/layout/LayoutWithSidebar';

/**
 * Dashboard de Configuración
 * Página principal con tarjetas de navegación
 */
function Configuracion() {
  const configuracionItems = [
    {
      name: 'SEDES',
      description: 'Gestión de sedes académicas',
      path: '/configuracion/sedes',
      icon: '🏢',
      color: 'bg-blue-500'
    },
    {
      name: 'ÁREAS',
      description: 'Gestión de áreas académicas',
      path: '/configuracion/areas',
      icon: '🗺️',
      color: 'bg-green-500'
    }
  ];

  const renderCard = (item) => (
    <Link
      key={item.name}
      to={item.path}
      className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden"
    >
      <div className={`${item.color} h-2`} />
      <div className="p-6">
        <div className="flex items-center mb-4">
          <span className="text-3xl mr-3">{item.icon}</span>
          <h2 className="text-xl font-semibold text-gray-800">
            {item.name}
          </h2>
        </div>
        <p className="text-gray-600 text-sm">
          {item.description}
        </p>
        <div className="mt-4 flex items-center text-blue-600 text-sm font-medium">
          <span>Configurar</span>
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );

  return (
    <LayoutWithSidebar>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Configuración
          </h1>
          <p className="text-gray-600">
            Gestiona la configuración base del sistema
          </p>
        </div>

        {/* Grid de tarjetas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {configuracionItems.map(renderCard)}
        </div>
      </div>
    </LayoutWithSidebar>
  );
}

export default Configuracion;
