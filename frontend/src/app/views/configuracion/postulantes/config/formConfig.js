/**
 * Configuración de formulario para POSTULANTES (VW_POSTULANTE)
 */
export const postulanteFormFields = [
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
    name: 'ID_GRUPO',
    type: 'reference-select',
    label: 'Grupo',
    required: false,
    referenceTable: 'GRUPOS',
    referenceField: 'ID_GRUPO',
    referenceQuery: '{CODIGO_GRUPO} - {NOMBRE_GRUPO}',
    referenceFilters: [
      { field: 'ID_PERIODO', op: '=', value: '{ID_PERIODO}' },
      { field: 'ID_SEDE', op: '=', value: '{ID_SEDE}' }
    ],
    blocked: {
      and: [
        { field: 'ID_PERIODO', op: '=', value: '' },
        { field: 'ID_SEDE', op: '=', value: '' }
      ]
    },
    placeholder: 'Seleccione un grupo (opcional)'
  },
  {
    name: 'NOMBRES',
    type: 'text',
    label: 'Nombres',
    required: true,
    placeholder: 'Ej: JUAN CARLOS'
  },
  {
    name: 'APELLIDOS',
    type: 'text',
    label: 'Apellidos',
    required: true,
    placeholder: 'Ej: PEREZ GARCIA'
  },
  {
    name: 'ID_CARRERA',
    type: 'function-select',
    label: 'Carrera',
    required: false,
    functionName: 'fn_grupo_carrera',
    functionParams: {
      p_id_grupo: '{ID_GRUPO}'
    },
    optionalParams: ['p_id_grupo'],
    valueField: 'ID_CARRERA',
    labelField: '{NOMBRE_CARRERA} ({NOMBRE_SEDE})',
    searchable: true,
    placeholder: 'Seleccione una carrera (opcional)',
    blocked: {
      and: [
        { field: 'ID_GRUPO', op: '=', value: '' }
      ]
    }
  },
  {
    name: 'ALUMNO_LIBRE',
    type: 'boolean',
    label: 'Alumno Libre',
    required: false,
    defaultValue: false
  },
  /*
  {
    name: 'ACTIVO',
    type: 'boolean',
    label: 'Activo',
    required: false,
    defaultValue: true
  },
  */
  // Campo oculto para mantener compatibilidad con el view
  {
    name: 'ID_ESTUDIANTE',
    type: 'hidden',
    hidden: true
  }
];

export const postulanteValidation = {
  ID_PERIODO: {
    required: { value: true, message: 'El periodo es obligatorio' }
  },
  ID_SEDE: {
    required: { value: true, message: 'La sede es obligatoria' }
  },
  NOMBRES: {
    required: { value: true, message: 'Los nombres son obligatorios' }
  },
  APELLIDOS: {
    required: { value: true, message: 'Los apellidos son obligatorios' }
  }
};

export const postulanteModalConfig = {
  createTitle: 'Añadir Postulante',
  editTitle: 'Editar Postulante',
  deleteTitle: '¿Eliminar postulante?',
  deleteMessage: (row) => `¿Estás seguro de que deseas eliminar al postulante "${row?.NOMBRES} ${row?.APELLIDOS}"?`,
  widthClass: 'w-1/2'
};
