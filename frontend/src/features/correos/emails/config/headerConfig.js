/**
 * Configuración del header de página para Correos
 */
export const headerProps = {
  headerTitle: 'Gestión de Correos',
  headerDescription: 'Administra los correos electrónicos: notificaciones, anuncios y masivos',
  titleClassName: '',
  descriptionClassName: ''
};

export const getHeaderActions = (correosCrud, onCompose) => [
  {
    text: 'Redactar Correo',
    onClick: onCompose || correosCrud.handleCreate,
    font: 'bg-green-600 hover:bg-green-700 text-white'
  }
];
