/**
 * Configuración de formulario para PASSWORD_RESET_CODES
 */
export const passwordResetFormFields = [
  {
    name: 'DNI',
    type: 'text',
    label: 'DNI',
    required: true,
    placeholder: 'Ej: 12345678',
    maxLength: 8
  },
  {
    name: 'EMAIL',
    type: 'email',
    label: 'Correo Electrónico',
    required: true,
    placeholder: 'Ej: usuario@unam.edu.pe'
  },
  {
    name: 'CODIGO',
    type: 'text',
    label: 'Código de 6 Dígitos',
    required: true,
    placeholder: 'Ej: 123456',
    maxLength: 6
  },
  {
    name: 'EXPIRA_EN',
    type: 'datetime',
    label: 'Fecha de Expiración',
    required: true,
    placeholder: 'Seleccione fecha y hora de expiración'
  },
  {
    name: 'USADO',
    type: 'boolean',
    label: 'Usado',
    required: false,
    defaultValue: false
  },
  {
    name: 'FECHA_USO',
    type: 'datetime',
    label: 'Fecha de Uso',
    required: false,
    placeholder: 'Fecha en que se usó el código'
  },
  {
    name: 'ID_CORREO',
    type: 'reference-select',
    label: 'Correo Relacionado',
    required: false,
    referenceTable: 'VW_CORREOS',
    referenceField: 'ID_CORREO',
    referenceLabelField: 'ASUNTO',
    referenceQuery: '{ASUNTO}',
    placeholder: 'Seleccione un correo relacionado'
  }
];

export const passwordResetMultiStep = {
  showDots: true,
  persistData: false,
  nextText: 'Siguiente',
  prevText: 'Atrás',
  submitText: 'Guardar Código'
};

export const passwordResetValidation = {
  DNI: {
    required: { value: true, message: 'El DNI es obligatorio' },
    pattern: /^[0-9]{8}$/,
    message: 'El DNI debe tener 8 dígitos numéricos'
  },
  EMAIL: {
    required: { value: true, message: 'El correo es obligatorio' },
    email: { value: true }
  },
  CODIGO: {
    required: { value: true, message: 'El código es obligatorio' },
    pattern: /^[0-9]{6}$/,
    message: 'El código debe tener 6 dígitos numéricos'
  },
  EXPIRA_EN: {
    required: { value: true, message: 'La fecha de expiración es obligatoria' }
  }
};

export const passwordResetModalConfig = {
  createTitle: 'Crear Código de Reset',
  editTitle: 'Editar Código de Reset',
  deleteTitle: '¿Eliminar código de reset?',
  deleteMessage: (row) => `¿Estás seguro de que deseas eliminar el código de reset para "${row?.EMAIL}"?`,
  widthClass: 'w-1/2',
  size: 'md'
};
