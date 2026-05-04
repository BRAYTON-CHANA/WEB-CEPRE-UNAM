export const headerProps = {
  headerTitle: 'Gestión de Periodos',
  headerDescription: 'Administra los periodos académicos del CEPRE'
};

export const getHeaderActions = (periodosCrud) => [
  {
    text: 'Crear Periodo',
    onClick: periodosCrud.handleCreate,
    font: 'bg-green-600 hover:bg-green-700 text-white'
  }
];
