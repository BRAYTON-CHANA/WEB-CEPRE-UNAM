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
    type: 'select',
    label: 'Proveedor SMTP',
    required: true,
    options: [
      { value: 'smtp.office365.com', label: 'Outlook / Office 365' },
      { value: 'smtp.gmail.com', label: 'Gmail' }
    ],
    placeholder: 'Seleccione un proveedor'
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
  SMTP_USER: {
    required: { value: true, message: 'El usuario SMTP es obligatorio' }
  },
  SMTP_PASSWORD: {
    required: { value: true, message: 'La contraseña SMTP es obligatoria' }
  },
};

export const cuentasSmtpModalConfig = {
  createTitle: 'Crear Cuenta SMTP',
  editTitle: 'Editar Cuenta SMTP',
  deleteTitle: '¿Eliminar cuenta SMTP?',
  deleteMessage: (row) => `¿Estás seguro de que deseas eliminar la cuenta SMTP "${row?.NOMBRE_CUENTA}"?`,
  widthClass: 'w-1/2'
};
