export const MASIVO_VIEWS = [
  {
    view: 'VW_USUARIOS',
    label: 'Usuarios',
    idField: 'ID_USUARIO',
    emailField: 'EMAIL',
    labelTemplate: '{NOMBRE_COMPLETO} - {EMAIL}',
    descriptionField: 'EMAIL',
    autoMergeFields: true,
    // Fallback: se usa si falla la carga dinámica del schema.
    mergeFields: [
      { field: 'NOMBRE_COMPLETO', label: 'Nombre completo' },
      { field: 'APELLIDO_PATERNO', label: 'Apellido paterno' },
      { field: 'APELLIDO_MATERNO', label: 'Apellido materno' },
      { field: 'NOMBRES', label: 'Nombres' },
      { field: 'DNI', label: 'DNI' },
      { field: 'FECHA_NACIMIENTO', label: 'Fecha de nacimiento' },
      { field: 'EDAD', label: 'Edad' },
      { field: 'SEXO', label: 'Sexo' },
      { field: 'EMAIL', label: 'Email' },
      { field: 'TELEFONO', label: 'Teléfono' },
      { field: 'DIRECCION', label: 'Dirección' },
      { field: 'UBICACION_COMPLETA', label: 'Ubicación' },
      { field: 'DISCAPACIDAD_DESC', label: 'Discapacidad' },
    ],
  },
];
