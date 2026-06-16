/**
 * Configuración de formulario para DOCENTES
 */
export const docentesFormFields = [
  {
    name: 'DNI',
    type: 'text',
    label: 'DNI',
    required: true,
    placeholder: '8 dígitos numéricos',
    maxLength: 8
  },
  {
    name: 'NOMBRES',
    type: 'text',
    label: 'Nombres',
    required: true,
    placeholder: 'Nombres'
  },
  {
    name: 'APELLIDOS',
    type: 'text',
    label: 'Apellidos',
    required: true,
    placeholder: 'Apellidos'
  },
  {
    name: 'TIPO_DOCENTE',
    type: 'select',
    label: 'Tipo de Docente',
    required: true,
    options: [
      { value: 'ordinario', label: 'Ordinario' },
      { value: 'servicio', label: 'Servicio' }
    ],
    defaultValue: 'servicio'
  },
  {
    name: 'INICIO_ORDINARIO',
    type: 'date',
    label: 'Inicio de Servicio',
    required: true,
    hidden: {
      and: [
        { field: 'TIPO_DOCENTE', op: '=', value: 'servicio' }
      ]
    },
    hiddenValue: ''
  },
  {
    name: 'TERMINO_ORDINARIO',
    type: 'date',
    label: 'Término de Servicio',
    required: false,
    hidden: {
      and: [
        { field: 'TIPO_DOCENTE', op: '=', value: 'servicio' }
      ]
    },
    hiddenValue: ''
  },
  {
    name: 'TELEFONO',
    type: 'text',
    label: 'Teléfono',
    required: false,
    placeholder: 'Número de contacto'
  },
  {
    name: 'EMAIL',
    type: 'email',
    label: 'Email',
    required: false,
    placeholder: 'correo@ejemplo.com'
  },
  {
    name: 'ACTIVO',
    type: 'boolean',
    label: 'Activo',
    required: false,
    defaultValue: true
  }
];

export const docentesMultiStep = {
  showDots: true,
  persistData: false,
  nextText: 'Siguiente',
  prevText: 'Atrás',
  submitText: 'Guardar Docente'
};

export const docentesValidation = {
  DNI: {
    required: { value: true, message: 'El DNI es obligatorio' },
    pattern: { value: /^\d{8}$/, message: 'El DNI debe tener 8 dígitos numéricos' }
  },
  NOMBRES: {
    required: { value: true, message: 'Los nombres son obligatorios' }
  },
  APELLIDOS: {
    required: { value: true, message: 'Los apellidos son obligatorios' }
  },
  TIPO_DOCENTE: {
    required: { value: true, message: 'Debe seleccionar un tipo de docente' }
  }
};

export const docentesModalConfig = {
  createTitle: 'Crear Nuevo Docente',
  editTitle: 'Editar Docente',
  deleteTitle: '¿Eliminar docente?',
  deleteMessage: (row) => `¿Estás seguro de que deseas eliminar al docente "${row?.NOMBRE_COMPLETO_DOCENTE || row?.NOMBRES + ' ' + row?.APELLIDOS}"?`,
  widthClass: 'w-1/2'
};
