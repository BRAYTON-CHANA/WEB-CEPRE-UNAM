// ==========================================
// CONFIGURACIÓN DE CURSOS DEL GRUPO
// ==========================================

export const cursosTableConfig = {
  tableName: 'VW_GRUPO_PLAN_CURSO',
  headers: [
    { title: 'NOMBRE_CURSO', type: 'text' },
    { title: 'CODIGO_UNICO', type: 'text' },
    { title: 'HORAS_ACADEMICAS_TOTALES', type: 'text' },
    { title: 'IDENTIFICADOR_DOCENTE', type: 'text' },
    { title: 'NOMBRE_COMPLETO_DOCENTE', type: 'text' }
  ],
  boundColumn: 'ID_GRUPO_PLAN_CURSO'
};

export const cursosFormConfig = (selectedIdGrupo, selectedIdPlan) => ({
  tableName: 'GRUPO_PLAN_CURSO',
  primaryKey: 'ID_GRUPO_PLAN_CURSO',
  fields: [
    {
      name: 'ID_GRUPO',
      type: 'reference-select',
      label: 'Grupo',
      required: true,
      referenceTable: 'VW_GRUPOS',
      referenceField: 'ID_GRUPO',
      referenceQuery: '{NOMBRE_GRUPO}',
      placeholder: 'Seleccione grupo',
      disabled: true
    },
    { 
      name: 'ID_PLAN_ACADEMICO_CURSO', 
      type: 'function-select',
      label: 'Curso del Plan', 
      required: true,
      functionName: 'fn_grupo_plan_cursos_disponibles',
      functionParams: {
        ID_GRUPO: '{ID_GRUPO}',
        ID_PLAN_ACADEMICO_CURSO_ACTUAL: '{ID_PLAN_ACADEMICO_CURSO}'
      },
      optionalParams: ['ID_PLAN_ACADEMICO_CURSO_ACTUAL'],
      valueField: 'ID_PLAN_ACADEMICO_CURSO',
      labelField: '{NOMBRE_AREA} - {NOMBRE_CURSO}',
      descriptionField: 'Código: {CODIGO_UNICO} - Horas: {HORAS_ACADEMICAS_TOTALES}',
      blocked: {
        or: [
          { field: 'ID_GRUPO', op: '=', value: '' }
        ]
      },
      placeholder: 'Seleccione curso',
      searchable: true
    },
    {
      name: 'ID_DOCENTE_PERIODO',
      type: 'function-select',
      label: 'Docente',
      required: false,
      functionName: 'fn_docentes_disponibles_grupo_curso',
      functionParams: {
        ID_GRUPO: '{ID_GRUPO}',
        ID_PLAN_ACADEMICO_CURSO: '{ID_PLAN_ACADEMICO_CURSO}',
        ID_DOCENTE_PERIODO_ACTUAL: '{ID_DOCENTE_PERIODO}'
      },
      optionalParams: ['ID_DOCENTE_PERIODO_ACTUAL'],
      valueField: 'ID_DOCENTE_PERIODO',
      labelField: '{IDENTIFICADOR_DOCENTE} - {NOMBRE_COMPLETO_DOCENTE}',
      descriptionField: 'DNI: {DNI} - Email: {EMAIL}',
      blocked: {
        or: [
          { field: 'ID_GRUPO', op: '=', value: '' },
          { field: 'ID_PLAN_ACADEMICO_CURSO', op: '=', value: '' }
        ]
      },
      placeholder: 'Seleccione un docente (opcional)',
      searchable: true
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
    submitText: 'Guardar Asignación'
  },
  validation: {
    ID_GRUPO: {
      required: { value: true, message: 'El grupo es requerido' }
    },
    ID_PLAN_ACADEMICO_CURSO: {
      required: { value: true, message: 'Debe seleccionar un curso del plan' }
    }
  }
});

export const cursosTableComponentParameters = (selectedIdGrupo, selectedIdPlan) => ({
  showCount: false,
  emptyMessage: 'No hay cursos asignados a este grupo',
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
  fixatedFilters: selectedIdGrupo && selectedIdPlan ? [
    { column: 'ID_GRUPO', op: '=', value: selectedIdGrupo },
    { column: 'ID_PLAN', op: '=', value: selectedIdPlan }
  ] : null
});

export const cursosModalConfig = {
  createTitle: 'Asignar Curso al Grupo',
  editTitle: 'Editar Asignación de Curso',
  size: 'medium',
  widthClass: 'w-1/2'
};
