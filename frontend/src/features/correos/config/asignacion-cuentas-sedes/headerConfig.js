/**
 * Configuración del header de página para Asignación Cuentas x Sede
 */
export const headerProps = {
  headerTitle: 'Asignación Cuentas x Sede',
  headerDescription: 'Asigna cuentas SMTP a tipos de correo y sedes',
  titleClassName: '',
  descriptionClassName: ''
};

export const getHeaderActions = (asignacionCrud) => [
  {
    text: 'Crear Asignación',
    onClick: asignacionCrud.handleCreate,
    font: 'bg-green-600 hover:bg-green-700 text-white'
  }
];
