/**
 * Configuración del header de página para Docentes y Cursos
 */
export const headerProps = {
  headerTitle: 'Gestión de Docentes y Cursos',
  headerDescription: 'Administra los docentes y los cursos que pueden enseñar',
  titleClassName: '',
  descriptionClassName: ''
};

export const getHeaderActions = (docentesCrud) => [
  {
    text: 'Crear Docente',
    onClick: docentesCrud.handleCreate,
    font: 'bg-green-600 hover:bg-green-700 text-white'
  }
];
