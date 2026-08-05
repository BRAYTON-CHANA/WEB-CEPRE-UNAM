/**
 * Configuración del header de página para Tipos de Correo
 */
export const headerProps = {
  headerTitle: 'Tipos de Correo',
  headerDescription: 'Administra los tipos de correo disponibles en el sistema',
  titleClassName: '',
  descriptionClassName: ''
};

export const getHeaderActions = (tiposCorreoCrud) => [
  {
    text: 'Crear Tipo de Correo',
    onClick: tiposCorreoCrud.handleCreate,
    font: 'bg-green-600 hover:bg-green-700 text-white'
  }
];
