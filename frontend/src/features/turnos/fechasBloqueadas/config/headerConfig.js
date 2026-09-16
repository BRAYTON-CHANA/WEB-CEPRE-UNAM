export const headerProps = {
  headerTitle: 'Fechas Bloqueadas',
  headerDescription: 'Administra las fechas no lectivas por período'
};

export const getHeaderActions = ({ handleCreate }) => [
  {
    text: 'Crear Fecha Bloqueada',
    onClick: handleCreate,
    font: 'bg-green-600 hover:bg-green-700 text-white'
  }
];
