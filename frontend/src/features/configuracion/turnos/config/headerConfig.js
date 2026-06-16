/**
 * Configuración del header para la página Turnos
 */
export const headerProps = {
  headerTitle: 'Gestión de Turnos',
  headerDescription: 'Administra los turnos por sede y sus horarios asignados'
};

export const getHeaderActions = () => [
  // No hay botón de crear a nivel global; los turnos se crean desde cada sede
];
