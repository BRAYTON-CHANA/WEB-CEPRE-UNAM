/**
 * Configuración de formulario para CORREOS
 */
export const correosFormFields = [
  {
    name: 'TIPO',
    hidden: { and: [{ field: 'ESTADO', op: '=', value: 'enviado' }] },
    type: 'reference-select',
    label: 'Tipo de Correo',
    required: true,
    referenceTable: 'TIPOS_CORREO',
    referenceField: 'NOMBRE_TIPO',
    referenceLabelField: 'NOMBRE_TIPO',
    referenceQuery: '{NOMBRE_TIPO}',
    placeholder: 'Seleccione un tipo de correo'
  },
  {
    name: 'ID_USUARIOS',
    hidden: { and: [{ field: 'ESTADO', op: '=', value: 'enviado' }] },
    type: 'reference-array',
    label: 'Usuarios Destinatarios',
    referenceTable: 'USUARIOS',
    referenceField: 'ID_USUARIO',
    referenceLabelField: 'NOMBRES',
    referenceQuery: '{APELLIDO_PATERNO} {APELLIDO_MATERNO} {NOMBRES}',
    searchable: true,
    placeholder: 'Seleccionar usuarios...',
    required: false,
    showRefreshButton: true
  },
  {
    name: 'CC',
    hidden: { and: [{ field: 'ESTADO', op: '=', value: 'enviado' }] },
    type: 'reference-array',
    label: 'CC (Copia)',
    referenceTable: 'USUARIOS',
    referenceField: 'EMAIL',
    referenceLabelField: 'EMAIL',
    referenceQuery: '{APELLIDO_PATERNO} {APELLIDO_MATERNO} {NOMBRES} - {EMAIL}',
    searchable: true,
    placeholder: 'Seleccionar correos CC...',
    required: false,
    showRefreshButton: true
  },
  {
    name: 'ASUNTO',
    hidden: { and: [{ field: 'ESTADO', op: '=', value: 'enviado' }] },
    type: 'text',
    label: 'Asunto',
    required: false,
    placeholder: 'Ej: Notificación de apertura de inscripciones'
  },
  {
    name: 'CUERPO_HTML',
    hidden: { and: [{ field: 'ESTADO', op: '=', value: 'enviado' }] },
    type: 'textarea',
    label: 'Cuerpo HTML',
    required: true,
    placeholder: 'Contenido HTML del correo'
  },
  {
    name: 'CUERPO_TEXTO',
    hidden: { and: [{ field: 'ESTADO', op: '=', value: 'enviado' }] },
    type: 'textarea',
    label: 'Cuerpo Texto',
    required: false,
    placeholder: 'Versión en texto plano (opcional)'
  },
  {
    name: 'ESTADO',
    hidden: { and: [{ field: 'ESTADO', op: '=', value: 'enviado' }] },
    type: 'select',
    label: 'Estado',
    required: true,
    options: [
      { value: 'pendiente', label: 'Pendiente' },
      { value: 'enviado', label: 'Enviado' },
      { value: 'cancelado', label: 'Cancelado' },
      { value: 'fallido', label: 'Fallido' }
    ],
    defaultValue: 'pendiente'
  },
  {
    name: 'PRIORIDAD',
    hidden: { and: [{ field: 'ESTADO', op: '=', value: 'enviado' }] },
    type: 'select',
    label: 'Prioridad',
    required: true,
    options: [
      { value: 'alta', label: 'Alta' },
      { value: 'normal', label: 'Normal' },
      { value: 'baja', label: 'Baja' }
    ],
    defaultValue: 'normal'
  },
  {
    name: 'FECHA_PROGRAMADA',
    hidden: { and: [{ field: 'ESTADO', op: '=', value: 'enviado' }] },
    type: 'datetime',
    label: 'Fecha Programada',
    required: false,
    placeholder: 'Seleccione fecha y hora de envío'
  },
  {
    name: 'ENVIO_AUTOMATICO',
    hidden: { and: [{ field: 'ESTADO', op: '=', value: 'enviado' }] },
    type: 'boolean',
    label: 'Envío Automático',
    required: false,
    defaultValue: false
  },
  {
    name: 'BLOQUEADO',
    hidden: { and: [{ field: 'ESTADO', op: '=', value: 'enviado' }] },
    type: 'boolean',
    label: 'Bloqueado',
    required: false,
    defaultValue: false
  },
  {
    name: 'PERSONALIZADO',
    hidden: { and: [{ field: 'ESTADO', op: '=', value: 'enviado' }] },
    type: 'boolean',
    label: 'Personalizado',
    required: false,
    defaultValue: false
  },
  {
    name: 'OBSERVACIONES',
    type: 'textarea',
    label: 'Observaciones',
    required: false,
    placeholder: 'Notas o comentarios del correo'
  }
];

export const correosMultiStep = {
  showDots: true,
  persistData: false,
  nextText: 'Siguiente',
  prevText: 'Atrás',
  submitText: 'Guardar Correo'
};

export const correosValidation = {
  TIPO: {
    required: { value: true, message: 'El tipo de correo es obligatorio' }
  },
  CUERPO_HTML: {
    required: { value: true, message: 'El cuerpo HTML es obligatorio' }
  },
  ESTADO: {
    required: { value: true, message: 'El estado es obligatorio' }
  },
  PRIORIDAD: {
    required: { value: true, message: 'La prioridad es obligatoria' }
  }
};

export const correosModalConfig = {
  createTitle: 'Crear Nuevo Correo',
  editTitle: 'Editar Correo',
  deleteTitle: '¿Eliminar correo?',
  deleteMessage: (row) => `¿Estás seguro de que deseas eliminar el correo "${row?.ASUNTO}"?`,
  widthClass: 'w-1/2',
  size: 'lg'
};
