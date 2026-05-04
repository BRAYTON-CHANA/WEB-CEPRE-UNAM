/**
 * Configuración de formulario para ÁREAS
 */
export const areasFormFields = [
  
  {
    name: "CODIGO_AREA",
    type : 'text',
    label : 'Codigo de area',
    required: true,
    placeholder: 'Ej: SAL,SOCI'
  },
  {
    name: 'NOMBRE_AREA',
    type: 'text',
    label: 'Nombre de Área',
    required: true,
    placeholder: 'Ej: Matemáticas, Ciencias Sociales, etc.'
  }

];

export const areasMultiStep = {
  showDots: true,
  persistData: false,
  nextText: 'Siguiente',
  prevText: 'Atrás',
  submitText: 'Guardar Área'
};

export const areasValidation = {
  NOMBRE_AREA: {
    required: { value: true, message: 'El nombre del área es obligatorio' }
  },
  CODIGO_AREA: {
    required: { value: true, message: 'El codigo del área es obligatorio' }
  }
};

export const areasModalConfig = {
  createTitle: 'Crear Nueva Área',
  editTitle: 'Editar Área',
  deleteTitle: '¿Eliminar área?',
  deleteMessage: (row) => `¿Estás seguro de que deseas eliminar el área "${row?.NOMBRE_AREA}"?`,
  widthClass: 'w-1/2'
};
