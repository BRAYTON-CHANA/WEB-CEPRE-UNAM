/**
 * Configuración del header de página para Áreas
 */
export const headerProps = {
  headerTitle: 'Gestión de Áreas',
  headerDescription: 'Administra las áreas académicas del CEPRE',
  titleClassName: '',
  descriptionClassName: ''
};

export const getHeaderActions = (areasCrud) => [
  {
    text: 'Crear Área',
    onClick: areasCrud.handleCreate,
    font: 'bg-green-600 hover:bg-green-700 text-white'
  }
];
