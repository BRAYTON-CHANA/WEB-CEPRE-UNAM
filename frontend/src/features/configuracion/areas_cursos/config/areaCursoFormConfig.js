/**
 * Configuración de formulario para CURSO_AREA (relación N:M)
 */
export const areaCursoBaseFields = [
  {
    name: 'ID_AREA',
    type: 'reference-select',
    label: 'Área Académica',
    required: true,
    referenceTable: 'AREAS',
    referenceField: 'ID_AREA',
    referenceQuery: '{NOMBRE_AREA}',
    referenceFilters: [
      { field: 'ACTIVO', op: '=', value: 1 }
    ],
    placeholder: 'Seleccione un área académica'
  },
  {
    name: 'ID_CURSO',
    type: 'function-select',
    label: 'Curso',
    functionName: 'fn_cursos_disponibles_area',
    functionParams: {
      ID_AREA: '{ID_AREA}',
      ID_CURSO_ACTUAL: '{ID_CURSO}'
    },
    optionalParams: ['ID_CURSO_ACTUAL'],
    valueField: 'ID_CURSO',
    labelField: '{NOMBRE_CURSO} - {CODIGO_CURSO}',
    descriptionField: '{EJE_TEMATICO}',
    blocked: {
      and: [{ field: 'ID_AREA', op: 'empty' }]
    },
    searchable: true
  },
 
  
];

export const areaCursoMultiStep = {
  showDots: true,
  persistData: false,
  nextText: 'Siguiente',
  prevText: 'Atrás',
  submitText: 'Guardar Asignación'
};

export const areaCursoValidation = {
  ID_AREA: {
    required: { value: true, message: 'Debe seleccionar un área' }
  },
  ID_CURSO: {
    required: { value: true, message: 'Debe seleccionar un curso' }
  }
};

export const areaCursoModalConfig = {
  createTitle: 'Crear Nueva Asignación',
  editTitle: 'Editar Asignación',
  deleteTitle: '¿Eliminar asignación?',
  deleteMessage: (row) => `¿Estás seguro de que deseas eliminar la asignación del curso "${row?.NOMBRE_CURSO}" del área "${row?.NOMBRE_AREA}"?`,
  widthClass: 'w-1/2'
};
