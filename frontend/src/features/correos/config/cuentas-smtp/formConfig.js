/**
 * Configuración de formulario para CUENTAS_SMTP
 * Nota: SMTP_PASSWORD es un campo virtual que el backend cifra antes de guardar.
 */
export const cuentasSmtpFormFields = [
  {
    name: 'NOMBRE_CUENTA',
    type: 'text',
    label: 'Nombre de la Cuenta',
    required: true,
    placeholder: 'Ej: Cuenta Oficial UNAM'
  },
  {
    name: 'SMTP_HOST',
    type: 'text',
    label: 'Host SMTP',
    required: true,
    placeholder: 'Ej: smtp.office365.com'
  },
  {
    name: 'SMTP_PORT',
    type: 'integer',
    label: 'Puerto SMTP',
    required: true,
    defaultValue: 587,
    min: 1,
    max: 65535
  },
  {
    name: 'SMTP_USER',
    type: 'text',
    label: 'Usuario SMTP',
    required: true,
    placeholder: 'Ej: correo@unam.edu.pe'
  },
  {
    name: 'SMTP_PASSWORD',
    type: 'password',
    label: 'Contraseña SMTP',
    required: true,
    placeholder: 'Contraseña del correo saliente'
  },
  {
    name: 'SMTP_FROM',
    type: 'text',
    label: 'Correo Remitente',
    required: true,
    placeholder: 'Ej: correo@unam.edu.pe'
  },
  {
    name: 'ACTIVO',
    type: 'boolean',
    label: 'Activo',
    required: false,
    defaultValue: true
  }
];

export const cuentasSmtpMultiStep = {
  showDots: true,
  persistData: false,
  nextText: 'Siguiente',
  prevText: 'Atrás',
  submitText: 'Guardar Cuenta SMTP'
};

export const cuentasSmtpValidation = {
  NOMBRE_CUENTA: {
    required: { value: true, message: 'El nombre de la cuenta es obligatorio' }
  },
  SMTP_HOST: {
    required: { value: true, message: 'El host SMTP es obligatorio' }
  },
  SMTP_PORT: {
    required: { value: true, message: 'El puerto SMTP es obligatorio' },
    min: { value: 1, message: 'El puerto debe ser mayor a 0' },
    max: { value: 65535, message: 'El puerto no puede ser mayor a 65535' }
  },
  SMTP_USER: {
    required: { value: true, message: 'El usuario SMTP es obligatorio' }
  },
  SMTP_PASSWORD: {
    required: { value: true, message: 'La contraseña SMTP es obligatoria' }
  },
  SMTP_FROM: {
    required: { value: true, message: 'El correo remitente es obligatorio' }
  }
};

export const cuentasSmtpModalConfig = {
  createTitle: 'Crear Cuenta SMTP',
  editTitle: 'Editar Cuenta SMTP',
  deleteTitle: '¿Eliminar cuenta SMTP?',
  deleteMessage: (row) => `¿Estás seguro de que deseas eliminar la cuenta SMTP "${row?.NOMBRE_CUENTA}"?`,
  widthClass: 'w-1/2'
};
