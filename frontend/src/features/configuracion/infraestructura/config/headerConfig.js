/**
 * Configuración del header para la página Sedes y Aulas
 */
export const headerProps = {
  headerTitle: 'Infraestructura',
  headerDescription: 'Administra las sedes académicas e infraestructura física, virtual e híbrida'
};

export const getHeaderActions = (sedesCrud) => [
  {
    text: 'Crear Sede',
    onClick: sedesCrud.handleCreate,
    font: 'bg-green-600 hover:bg-green-700 text-white'
  }
];
