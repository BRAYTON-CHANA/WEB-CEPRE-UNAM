/**
 * Configuración de formulario para DOCENTE_CURSO (relación N:M)
 */
export const docenteCursoBaseFields = [
  {
    name: 'ID_DOCENTE',
    type: 'reference-select',
    label: 'Docente',
    required: true,
    referenceTable: 'DOCENTES',
    referenceField: 'ID_DOCENTE',
    referenceQuery: '{APELLIDOS} {NOMBRES}',
    referenceFilters: [
      { field: 'ACTIVO', op: '=', value: 1 }
    ],
    placeholder: 'Seleccione un docente'
  },
  {
    name: 'ID_CURSO',
    type: 'function-select',
    label: 'Curso',
    required: true,
    functionName: 'fn_cursos_disponibles_docente',
    functionParams: {
      ID_DOCENTE: '{ID_DOCENTE}',
      ID_CURSO_ACTUAL: '{ID_CURSO}'
    },
    optionalParams: ['ID_CURSO_ACTUAL'],
    valueField: 'ID_CURSO',
    labelField: '{NOMBRE_CURSO} - {CODIGO_COMPARTIDO}',
    descriptionField: '{EJE_TEMATICO}',
    statusField: 'ESTADO_CURSO',
    blocked: {
      and: [
        { field: 'ID_DOCENTE', op: '=', value: '' }
      ]
    },
    placeholder: 'Seleccione un curso (requiere docente seleccionado)',
    searchable: true
  },
  {
    name: 'ACTIVO',
    type: 'boolean',
    label: 'Activo',
    required: false,
    defaultValue: true
  }
];

export const docenteCursoMultiStep = {
  showDots: true,
  persistData: false,
  nextText: 'Siguiente',
  prevText: 'Atrás',
  submitText: 'Guardar Asignación'
};

export const docenteCursoValidation = {
  ID_DOCENTE: {
    required: { value: true, message: 'Debe seleccionar un docente' }
  },
  ID_CURSO: {
    required: { value: true, message: 'Debe seleccionar un curso' }
  }
};

export const docenteCursoModalConfig = {
  createTitle: 'Crear Nueva Asignación',
  editTitle: 'Editar Asignación',
  deleteTitle: '¿Eliminar asignación?',
  deleteMessage: (row) => `¿Estás seguro de que deseas eliminar la asignación del curso "${row?.NOMBRE_CURSO}" del docente "${row?.NOMBRE_COMPLETO_DOCENTE}"?`,
  widthClass: 'w-1/2'
};
