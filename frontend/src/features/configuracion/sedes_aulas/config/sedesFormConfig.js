/**
 * Configuración de formulario para SEDES
 */
export const sedesFormFields = [
  {
    name: 'NOMBRE_SEDE',
    type: 'text',
    label: 'Nombre de Sede',
    required: true,
    placeholder: 'Ej: Sede Central, Sede Norte, etc.'
  }
];

export const sedesMultiStep = {
  showDots: true,
  persistData: false,
  nextText: 'Siguiente',
  prevText: 'Atrás',
  submitText: 'Guardar Sede'
};

export const sedesValidation = {
  NOMBRE_SEDE: {
    required: { value: true, message: 'El nombre de la sede es obligatorio' }
  }
};

export const sedesModalConfig = {
  createTitle: 'Crear Nueva Sede',
  editTitle: 'Editar Sede',
  deleteTitle: '¿Eliminar sede?',
  deleteMessage: (row) => `¿Estás seguro de que deseas eliminar la sede "${row.NOMBRE_SEDE}"?`,
  widthClass: 'w-1/2'
};
