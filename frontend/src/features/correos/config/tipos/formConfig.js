/**
 * Configuración de formulario para TIPOS_CORREO
 */
export const tiposCorreoFormFields = [
  {
    name: 'NOMBRE_TIPO',
    type: 'text',
    label: 'Nombre del Tipo',
    required: true,
    placeholder: 'Ej: notificacion, anuncio'
  },
  {
    name: 'DESCRIPCION',
    type: 'textarea',
    label: 'Descripción',
    required: false,
    placeholder: 'Breve descripción del tipo de correo'
  },
  {
    name: 'ENVIO_AUTOMATICO',
    type: 'boolean',
    label: 'Envío Automático',
    required: false,
    defaultValue: false
  },
  {
    name: 'MULTI_USUARIO',
    type: 'boolean',
    label: 'Multi Usuario',
    required: false,
    defaultValue: false
  },
  {
    name: 'ACTIVO',
    type: 'boolean',
    label: 'Activo',
    required: false,
    defaultValue: true
  }
];

export const tiposCorreoMultiStep = {
  showDots: true,
  persistData: false,
  nextText: 'Siguiente',
  prevText: 'Atrás',
  submitText: 'Guardar Tipo'
};

export const tiposCorreoValidation = {
  NOMBRE_TIPO: {
    required: { value: true, message: 'El nombre del tipo es obligatorio' },
    pattern: /^[a-z_]+$/,
    message: 'Solo se permiten letras minúsculas y guiones bajos'
  }
};

export const tiposCorreoModalConfig = {
  createTitle: 'Crear Tipo de Correo',
  editTitle: 'Editar Tipo de Correo',
  deleteTitle: '¿Eliminar tipo de correo?',
  deleteMessage: (row) => `¿Estás seguro de que deseas eliminar el tipo de correo "${row?.NOMBRE_TIPO}"?`,
  widthClass: 'w-1/2'
};
