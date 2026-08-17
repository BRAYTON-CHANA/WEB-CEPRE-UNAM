export const headerProps = {
  headerTitle: 'Convocatorias',
  headerDescription: 'Gestión de convocatorias por periodo, cursos y sedes'
};

export const getHeaderActions = (convocatoriaCrud) => [
  {
    text: 'Crear Convocatoria',
    onClick: convocatoriaCrud.handleCreate,
    font: 'bg-green-600 hover:bg-green-700 text-white'
  }
];
