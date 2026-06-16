/**
 * Configuración del header para la página Horarios (Plantillas)
 */
export const headerProps = {
  headerTitle: 'Gestión de Horarios (Plantillas)',
  headerDescription: 'Administra plantillas de horarios y sus bloques de tiempo'
};

export const getHeaderActions = (horariosCrud) => [
  {
    text: 'Crear Horario',
    onClick: horariosCrud.handleCreate,
    font: 'bg-green-600 hover:bg-green-700 text-white'
  }
];
