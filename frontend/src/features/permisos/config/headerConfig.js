/**
 * Configuración del header de página para Permisos
 */
export const headerProps = {
  headerTitle: 'Gestión de Permisos',
  headerDescription: 'Administra los permisos del sistema (recurso:acción)',
  titleClassName: '',
  descriptionClassName: ''
};

export const getHeaderActions = (permisosCrud) => [
  {
    text: 'Crear Permiso',
    onClick: permisosCrud.handleCreate,
    font: 'bg-green-600 hover:bg-green-700 text-white'
  }
];
