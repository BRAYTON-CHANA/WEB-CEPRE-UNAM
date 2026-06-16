/**
 * Configuración de formulario para AULAS
 */
export const aulaBaseFields = [
  {
    name: 'ID_SEDE',
    type: 'reference-select',
    label: 'Sede',
    required: true,
    referenceTable: 'SEDES',
    referenceField: 'ID_SEDE',
    referenceQuery: '{NOMBRE_SEDE}',
    referenceFilters: [
      { field: 'ACTIVO', op: '=', value: 1 }
    ],
    placeholder: 'Seleccione una sede'
  },
  {
    name: 'NOMBRE_AULA',
    type: 'text',
    label: 'Nombre del Aula',
    required: true,
    placeholder: 'Ej: Aula 101, Laboratorio 1, etc.'
  },
  {
    name: 'UBICACION',
    type: 'text',
    label: 'Ubicación',
    required: false,
    placeholder: 'Ej: Pabellón A, 1er Piso'
  },
  {
    name: 'TIPO',
    type: 'select',
    label: 'Tipo de Aula',
    required: true,
    options: [
      { value: 'presencial', label: 'Presencial' },
      { value: 'virtual', label: 'Virtual' },
      { value: 'hibrida', label: 'Híbrida' }
    ],
    defaultValue: 'presencial'
  },
  {
    name: 'ENLACE_VIRTUAL',
    type: 'text',
    label: 'Enlace Virtual',
    placeholder: 'URL para aulas virtuales o híbridas',
    blocked: {
      and: [
        { field: 'TIPO', op: '=', value: 'presencial' }
      ],
      clearOnBlock: true
    }
  },
  {
    name: 'CAPACIDAD',
    type: 'number',
    label: 'Capacidad',
    required: true,
    placeholder: 'Número de estudiantes',
    min: 1
  }
];

export const aulaMultiStep = {
  showDots: true,
  persistData: false,
  nextText: 'Siguiente',
  prevText: 'Atrás',
  submitText: 'Guardar Aula'
};

export const aulaValidation = {
  ID_SEDE: {
    required: { value: true, message: 'Debe seleccionar una sede' }
  },
  NOMBRE_AULA: {
    required: { value: true, message: 'Debe ingresar el nombre del aula' }
  },
  TIPO: {
    required: { value: true, message: 'Debe seleccionar un tipo de aula' }
  },
  CAPACIDAD: {
    required: { value: true, message: 'Debe ingresar la capacidad del aula' },
    min: { value: 1, message: 'La capacidad debe ser mayor a 0' }
  }
};

export const aulasModalConfig = {
  createTitle: 'Crear Nueva Aula',
  editTitle: 'Editar Aula',
  deleteTitle: '¿Eliminar aula?',
  deleteMessage: (row) => `¿Estás seguro de que deseas eliminar el aula "${row.NOMBRE_AULA}"?`,
  widthClass: 'w-full'
};
