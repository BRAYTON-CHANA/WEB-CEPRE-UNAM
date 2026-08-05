/**
 * Configuración del header de página para Correos
 */
export const headerProps = {
  headerTitle: 'Gestión de Correos',
  headerDescription: 'Administra los correos electrónicos: notificaciones, anuncios y masivos',
  titleClassName: '',
  descriptionClassName: ''
};

export const getHeaderActions = (correosCrud) => [
  {
    text: 'Crear Correo',
    onClick: correosCrud.handleCreate,
    font: 'bg-green-600 hover:bg-green-700 text-white'
  }
];
