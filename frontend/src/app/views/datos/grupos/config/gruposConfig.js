// ==========================================
// CONFIGURACIÓN DE GRUPOS
// ==========================================

export const tableConfig = {
  tableName: 'VW_GRUPOS',
  headers: [
    { title: 'CODIGO_PERIODO', type: 'text' },
    { title: 'NOMBRE_SEDE', type: 'text' },
    { title: 'CODIGO_GRUPO', type: 'text' },
    { title: 'NOMBRE_GRUPO', type: 'text' },
    { title: 'NOMBRE_AULA', type: 'text' },
    { title: 'NOMBRE_TURNO', type: 'text' },
    //{ title: 'DESCRIPCION_PLAN', type: 'text'}
  ],
  boundColumn: 'ID_GRUPO'
};

export const formConfig = {
  tableName: 'GRUPOS',
  primaryKey: 'ID_GRUPO',
  fields: [
    // Paso 1: Período
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
    // Paso 2: Área
    {
      name: 'ID_AREA',
      type: 'reference-select',
      label: 'Área Académica',
      required: true,
      referenceTable: 'AREAS',
      referenceField: 'ID_AREA',
      referenceQuery: '{NOMBRE_AREA}',
      placeholder: 'Seleccione un área'
    },
    // Paso 3: Turno
    {
      name: 'ID_TURNO',
      type: 'reference-select',
      label: 'Turno',
      required: true,
      referenceTable: 'TURNOS',
      referenceField: 'ID_TURNO',
      referenceQuery: '{DESCRIPCION}',
      placeholder: 'Seleccione un turno'
    },
    // Paso 4: Aula (depende de período + área + turno)
    {
      name: 'ID_AULA',
      type: 'function-select',
      label: 'Aula',
      required: true,
      functionName: 'fn_aulas_disponibles_grupo',
      functionParams: {
        ID_PERIODO: '{ID_PERIODO}',
        ID_AREA: '{ID_AREA}',
        ID_TURNO: '{ID_TURNO}',
        ID_AULA_ACTUAL: '{ID_AULA}'
      },
      optionalParams: ['ID_AULA_ACTUAL'],
      valueField: 'ID_AULA',
      labelField: '{NOMBRE_SEDE} - {NOMBRE_AULA}',
      descriptionField: 'Capacidad: {CAPACIDAD} - {UBICACION}',
      blocked: {
        or: [
          { field: 'ID_PERIODO', op: '=', value: '' },
          { field: 'ID_AREA', op: '=', value: '' },
          { field: 'ID_TURNO', op: '=', value: '' }
        ]
      },
      placeholder: 'Seleccione un aula ',
      searchable: true
    },

    {
      name: 'ID_PLAN',
      type: 'function-select',
      label: 'Plan Académico',
      required: true,
      functionName: 'fn_planes_disponibles',
      functionParams: {
        ID_PERIODO: '{ID_PERIODO}',
        ID_AREA: '{ID_AREA}',
        ID_PLAN_ACTUAL: '{ID_PLAN}'
      },
      optionalParams: ['ID_PLAN_ACTUAL'],
      valueField: 'ID_PLAN',
      labelField: '{CODIGO_PERIODO} - {NOMBRE_AREA} - {DESCRIPCION}',
      descriptionField: 'Estado: {ESTADO_PLAN}',
      blocked: {
        or: [
          { field: 'ID_PERIODO', op: '=', value: '' },
          { field: 'ID_AREA', op: '=', value: '' }
        ]
      },
      placeholder: 'Seleccione un plan',
      searchable: true
    },

    // Datos adicionales del grupo
    {
      name: 'CODIGO_GRUPO',
      type: 'text',
      label: 'Código de Grupo',
      required: true,
      maxLength: 10,
      placeholder: 'Ej: G001'
    },
    {
      name: 'NOMBRE_GRUPO',
      type: 'text',
      label: 'Nombre del Grupo',
      required: true,
      maxLength: 100,
      placeholder: 'Ej: Grupo A - Ingenierías 2025-I'
    },
    {
      name: 'DENOMINACION_AULA',
      type: 'text',
      label: 'Denominación del Aula',
      required: true,
      maxLength: 100,
      placeholder: 'Ej: Aula Principal de Ingenierías'
    },
    {
      name: 'CAPACIDAD_MAXIMA',
      type: 'integer',
      label: 'Capacidad Máxima',
      required: false,
      min: 1,
      placeholder: 'Número máximo de estudiantes'
    },
    {
      name: 'ACTIVO',
      type: 'boolean',
      label: 'Activo',
      required: false,
      defaultValue: true
    }
  ],
  layout: [
    { row: 1, fields: ['ID_PERIODO', 'ID_AREA'] },
    { row: 2, fields: ['ID_TURNO', 'ID_AULA'] },
    { row: 3, fields: ['ID_PLAN', 'CODIGO_GRUPO', 'NOMBRE_GRUPO'] },
    { row: 4, fields: ['DENOMINACION_AULA', 'CAPACIDAD_MAXIMA'] },
    { row: 5, fields: ['ACTIVO'] }
  ],
  multiStep: {
    showDots: true,
    persistData: false,
    nextText: 'Siguiente',
    prevText: 'Atrás',
    submitText: 'Guardar Grupo'
  },
  validation: {
    ID_PERIODO: {
      required: { value: true, message: 'Debe seleccionar un período' }
    },
    ID_AREA: {
      required: { value: true, message: 'Debe seleccionar un área' }
    },
    ID_TURNO: {
      required: { value: true, message: 'Debe seleccionar un turno' }
    },
    ID_AULA: {
      required: { value: true, message: 'Debe seleccionar un aula' }
    },
    ID_PLAN: {
      required: { value: true, message: 'Debe seleccionar un plan académico' }
    },
    CODIGO_GRUPO: {
      required: { value: true, message: 'Debe ingresar un código de grupo' },
      maxLength: { value: 10, message: 'Máximo 10 caracteres' }
    },
    NOMBRE_GRUPO: {
      required: { value: true, message: 'Debe ingresar un nombre de grupo' },
      maxLength: { value: 100, message: 'Máximo 100 caracteres' }
    },
    DENOMINACION_AULA: {
      required: { value: true, message: 'Debe ingresar una denominación' },
      maxLength: { value: 100, message: 'Máximo 100 caracteres' }
    }
  }
};

export const tableComponentParameters = {
  showCount: false,
  emptyMessage: 'No hay grupos registrados',
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
  createTitle: 'Crear Nuevo Grupo',
  editTitle: 'Editar Grupo',
  size: 'large',
  widthClass: 'w-3/4'
};
