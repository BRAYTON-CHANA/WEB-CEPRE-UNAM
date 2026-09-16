export const headerProps = {
  headerTitle: 'Turnos',
  headerDescription: 'Horarios concretos por período'
};

export const getHeaderActions = ({ handleCreate }) => [
  {
    text: 'Crear Turno',
    onClick: handleCreate,
    font: 'bg-green-600 hover:bg-green-700 text-white'
  }
];
