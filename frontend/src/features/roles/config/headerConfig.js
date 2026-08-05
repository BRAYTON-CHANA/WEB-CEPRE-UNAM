/**
 * Configuración del header de página para Roles
 */
export const headerProps = {
  headerTitle: 'Gestión de Roles',
  headerDescription: 'Administra los roles del sistema y sus permisos',
  titleClassName: '',
  descriptionClassName: ''
};

export const getHeaderActions = (rolesCrud) => [
  {
    text: 'Crear Rol',
    onClick: rolesCrud.handleCreate,
    font: 'bg-green-600 hover:bg-green-700 text-white'
  }
];
