/**
 * Configuración del header de página para Usuarios
 */
export const headerProps = {
  headerTitle: 'Gestión de Usuarios',
  headerDescription: 'Administra los usuarios del sistema y sus roles',
  titleClassName: '',
  descriptionClassName: ''
};

export const getHeaderActions = (usuariosCrud) => [
  {
    text: 'Crear Usuario',
    onClick: usuariosCrud.handleCreate,
    font: 'bg-green-600 hover:bg-green-700 text-white'
  }
];
