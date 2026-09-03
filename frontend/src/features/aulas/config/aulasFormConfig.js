/**
 * Configuración de formulario para AULAS
 * Layout: 2 columnas con colSpan para distribuir los campos
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
    placeholder: 'Seleccione una sede',
    colSpan: 2
  },
  {
    name: 'NOMBRE_AULA',
    type: 'text',
    label: 'Nombre del Aula',
    required: true,
    placeholder: 'Ej: Aula 101, Laboratorio 1, etc.',
    colSpan: 1
  },
  {
    name: 'UBICACION',
    type: 'text',
    label: 'Ubicación',
    required: false,
    placeholder: 'Ej: Pabellón A, 1er Piso',
    colSpan: 1
  },
  {
    name: 'CAPACIDAD',
    type: 'number',
    label: 'Capacidad',
    required: true,
    placeholder: 'Número de estudiantes',
    min: 1,
    colSpan: 2
  }
];

export const aulaMultiStep = {
  showDots: true,
  persistData: false,
  nextText: 'Siguiente',
  prevText: 'Atrás',
  submitText: 'Guardar Aula'
};

/**
 * Layout del formulario de aulas: 2 columnas
 * - Sede: full width (colSpan 2)
 * - Nombre + Ubicación: misma fila (1 col cada uno)
 * - Capacidad: full width (colSpan 2)
 */
export const aulaFormLayout = {
  type: 'single',
  columns: 2
};

export const aulaValidation = {
  ID_SEDE: {
    required: { value: true, message: 'Debe seleccionar una sede' }
  },
  NOMBRE_AULA: {
    required: { value: true, message: 'Debe ingresar el nombre del aula' }
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
  widthClass: 'w-full',
  size: 'lg'
};
