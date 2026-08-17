/**
 * Configuración de formulario para CONVOCATORIA y CONVOCATORIA_CURSO
 */

// ===== CONVOCATORIA (1 por periodo) =====
export const convocatoriaFormFields = [
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
    name: 'DESCRIPCION',
    type: 'text',
    label: 'Descripción',
    required: false,
    placeholder: 'Ej: Convocatoria Fase I'
  },
  {
    name: 'FECHA_APERTURA',
    type: 'datetime',
    label: 'Fecha apertura',
    required: true
  },
  {
    name: 'FECHA_CIERRE',
    type: 'datetime',
    label: 'Fecha cierre',
    required: false
  }
];

export const convocatoriaValidation = {
  ID_PERIODO: {
    required: { value: true, message: 'El periodo es obligatorio' }
  },
  FECHA_APERTURA: {
    required: { value: true, message: 'La fecha de apertura es obligatoria' }
  }
};

export const convocatoriaModalConfig = {
  createTitle: 'Crear Nueva Convocatoria',
  editTitle: 'Editar Convocatoria',
  deleteTitle: '¿Eliminar convocatoria?',
  deleteMessage: (row) => `¿Estás seguro de que deseas eliminar la convocatoria "${row?.NOMBRE_PERIODO}"? Se eliminarán también sus cursos/sedes y plazas asociadas.`,
  widthClass: 'w-1/2'
};

// ===== CONVOCATORIA_CURSO (detalle por sede + curso) =====
export const convocatoriaCursoFormFields = [
  {
    name: 'ID_CONVOCATORIA',
    type: 'reference-select',
    label: 'Convocatoria',
    required: true,
    referenceTable: 'VW_CONVOCATORIAS',
    referenceField: 'ID_CONVOCATORIA',
    referenceQuery: '{NOMBRE_PERIODO}',
    referenceDescriptionField: 'DESCRIPCION',
    placeholder: 'Seleccione una convocatoria',
    searchable: true
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
    name: 'ID_CURSO',
    type: 'reference-select',
    label: 'Curso',
    required: true,
    referenceTable: 'CURSOS',
    referenceField: 'ID_CURSO',
    referenceQuery: '{NOMBRE_CURSO}',
    placeholder: 'Seleccione un curso'
  },
  {
    name: 'NUMERO_PLAZAS',
    type: 'number',
    label: 'Número de plazas (máximo)',
    required: true,
    defaultValue: 1,
    placeholder: 'Ej: 3'
  }
];

export const convocatoriaCursoValidation = {
  ID_CONVOCATORIA: {
    required: { value: true, message: 'La convocatoria es obligatoria' }
  },
  ID_SEDE: {
    required: { value: true, message: 'La sede es obligatoria' }
  },
  ID_CURSO: {
    required: { value: true, message: 'El curso es obligatorio' }
  },
  NUMERO_PLAZAS: {
    required: { value: true, message: 'El número de plazas es obligatorio' }
  }
};

export const convocatoriaCursoModalConfig = {
  createTitle: 'Añadir Convocatoria Curso',
  editTitle: 'Editar Convocatoria Curso',
  deleteTitle: '¿Eliminar curso/sede?',
  deleteMessage: (row) => `¿Estás seguro de que deseas eliminar el curso "${row?.NOMBRE_CURSO}" en sede "${row?.NOMBRE_SEDE}"? Se eliminarán también sus plazas y postulaciones asociadas.`,
  widthClass: 'w-1/2'
};

export const convocatoriaMultiStep = {
  showDots: false,
  persistData: false,
  submitText: 'Guardar Convocatoria'
};

export const convocatoriaCursoMultiStep = {
  showDots: false,
  persistData: false,
  submitText: 'Guardar Curso/Sede'
};

// ===== CONVOCATORIA_CURSO — edición simplificada (solo NUMERO_PLAZAS) =====
export const convocatoriaCursoEditFormFields = [
  {
    name: 'NUMERO_PLAZAS',
    type: 'number',
    label: 'Número de plazas (máximo)',
    required: true,
    defaultValue: 1,
    placeholder: 'Ej: 3'
  }
];

export const convocatoriaCursoEditValidation = {
  NUMERO_PLAZAS: {
    required: { value: true, message: 'El número de plazas es obligatorio' }
  }
};

export const convocatoriaCursoEditModalConfig = {
  createTitle: 'Editar Plazas',
  editTitle: 'Editar Número Máximo de Plazas',
  deleteTitle: '¿Eliminar curso/sede?',
  deleteMessage: (row) => `¿Estás seguro de que deseas eliminar el curso "${row?.NOMBRE_CURSO}" en sede "${row?.NOMBRE_SEDE}"?`,
  widthClass: 'w-1/3'
};
