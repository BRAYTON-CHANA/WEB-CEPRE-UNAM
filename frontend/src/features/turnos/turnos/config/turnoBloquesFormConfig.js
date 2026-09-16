/**
 * Configuración de formulario para TURNO_BLOQUES
 */
export const turnoBloqueBaseFields = [
  {
    name: 'ID_TURNO',
    type: 'reference-select',
    label: 'Turno',
    required: true,
    referenceTable: 'VW_TURNOS',
    referenceField: 'ID_TURNO',
    referenceQuery: '{NOMBRE_TURNO} · {NOMBRE_SEDE}',
    referenceFilters: [
      { field: 'ACTIVO', op: '=', value: 1 }
    ],
    placeholder: 'Seleccione un turno'
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
      { value: 'break', label: 'Recreo' }
    ],
    defaultValue: 'clase'
  },
  {
    name: 'ETIQUETA',
    type: 'text',
    label: 'Etiqueta',
    required: false,
    placeholder: 'Ej: Bloque 1, Descanso, etc.'
  }
];

export const turnoBloqueMultiStep = {
  showDots: true,
  persistData: false,
  nextText: 'Siguiente',
  prevText: 'Atrás',
  submitText: 'Guardar Bloque'
};

export const turnoBloqueValidation = {
  ID_TURNO: {
    required: { value: true, message: 'Debe seleccionar un turno' }
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

export const turnoBloqueModalConfig = {
  createTitle: 'Crear Nuevo Bloque',
  editTitle: 'Editar Bloque',
  deleteTitle: '¿Eliminar bloque?',
  deleteMessage: (row) => `¿Estás seguro de que deseas eliminar el bloque "${row.ETIQUETA || row.TIPO_BLOQUE}"?`,
  widthClass: 'w-1/2',
  size: 'md'
};
