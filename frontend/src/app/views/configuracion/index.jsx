import React from 'react';
import LayoutWithSidebar from '@/shared/components/layout/LayoutWithSidebar';

/**
 * Dashboard de Configuración
 * Página principal de configuración
 */
function Configuracion() {
  return (
    <LayoutWithSidebar>
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Configuración</h1>
        <p className="text-gray-600">Selecciona una opción del menú lateral para comenzar.</p>
      </div>
    </LayoutWithSidebar>
  );
}

export default Configuracion;
