export const headerProps = {
  headerTitle: 'Gestión de Feriados',
  headerDescription: 'Administra los días feriados por período académico'
};

export const getHeaderActions = ({ handleCreate }) => [
  {
    text: 'Crear Feriado',
    onClick: handleCreate,
    font: 'bg-green-600 hover:bg-green-700 text-white'
  }
];
