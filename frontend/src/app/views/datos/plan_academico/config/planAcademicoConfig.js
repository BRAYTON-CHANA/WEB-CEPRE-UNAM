// ==========================================
// CONFIGURACIÓN DE PLAN_ACADEMICO
// ==========================================

export const tableConfig = {
  tableName: 'VW_PLAN_ACADEMICO',
  headers: [
    { title: 'CODIGO_PERIODO', type: 'text' },
    { title: 'DESCRIPCION', type: 'text'},
    { title: 'NOMBRE_AREA', type: 'text' },
    {title: 'TOTAL_HORAS_ACADEMICAS',type:'text'}
  ],
  boundColumn: 'ID_PLAN'
};

export const formConfig = {
  tableName: 'PLAN_ACADEMICO',
  primaryKey: 'ID_PLAN',
  fields: [
    // Período (requerido)
    {
      name: 'ID_PERIODO',
      type: 'reference-select',
      label: 'Período Académico',
      required: true,
      referenceTable: 'PERIODOS',
      referenceField: 'ID_PERIODO',
      referenceQuery: '{CODIGO_PERIODO}',
      placeholder: 'Seleccione un período'
    },
    // Área (solo para UI, filtra el curso-área - NO se guarda)
    // Carga dinámicamente el área desde VW_CURSO_AREA usando el ID_CURSO_AREA seleccionado
    {
      name: 'ID_AREA',
      type: 'reference-select',
      label: 'Área',
      required: true,
      referenceTable: 'AREAS',
      referenceField: 'ID_AREA',
      referenceQuery: '{NOMBRE_AREA}',
      placeholder: 'Seleccione un área',
    
    },
    { 
      name: 'DESCRIPCION', 
      type: 'text', 
      label: 'Descripcion del plan', 
      required: true,
      placeholder: 'Descripcion del plan'
    },
    // Activo
    {
      name: 'ACTIVO',
      type: 'boolean',
      label: 'Plan Activo',
      required: false,
      defaultValue: 1
    }
  ],
  layout: null,
  multiStep: {
    showDots: true,
    persistData: false,
    nextText: 'Siguiente',
    prevText: 'Atrás',
    submitText: 'Guardar Plan'
  },
  validation: {
    ID_PERIODO: {
      required: { value: true, message: 'Debe seleccionar un período' }
    },
    ID_CURSO_AREA: {
      required: { value: true, message: 'Debe seleccionar un curso-área' }
    }
  }
};

export const tableComponentParameters = {
  showCount: false,
  emptyMessage: 'No hay planes académicos registrados',
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
  onPageChange: null
};

export const modalConfig = {
  createTitle: 'Crear Nuevo Plan Académico',
  editTitle: 'Editar Plan Académico',
  size: 'medium',
  widthClass: 'w-1/2'
};
