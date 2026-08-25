export const planesAcademicosCursosBaseFields = [
  {
    name: 'ID_PLAN_ACADEMICO',
    type: 'reference-select',
    label: 'Plan Académico',
    required: true,
    referenceTable: 'PLAN_ACADEMICO',
    referenceField: 'ID_PLAN',
    referenceQuery: '{DESCRIPCION}',
    referenceFilters: [
      { field: 'ACTIVO', op: '=', value: 1 }
    ],
    placeholder: 'Seleccione un plan académico'
  },
  {
    name: 'ID_CURSO',
    type: 'function-select',
    label: 'Curso',
    required: true,
    functionName: 'fn_cursos_disponibles_plan',
    functionParams: {
      ID_PLAN: '{ID_PLAN_ACADEMICO}',
      ID_CURSO_ACTUAL: '{ID_CURSO}'
    },
    optionalParams: ['ID_CURSO_ACTUAL'],
    valueField: 'id_curso',
    labelField: '{nombre_curso} - {codigo_curso}',
    descriptionField: '{eje_tematico}',
    statusField: 'estado_plan',
    blocked: {
      and: [
        { field: 'ID_PLAN_ACADEMICO', op: '=', value: '' }
      ]
    },
    placeholder: 'Seleccione un curso (requiere plan académico)',
    searchable: true
  },
  {
    name: 'HORAS_ACADEMICAS_CICLO',
    type: 'number',
    label: 'Horas Académicas Ciclo',
    required: true,
    placeholder: 'Ej: 4',
    min: 1
  },
  {
    name: 'HORAS_ACADEMICAS_TOTALES',
    type: 'number',
    label: 'Horas Académicas Totales',
    required: true,
    placeholder: 'Ej: 64',
    min: 1
  }
];

export const planesAcademicosCursosMultiStep = {
  showDots: false,
  persistData: false,
  submitText: 'Guardar Curso en Plan'
};

export const planesAcademicosCursosValidation = {
  ID_PLAN_ACADEMICO: {
    required: { value: true, message: 'Debe seleccionar un plan académico' }
  },
  ID_CURSO: {
    required: { value: true, message: 'Debe seleccionar un curso' }
  },
  HORAS_ACADEMICAS_CICLO: {
    required: { value: true, message: 'Las horas por ciclo son obligatorias' },
    min: { value: 1, message: 'Las horas por ciclo deben ser mayores a 0' }
  },
  HORAS_ACADEMICAS_TOTALES: {
    required: { value: true, message: 'Las horas totales son obligatorias' },
    min: { value: 1, message: 'Las horas totales deben ser mayores a 0' }
  }
};

export const planesAcademicosCursosModalConfig = {
  createTitle: 'Crear Nueva Asignación de Curso',
  editTitle: 'Editar Asignación de Curso',
  deleteTitle: '¿Eliminar asignación de curso?',
  deleteMessage: (row) => `¿Estás seguro de que deseas eliminar el curso "${row?.NOMBRE_CURSO}" del plan "${row?.DESCRIPCION_PLAN}"?`,
  widthClass: 'w-1/2',
  size: 'md'
};
