/**
 * Configuración del header de página para Carreras
 */
export const headerProps = {
  headerTitle: 'Gestión de Carreras',
  headerDescription: 'Administra las carreras académicas del CEPRE',
  titleClassName: '',
  descriptionClassName: ''
};

export const getHeaderActions = (carrerasCrud) => [
  {
    text: 'Crear Carrera',
    onClick: carrerasCrud.handleCreate,
    font: 'bg-green-600 hover:bg-green-700 text-white'
  }
];
