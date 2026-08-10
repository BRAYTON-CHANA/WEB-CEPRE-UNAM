export const ALLOWED_MAIL_TYPES = ['notificacion', 'personalizado_masivo'];

export const MASIVO_VIEWS = [
  {
    view: 'VW_DOCENTES',
    label: 'Docentes',
    idField: 'ID_USUARIO',
    emailField: 'EMAIL',
    labelTemplate: '{APELLIDOS} {NOMBRES} - {EMAIL}',
    descriptionField: 'EMAIL',
    mergeFields: [
      { field: 'APELLIDOS', label: 'Apellidos' },
      { field: 'NOMBRES', label: 'Nombres' },
      { field: 'NOMBRE_COMPLETO', label: 'Nombre completo' },
      { field: 'DNI', label: 'DNI' },
      { field: 'EMAIL', label: 'Email' },
      { field: 'TELEFONO', label: 'Teléfono' },
      { field: 'CONDICION_LABORAL', label: 'Condición laboral' },
    ],
  },
];
