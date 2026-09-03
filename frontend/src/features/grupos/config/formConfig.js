/**
 * Configuración de formulario para GRUPOS
 * Lógica de modalidad: PRESENCIAL requiere sede, VIRTUAL la vacía.
 *
 * Creación: todos los campos con layout de 2 columnas.
 * Edición: solo horario, aula, plan, fechas, nombre, capacidad
 *          (sin modalidad/sede/área/código/activo para evitar regenerar código).
 */

export const grupoFormFields = [
  {
    name: 'ID_PERIODO',
    type: 'reference-select',
    label: 'Periodo',
    required: true,
    referenceTable: 'PERIODOS',
    referenceField: 'ID_PERIODO',
    referenceQuery: '{NOMBRE_PERIODO}',
    placeholder: 'Seleccione un periodo',
    showRefreshButton: true,
    colSpan: 2
  },
  {
    name: 'MODALIDAD',
    type: 'select',
    label: 'Modalidad',
    required: true,
    defaultValue: 'PRESENCIAL',
    options: [
      { value: 'PRESENCIAL', label: 'PRESENCIAL' },
      { value: 'VIRTUAL', label: 'VIRTUAL' }
    ],
    placeholder: 'Seleccione modalidad',
    colSpan: 2,
    blocked: {
      and: [
        { field: 'ID_SEDE', op: '!empty' }
      ]
    }
  },
  {
    name: 'ID_SEDE',
    type: 'reference-select',
    label: 'Sede',
    required: false,
    referenceTable: 'SEDES',
    referenceField: 'ID_SEDE',
    referenceQuery: '{NOMBRE_SEDE}',
    hidden: {
      or: [
        { field: 'MODALIDAD', op: '=', value: 'VIRTUAL' }
      ]
    },
    hiddenValue: null,
    placeholder: 'Seleccione una sede (requerido si es PRESENCIAL)',
    showRefreshButton: true,
    colSpan: 2
  },
  {
    name: 'ID_AREA',
    type: 'reference-select',
    label: 'Área',
    required: true,
    referenceTable: 'AREAS',
    referenceField: 'ID_AREA',
    referenceQuery: '{NOMBRE_AREA}',
    placeholder: 'Seleccione un área',
    showRefreshButton: true,
    colSpan: 1
  },
  {
    name: 'ID_HORARIO',
    type: 'reference-select',
    label: 'Horario',
    required: true,
    referenceTable: 'HORARIOS',
    referenceField: 'ID_HORARIO',
    referenceQuery: '{NOMBRE_HORARIO}',
    placeholder: 'Seleccione un horario',
    showRefreshButton: true,
    colSpan: 1
  },
  {
    name: 'ID_AULA',
    type: 'reference-select',
    label: 'Aula',
    required: false,
    referenceTable: 'AULAS',
    referenceField: 'ID_AULA',
    referenceQuery: '{NOMBRE_AULA}',
    referenceFilters: [
      { field: 'ID_SEDE', op: '=', value: '{ID_SEDE}' }
    ],
    hidden: {
      or: [
        { field: 'ID_SEDE', op: '=', value: '' },
        { field: 'MODALIDAD', op: '=', value: 'VIRTUAL' }
      ]
    },
    hiddenValue: null,
    placeholder: 'Seleccione un aula (requiere sede)',
    showRefreshButton: true,
    colSpan: 2
  },
  {
    name: 'ID_PLAN',
    type: 'reference-select',
    label: 'Plan Académico',
    required: false,
    referenceTable: 'PLAN_ACADEMICO',
    referenceField: 'ID_PLAN',
    referenceQuery: '{DESCRIPCION}',
    referenceFilters: [
      { field: 'ID_AREA', op: '=', value: '{ID_AREA}' }
    ],
    blocked: {
      and: [
        { field: 'ID_AREA', op: '=', value: '' }
      ]
    },
    placeholder: 'Seleccione un plan (requiere área)',
    showRefreshButton: true,
    colSpan: 2
  },
  {
    name: 'NOMBRE_GRUPO',
    type: 'text',
    label: 'Nombre de Grupo',
    required: true,
    placeholder: 'Ej: Grupo A',
    colSpan: 2
  },
  {
    name: 'FECHA_INICIO',
    type: 'native-date',
    label: 'Fecha inicio',
    required: true,
    colSpan: 1,
    max: '{FECHA_TERMINO}'
  },
  {
    name: 'FECHA_TERMINO',
    type: 'native-date',
    label: 'Fecha termino',
    required: true,
    colSpan: 1,
    min: '{FECHA_INICIO}'
  },
  {
    name: 'CAPACIDAD_MAXIMA',
    type: 'number',
    label: 'Capacidad Máxima',
    required: false,
    placeholder: '0',
    colSpan: 2
  }
];

/**
 * Campos editables en modo edición.
 * No se incluyen MODALIDAD, ID_SEDE, ID_AREA, CODIGO_GRUPO ni ACTIVO
 * porque cambiar modalidad/sede/área generaría un nuevo código y resulta confuso.
 * ACTIVO se maneja directamente en la tabla con auto-save.
 */
export const grupoEditFormFields = [
  {
    name: 'ID_HORARIO',
    type: 'reference-select',
    label: 'Horario',
    required: true,
    referenceTable: 'HORARIOS',
    referenceField: 'ID_HORARIO',
    referenceQuery: '{NOMBRE_HORARIO}',
    placeholder: 'Seleccione un horario',
    showRefreshButton: true,
    colSpan: 2
  },
  {
    name: 'ID_AULA',
    type: 'reference-select',
    label: 'Aula',
    required: false,
    referenceTable: 'AULAS',
    referenceField: 'ID_AULA',
    referenceQuery: '{NOMBRE_AULA}',
    referenceFilters: [
      { field: 'ID_SEDE', op: '=', value: '{ID_SEDE}' }
    ],
    hidden: {
      or: [
        { field: 'ID_SEDE', op: '=', value: '' },
        { field: 'MODALIDAD', op: '=', value: 'VIRTUAL' }
      ]
    },
    hiddenValue: null,
    placeholder: 'Seleccione un aula (requiere sede)',
    showRefreshButton: true,
    colSpan: 2
  },
  {
    name: 'ID_PLAN',
    type: 'reference-select',
    label: 'Plan Académico',
    required: false,
    referenceTable: 'PLAN_ACADEMICO',
    referenceField: 'ID_PLAN',
    referenceQuery: '{DESCRIPCION}',
    referenceFilters: [
      { field: 'ID_AREA', op: '=', value: '{ID_AREA}' }
    ],
    blocked: {
      and: [
        { field: 'ID_AREA', op: '=', value: '' }
      ]
    },
    placeholder: 'Seleccione un plan (requiere área)',
    showRefreshButton: true,
    colSpan: 2
  },
  
  {
    name: 'NOMBRE_GRUPO',
    type: 'text',
    label: 'Nombre de Grupo',
    required: true,
    placeholder: 'Ej: Grupo A',
    colSpan: 2
  },
  {
    name: 'CAPACIDAD_MAXIMA',
    type: 'number',
    label: 'Capacidad Máxima',
    required: false,
    placeholder: '0',
    colSpan: 2
  },
  {
    name: 'FECHA_INICIO',
    type: 'native-date',
    label: 'Fecha inicio',
    required: true,
    colSpan: 1,
    max: '{FECHA_TERMINO}'
  },
  {
    name: 'FECHA_TERMINO',
    type: 'native-date',
    label: 'Fecha termino',
    required: true,
    colSpan: 1,
    min: '{FECHA_INICIO}'
  }
];

/**
 * Layout del formulario: 2 columnas responsive.
 */
export const grupoFormLayout = {
  type: 'single',
  columns: 2
};

export const grupoMultiStep = {
  showDots: true,
  persistData: false,
  nextText: 'Siguiente',
  prevText: 'Atrás',
  submitText: 'Guardar Grupo'
};

export const grupoValidation = {
  ID_PERIODO: {
    required: { value: true, message: 'El periodo es obligatorio' }
  },
  MODALIDAD: {
    required: { value: true, message: 'La modalidad es obligatoria' }
  },
  ID_AREA: {
    required: { value: true, message: 'El área es obligatoria' }
  },
  ID_HORARIO: {
    required: { value: true, message: 'El horario es obligatorio' }
  },
  NOMBRE_GRUPO: {
    required: { value: true, message: 'El nombre de grupo es obligatorio' }
  }
};

export const grupoEditValidation = {
  ID_HORARIO: {
    required: { value: true, message: 'El horario es obligatorio' }
  },
  FECHA_INICIO: {
    required: { value: true, message: 'La fecha de inicio es obligatoria' }
  },
  FECHA_TERMINO: {
    required: { value: true, message: 'La fecha de término es obligatoria' }
  },
  NOMBRE_GRUPO: {
    required: { value: true, message: 'El nombre de grupo es obligatorio' }
  }
};

export const grupoModalConfig = {
  createTitle: 'Crear Nuevo Grupo',
  editTitle: 'Editar Grupo',
  deleteTitle: '¿Eliminar grupo?',
  deleteMessage: (row) => `¿Estás seguro de que deseas eliminar el grupo "${row?.NOMBRE_GRUPO}" (${row?.CODIGO_GRUPO})?`,
  widthClass: 'w-1/2',
  size: '4xl'
};

export const grupoEditModalConfig = {
  editTitle: 'Editar Grupo',
  size: '4xl'
};
