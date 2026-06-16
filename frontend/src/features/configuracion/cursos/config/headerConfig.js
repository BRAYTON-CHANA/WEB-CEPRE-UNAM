/**
 * Configuración del header de página para Cursos
 */
export const headerProps = {
  headerTitle: 'Gestión de Cursos',
  headerDescription: 'Administra los cursos académicos del CEPRE',
  titleClassName: '',
  descriptionClassName: ''
};

export const getHeaderActions = (cursosCrud) => [
  {
    text: 'Crear Curso',
    onClick: cursosCrud.handleCreate,
    font: 'bg-green-600 hover:bg-green-700 text-white'
  }
];
