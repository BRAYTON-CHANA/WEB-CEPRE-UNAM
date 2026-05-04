export const headerProps = {
  headerTitle: 'Planes Académicos',
  headerDescription: 'Gestión de planes académicos y sus cursos por área'
};

export const getHeaderActions = (crud) => [
  {
    text: 'Crear Plan',
    onClick: () => crud.handleCreate(),
    font: 'bg-green-600 hover:bg-green-700 text-white'
  }
];
