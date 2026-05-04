/**
 * Configuración de formulario para GRUPOS
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
    placeholder: 'Seleccione un periodo'
  },
  {
    name: 'ID_SEDE',
    type: 'reference-select',
    label: 'Sede',
    required: true,
    referenceTable: 'SEDES',
    referenceField: 'ID_SEDE',
    referenceQuery: '{NOMBRE_SEDE}',
    placeholder: 'Seleccione una sede'
  },
  {
    name: 'ID_AREA',
    type: 'reference-select',
    label: 'Área',
    required: true,
    referenceTable: 'AREAS',
    referenceField: 'ID_AREA',
    referenceQuery: '{NOMBRE_AREA}',
    placeholder: 'Seleccione un área'
  },
  {
    name: 'ID_TURNO',
    type: 'reference-select',
    label: 'Turno',
    required: true,
    referenceTable: 'TURNOS',
    referenceField: 'ID_TURNO',
    referenceQuery: '{NOMBRE_TURNO}',
    referenceFilters: [
      { field: 'ID_SEDE', op: '=', value: '{ID_SEDE}' }
    ],
    blocked: {
      and: [
        { field: 'ID_SEDE', op: '=', value: '' }
      ]
    },
    placeholder: 'Seleccione un turno (requiere sede seleccionada)'
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
    blocked: {
      and: [
        { field: 'ID_SEDE', op: '=', value: '' }
      ]
    },
    placeholder: 'Seleccione un aula (requiere sede seleccionada)'
  },
  {
    name: 'ID_PLAN',
    type: 'reference-select',
    label: 'Plan Académico',
    required: true,
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
    placeholder: 'Seleccione un plan (requiere área seleccionada)'
  },
  {
    name: 'CODIGO_GRUPO',
    type: 'text',
    label: 'Código de Grupo',
    required: true,
    placeholder: 'Ej: GRP-001'
  },
  {
    name: 'NOMBRE_GRUPO',
    type: 'text',
    label: 'Nombre de Grupo',
    required: true,
    placeholder: 'Ej: Grupo A'
  },
  {
    name: 'DENOMINACION_AULA',
    type: 'text',
    label: 'Denominación de Aula',
    required: true,
    placeholder: 'Ej: Aula Principal'
  },
  {
    name: 'CAPACIDAD_MAXIMA',
    type: 'number',
    label: 'Capacidad Máxima',
    required: false,
    placeholder: '0'
  },
  {
    name: 'ACTIVO',
    type: 'boolean',
    label: 'Activo',
    required: false,
    defaultValue: true
  }
];

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
  ID_SEDE: {
    required: { value: true, message: 'La sede es obligatoria' }
  },
  ID_AREA: {
    required: { value: true, message: 'El área es obligatoria' }
  },
  ID_TURNO: {
    required: { value: true, message: 'El turno es obligatorio' }
  },
  ID_PLAN: {
    required: { value: true, message: 'El plan académico es obligatorio' }
  },
  CODIGO_GRUPO: {
    required: { value: true, message: 'El código de grupo es obligatorio' }
  },
  NOMBRE_GRUPO: {
    required: { value: true, message: 'El nombre de grupo es obligatorio' }
  },
  DENOMINACION_AULA: {
    required: { value: true, message: 'La denominación de aula es obligatoria' }
  }
};

export const grupoModalConfig = {
  createTitle: 'Crear Nuevo Grupo',
  editTitle: 'Editar Grupo',
  deleteTitle: '¿Eliminar grupo?',
  deleteMessage: (row) => `¿Estás seguro de que deseas eliminar el grupo "${row?.NOMBRE_GRUPO}" (${row?.CODIGO_GRUPO})?`,
  widthClass: 'w-1/2'
};
