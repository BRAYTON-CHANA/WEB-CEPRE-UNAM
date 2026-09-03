export const headerProps = {
  headerTitle: 'Grupos',
  headerDescription: 'Gestión de grupos por periodo y sede'
};

// Botón global "Crear Grupo" — la creación también se puede hacer desde el botón "+" en cada sede
export const getHeaderActions = (gruposCrud) => [
  {
    text: 'Crear Grupo',
    onClick: gruposCrud.handleCreate,
    font: 'bg-green-600 hover:bg-green-700 text-white'
  }
];
