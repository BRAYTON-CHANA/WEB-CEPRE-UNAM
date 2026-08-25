/**
 * Configuración de formulario para USUARIOS
 */
export const usuariosFormFields = [
  // ── Identidad ──
  {
    name: 'DNI',
    type: 'text',
    label: 'DNI',
    required: true,
    placeholder: '8 dígitos',
    maxLength: 8,
    colSpan: 1
  },
  {
    name: 'APELLIDO_PATERNO',
    type: 'text',
    label: 'Apellido Paterno',
    required: true,
    placeholder: 'Ej: Pérez',
    colSpan: 1
  },
  {
    name: 'APELLIDO_MATERNO',
    type: 'text',
    label: 'Apellido Materno',
    required: false,
    placeholder: 'Ej: García',
    colSpan: 1
  },
  {
    name: 'NOMBRES',
    type: 'text',
    label: 'Nombres',
    required: true,
    placeholder: 'Ej: Juan Carlos',
    colSpan: 2
  },
  {
    name: 'SEXO',
    type: 'select',
    label: 'Sexo',
    required: false,
    options: [
      { value: 'M', label: 'Masculino' },
      { value: 'F', label: 'Femenino' }
    ],
    colSpan: 1
  },
  // ── Contacto ──
  {
    name: 'EMAIL',
    type: 'text',
    label: 'Email',
    required: true,
    placeholder: 'ejemplo@correo.com',
    colSpan: 2
  },
  {
    name: 'TELEFONO',
    type: 'text',
    label: 'Teléfono',
    required: false,
    placeholder: 'Ej: 987654321',
    colSpan: 1
  },
  {
    name: 'TELEFONO_OPCIONAL',
    type: 'text',
    label: 'Teléfono Opcional',
    required: false,
    placeholder: 'Ej: 987654321',
    colSpan: 1
  },
  // ── Nacimiento ──
  {
    name: 'FECHA_NACIMIENTO',
    type: 'date',
    label: 'Fecha de Nacimiento',
    required: false,
    colSpan: 2
  },
  // ── Ubicación ──
  {
    name: 'DIRECCION',
    type: 'text',
    label: 'Dirección',
    required: false,
    placeholder: 'Ej: Av. Principal 123',
    colSpan: 3
  },
  {
    name: 'DEPARTAMENTO',
    type: 'text',
    label: 'Departamento',
    required: false,
    placeholder: 'Ej: Lima',
    colSpan: 1
  },
  {
    name: 'PROVINCIA',
    type: 'text',
    label: 'Provincia',
    required: false,
    placeholder: 'Ej: Lima',
    colSpan: 1
  },
  {
    name: 'DISTRITO',
    type: 'text',
    label: 'Distrito',
    required: false,
    placeholder: 'Ej: Miraflores',
    colSpan: 1
  },
  {
    name: 'REF_DOM',
    type: 'text',
    label: 'Referencia de Domicilio',
    required: false,
    placeholder: 'Ej: Frente al parque',
    colSpan: 3
  },
  // ── Discapacidad ──
  {
    name: 'DISCAPACIDAD',
    type: 'boolean',
    label: 'Tiene Discapacidad',
    required: false,
    defaultValue: false,
    colSpan: 1
  },
  {
    name: 'TIPO_DISCAPACIDAD',
    type: 'text',
    label: 'Tipo de Discapacidad',
    required: false,
    placeholder: 'Ej: Visual',
    colSpan: 1
  },
  {
    name: 'NRO_CONADIS',
    type: 'text',
    label: 'N° CONADIS',
    required: false,
    placeholder: 'Ej: 1234567',
    colSpan: 1
  },
  // ── DNI documento ──
  {
    name: 'DNI_ARCHIVO',
    type: 'file',
    label: 'Archivo de DNI',
    accept: '.pdf',
    maxSize: 10 * 1024 * 1024,
    singleFile: true,
    showPreview: true,
    allowDragDrop: true,
    ignoreField: true,
    colSpan: 3
  },
  {
    name: 'DNI_FECHA_VENCIMIENTO',
    type: 'date',
    label: 'Vencimiento del DNI',
    required: false,
    colSpan: 3
  },
  // ── Roles ──
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
    showRefreshButton: true,
    colSpan: 3
  }
];

/**
 * Layout del formulario de usuarios: 3 columnas
 */
export const usuariosFormLayout = {
  type: 'single',
  columns: 3
};

export const usuariosValidation = {
  DNI: {
    required: { value: true, message: 'El DNI es obligatorio' }
  },
  APELLIDO_PATERNO: {
    required: { value: true, message: 'El apellido paterno es obligatorio' }
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
  deleteMessage: (row) => `¿Estás seguro de que deseas eliminar al usuario "${row?.NOMBRE_COMPLETO || row?.NOMBRES}"?`,
  widthClass: 'w-1/2',
  size: '2xl'
};
