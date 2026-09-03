import React from 'react';
import PermisosPanel from '@/features/permisos/views/PermisosPanel';

/**
 * Configuración de PERMISOS (read-only)
 * Punto de entrada que delega al panel en features/permisos/views.
 */
function PermisosConfig() {
  return <PermisosPanel />;
}

export default PermisosConfig;
