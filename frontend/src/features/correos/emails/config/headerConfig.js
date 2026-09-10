/**
 * Configuración del header de página para Correos
 */
export const headerProps = {
  headerTitle: 'Gestión de Correos',
  headerDescription: 'Administra los correos electrónicos: notificaciones, anuncios y masivos',
  titleClassName: '',
  descriptionClassName: ''
};

export const getHeaderActions = (correosCrud, onCompose, onPendientes) => [
  {
    text: 'Ver pendientes',
    onClick: onPendientes,
    font: 'bg-[#25346A] hover:bg-[#1c2753] text-white'
  },
  {
    text: 'Redactar Correo',
    onClick: onCompose || correosCrud.handleCreate,
    font: 'bg-green-600 hover:bg-green-700 text-white'
  }
];
