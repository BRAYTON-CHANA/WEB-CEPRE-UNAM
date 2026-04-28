// ==========================================
// CONFIGURACIÓN DE PLAN_ACADEMICO_CURSOS
// ==========================================

export const planAcademicoCursosTableConfig = {
  tableName: 'VW_PLAN_ACADEMICO_CURSOS',
  headers: [
    //{ title: 'CODIGO_PERIODO', type: 'text' },
    //{ title: 'NOMBRE_AREA', type: 'text' },
    { title: 'CODIGO_UNICO', type: 'text' },
    { title: 'NOMBRE_CURSO', type: 'text' },
    { title: 'HORAS_ACADEMICAS_TOTALES', type: 'text' },
    { title: 'ACTIVO_PLAN_CURSO', type: 'boolean' }
  ],
  boundColumn: 'ID_PLAN_ACADEMICO_CURSO'
};

export const planAcademicoCursosFormConfig = (selectedIdPlan) => ({
  tableName: 'PLAN_ACADEMICO_CURSOS',
  primaryKey: 'ID_PLAN_ACADEMICO_CURSO',
  fields: [
    { 
      name: 'ID_PLAN_ACADEMICO', 
      type: 'reference-select',
      label: 'Plan Académico', 
      required: true,
      defaultValue: selectedIdPlan,
      disabled: selectedIdPlan !== null,
      referenceTable: 'PLAN_ACADEMICO',
      referenceField: 'ID_PLAN',
      referenceQuery: '{DESCRIPCION}',
      placeholder: 'Seleccione plan'
    },
    { 
      name: 'ID_CURSO_AREA', 
      type: 'function-select',
      label: 'Curso - Área', 
      required: true,
      functionName: 'fn_cursos_sin_plan_academico',
      functionParams: {
        ID_PLAN: selectedIdPlan,
        ID_CURSO_AREA_ACTUAL: '{ID_CURSO_AREA}'
      },
      optionalParams: ['ID_CURSO_AREA_ACTUAL'],
      valueField: 'ID_CURSO_AREA',
      labelField: '{NOMBRE_CURSO} - {NOMBRE_AREA}',
      descriptionField: '{CODIGO_UNICO}',
      blocked: {
        or: [
          { field: 'ID_PLAN_ACADEMICO', op: '=', value: '' },
        ]
      },
      searchable: true
    },
    { 
      name: 'HORAS_ACADEMICAS_TOTALES', 
      type: 'integer',
      label: 'Horas Académicas Totales', 
      required: true,
      placeholder: 'Ej: 50',
      min: 1
    },
    { 
      name: 'ACTIVO', 
      type: 'boolean', 
      label: 'Activo', 
      required: false,
      defaultValue: true
    }
  ],
  layout: null,
  confirmSubmit: true,
  multiStep: {
    showDots: false,
    persistData: false,
    nextText: 'Siguiente',
    prevText: 'Atrás',
    submitText: 'Guardar Curso'
  },
  validation: {
    ID_PLAN_ACADEMICO: {
      required: { value: true, message: 'El plan es requerido' }
    },
    ID_CURSO_AREA: {
      required: { value: true, message: 'Debe seleccionar un curso-área' }
    },
    HORAS_ACADEMICAS_TOTALES: {
      required: { value: true, message: 'Las horas académicas son requeridas' }
    }
  }
});

export const planAcademicoCursosTableComponentParameters = (selectedIdPlan) => ({
  showCount: false,
  emptyMessage: 'No hay cursos registrados para este plan',
  variant: 'default',
  striped: true,
  hover: true,
  bordered: true,
  sortable: true,
  selectable: false,
  expandable: false,
  filterable: false,
  pagination: true,
  fit: false,
  itemsPerPage: 10,
  currentPage: 1,
  onPageChange: null,
  fixatedFilters: selectedIdPlan ? [{ column: 'ID_PLAN', op: '=', value: selectedIdPlan }] : null
});

export const planAcademicoCursosModalConfig = {
  createTitle: 'Agregar Curso al Plan',
  editTitle: 'Editar Curso del Plan',
  size: 'medium',
  widthClass: 'w-1/2'
};
