/**
 * Configuración de formulario para USUARIOS
 */
export const usuariosFormFields = [
  {
    name: 'DNI',
    type: 'text',
    label: 'DNI',
    required: false,
    placeholder: '8 dígitos',
    maxLength: 8
  },
  {
    name: 'APELLIDOS',
    type: 'text',
    label: 'Apellidos',
    required: true,
    placeholder: 'Ej: Pérez García'
  },
  {
    name: 'NOMBRES',
    type: 'text',
    label: 'Nombres',
    required: true,
    placeholder: 'Ej: Juan Carlos'
  },
  {
    name: 'FECHA_NACIMIENTO',
    type: 'date',
    label: 'Fecha de Nacimiento',
    required: false
  },
  {
    name: 'SEXO',
    type: 'select',
    label: 'Sexo',
    required: false,
    options: [
      { value: 'Masculino', label: 'Masculino' },
      { value: 'Femenino', label: 'Femenino' },
      { value: 'Otro', label: 'Otro' }
    ]
  },
  {
    name: 'TELEFONO',
    type: 'text',
    label: 'Teléfono',
    required: false,
    placeholder: 'Ej: 987654321'
  },
  {
    name: 'EMAIL',
    type: 'text',
    label: 'Email',
    required: true,
    placeholder: 'ejemplo@correo.com'
  },
  {
    name: 'DIRECCION',
    type: 'text',
    label: 'Dirección',
    required: false,
    placeholder: 'Ej: Av. Principal 123'
  },
  {
    name: 'ID_ROLES',
    type: 'reference-array',
    label: 'Roles Asignados',
    referenceTable: 'ROLES',
    referenceField: 'ID_ROL',
    referenceLabelField: 'NOMBRE_ROL',
    referenceFilters: [{ field: 'ES_SISTEMA', op: '=', value: false }],
    searchable: true,
    placeholder: 'Seleccionar roles...',
    required: false,
    showRefreshButton: true
  }
];

export const usuariosValidation = {
  APELLIDOS: {
    required: { value: true, message: 'Los apellidos son obligatorios' }
  },
  NOMBRES: {
    required: { value: true, message: 'Los nombres son obligatorios' }
  },
  EMAIL: {
    required: { value: true, message: 'El email es obligatorio' }
  }
};

export const usuariosModalConfig = {
  createTitle: 'Crear Nuevo Usuario',
  editTitle: 'Editar Usuario',
  deleteTitle: '¿Eliminar usuario?',
  deleteMessage: (row) => `¿Estás seguro de que deseas eliminar al usuario "${row?.NOMBRES} ${row?.APELLIDOS}"?`,
  widthClass: 'w-1/2'
};
