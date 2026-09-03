/**
 * Configuración de formulario para CONVOCATORIA_DOCUMENTOS_CLASIFICACION
 * Secciones (checklist) por condición laboral.
 * No incluye CONDICION_LABORAL (se maneja con checkboxes aparte).
 */
export const clasificacionFormFields = [
  {
    name: 'NOMBRE',
    type: 'text',
    label: 'Nombre de la clasificación',
    required: true,
    placeholder: 'Ej: CV, ANEXOS, etc.'
  },
  {
    name: 'OBLIGATORIO',
    type: 'switch',
    label: 'Obligatorio',
    defaultValue: false
  },
  {
    name: 'ACTIVO',
    type: 'switch',
    label: 'Activo',
    defaultValue: true
  }
];

export const clasificacionValidation = {
  NOMBRE: {
    required: { value: true, message: 'El nombre de la clasificación es requerido' }
  }
};

/**
 * Configuración de formulario para CONVOCATORIA_DOCUMENTOS
 * Plantillas asociadas a una clasificación existente.
 * No incluye CONDICION_LABORAL (viene de la clasificación).
 * No incluye OBLIGATORIO (va en la clasificación).
 * No incluye ACTIVO ni ARCHIVO (se manejan inline en la tabla).
 */
export const documentosFormFields = [
  {
    name: 'CONDICION_LABORAL',
    type: 'select',
    label: 'Condición laboral',
    required: true,
    defaultValue: 'CONTRATADO',
    options: [
      { value: 'CONTRATADO', label: 'Contratado' },
      { value: 'EXTERNO', label: 'Externo' },
      { value: 'ORDINARIO', label: 'Ordinario' }
    ]
  },
  {
    name: 'CLASIFICACION',
    type: 'unique-select',
    label: 'Clasificación',
    required: true,
    tableName: 'VW_CONVOCATORIA_DOCUMENTOS_CLASIFICACION',
    columnName: 'NOMBRE',
    allowCreate: false,
    searchable: true
  },
  {
    name: 'NOMBRE',
    type: 'text',
    label: 'Nombre',
    required: true,
    placeholder: 'Ej: Plantilla de CV, DNI escaneado, etc.'
  },
  {
    name: 'DESCRIPCION',
    type: 'textarea',
    label: 'Descripción',
    required: false,
    placeholder: 'Descripción de la plantilla'
  },
  {
    name: 'ORDEN',
    type: 'number',
    label: 'Orden',
    required: false,
    defaultValue: 0,
    placeholder: '0',
    helperText: 'Número para ordenar dentro de la clasificación (menor = primero)'
  }
];

export const documentosMultiStep = {
  showDots: true,
  persistData: false,
  nextText: 'Siguiente',
  prevText: 'Atrás',
  submitText: 'Guardar Documento'
};

export const documentosValidation = {
  CONDICION_LABORAL: {
    required: { value: true, message: 'Debe seleccionar una condición laboral' }
  },
  CLASIFICACION: {
    required: { value: true, message: 'La clasificación es requerida' }
  },
  NOMBRE: {
    required: { value: true, message: 'El nombre es requerido' }
  }
};

export const documentosModalConfig = {
  createTitle: 'Crear Nuevo Documento',
  editTitle: 'Editar Documento',
  deleteTitle: '¿Eliminar documento?',
  deleteMessage: (row) => `¿Estás seguro de que deseas eliminar el documento "${row?.NOMBRE}"?`,
  widthClass: 'w-1/2',
  size: 'md'
};
