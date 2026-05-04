/**
 * Configuración de formulario para HORARIO_BLOQUES
 */
export const bloqueBaseFields = [
  {
    name: 'ID_HORARIO',
    type: 'reference-select',
    label: 'Horario (Plantilla)',
    required: true,
    referenceTable: 'HORARIOS',
    referenceField: 'ID_HORARIO',
    referenceQuery: '{NOMBRE_HORARIO}',
    referenceFilters: [
      { field: 'ACTIVO', op: '=', value: 1 }
    ],
    placeholder: 'Seleccione un horario'
  },
  {
    name: 'ORDEN',
    type: 'number',
    label: 'Orden',
    required: true,
    placeholder: 'Número de orden del bloque',
    min: 1
  },
  {
    name: 'DURACION',
    type: 'number',
    label: 'Duración (minutos)',
    required: true,
    placeholder: 'Duración en minutos',
    min: 1
  },
  {
    name: 'TIPO_BLOQUE',
    type: 'select',
    label: 'Tipo de Bloque',
    required: true,
    options: [
      { value: 'clase', label: 'Clase' },
      { value: 'recreo', label: 'Recreo' }
    ],
    defaultValue: 'clase'
  },
  {
    name: 'ETIQUETA',
    type: 'text',
    label: 'Etiqueta',
    required: false,
    placeholder: 'Ej: Bloque 1, Descanso, etc.'
  },
  
];

export const bloqueMultiStep = {
  showDots: true,
  persistData: false,
  nextText: 'Siguiente',
  prevText: 'Atrás',
  submitText: 'Guardar Bloque'
};

export const bloqueValidation = {
  ID_HORARIO: {
    required: { value: true, message: 'Debe seleccionar un horario' }
  },
  ORDEN: {
    required: { value: true, message: 'El orden es obligatorio' },
    min: { value: 1, message: 'El orden debe ser mayor a 0' }
  },
  DURACION: {
    required: { value: true, message: 'La duración es obligatoria' },
    min: { value: 1, message: 'La duración debe ser mayor a 0' }
  },
  TIPO_BLOQUE: {
    required: { value: true, message: 'Debe seleccionar un tipo de bloque' }
  }
};

export const bloqueModalConfig = {
  createTitle: 'Crear Nuevo Bloque',
  editTitle: 'Editar Bloque',
  deleteTitle: '¿Eliminar bloque?',
  deleteMessage: (row) => `¿Estás seguro de que deseas eliminar el bloque "${row.ETIQUETA || row.TIPO_BLOQUE}"?`,
  widthClass: 'w-1/2'
};
