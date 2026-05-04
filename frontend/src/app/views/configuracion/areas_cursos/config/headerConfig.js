/**
 * Configuración del header de página para Áreas y Cursos
 */
export const headerProps = {
  headerTitle: 'Gestión de Áreas y Cursos',
  headerDescription: 'Administra las áreas académicas y los cursos asignados a cada área',
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
