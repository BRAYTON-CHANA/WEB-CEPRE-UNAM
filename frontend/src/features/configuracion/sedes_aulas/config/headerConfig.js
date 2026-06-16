/**
 * Configuración del header para la página Sedes y Aulas
 */
export const headerProps = {
  headerTitle: 'Gestión de Sedes y Aulas',
  headerDescription: 'Administra las sedes académicas y sus aulas físicas, virtuales e híbridas'
};

export const getHeaderActions = (sedesCrud) => [
  {
    text: 'Crear Sede',
    onClick: sedesCrud.handleCreate,
    font: 'bg-green-600 hover:bg-green-700 text-white'
  }
];
