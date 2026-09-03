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
    type: 'native-datetime',
    label: 'Fecha apertura',
    required: true
  },
  {
    name: 'FECHA_CIERRE',
    type: 'native-datetime',
    label: 'Fecha cierre',
    required: true
  }
];

export const convocatoriaValidation = {
  ID_PERIODO: {
    required: { value: true, message: 'El periodo es obligatorio' }
  },
  FECHA_APERTURA: {
    required: { value: true, message: 'La fecha de apertura es obligatoria' }
  },
  FECHA_CIERRE: {
    required: { value: true, message: 'La fecha de cierre es obligatoria' }
  }
};

// Versión sin ID_PERIODO (el periodo se renderiza con select custom fuera del Form)
export const convocatoriaFormFieldsSinPeriodo = convocatoriaFormFields.filter(
  f => f.name !== 'ID_PERIODO'
);

// Validación como función: valida required + que FECHA_APERTURA < FECHA_CIERRE
export const convocatoriaValidationSinPeriodo = (formData) => {
  const errors = {};

  if (!formData.FECHA_APERTURA) {
    errors.FECHA_APERTURA = 'La fecha de apertura es obligatoria';
  }

  if (!formData.FECHA_CIERRE) {
    errors.FECHA_CIERRE = 'La fecha de cierre es obligatoria';
  }

  if (formData.FECHA_APERTURA && formData.FECHA_CIERRE) {
    const apertura = new Date(formData.FECHA_APERTURA);
    const cierre = new Date(formData.FECHA_CIERRE);
    if (!isNaN(apertura.getTime()) && !isNaN(cierre.getTime())) {
      if (apertura >= cierre) {
        errors.FECHA_CIERRE = 'La fecha de cierre debe ser mayor que la fecha de apertura';
      }
    }
  }

  return errors;
};

export const convocatoriaModalConfig = {
  createTitle: 'Crear Nueva Convocatoria',
  editTitle: 'Editar Convocatoria',
  deleteTitle: '¿Eliminar convocatoria?',
  deleteMessage: (row) => `¿Estás seguro de que deseas eliminar la convocatoria "${row?.NOMBRE_PERIODO}"? Se eliminarán también sus cursos/sedes y plazas asociadas.`,
  widthClass: 'w-1/2',
  size: 'lg'
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
    name: 'MODALIDAD',
    type: 'select',
    label: 'Modalidad',
    required: true,
    defaultValue: 'PRESENCIAL',
    options: [
      { value: 'PRESENCIAL', label: 'Presencial' },
      { value: 'VIRTUAL', label: 'Virtual' }
    ],
    placeholder: 'Seleccione modalidad'
  },
  {
    name: 'ID_SEDE',
    type: 'reference-select',
    label: 'Sede',
    required: true,
    referenceTable: 'SEDES',
    referenceField: 'ID_SEDE',
    referenceQuery: '{NOMBRE_SEDE}',
    placeholder: 'Seleccione una sede',
    // Ocultar cuando MODALIDAD = 'VIRTUAL'
    hidden: { field: 'MODALIDAD', op: '=', value: 'VIRTUAL' }
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

export const convocatoriaCursoValidation = (formData) => {
  const errors = {};
  if (!formData.ID_CONVOCATORIA) {
    errors.ID_CONVOCATORIA = 'La convocatoria es obligatoria';
  }
  const modalidad = formData.MODALIDAD || 'PRESENCIAL';
  if (!formData.MODALIDAD) {
    errors.MODALIDAD = 'La modalidad es obligatoria';
  }
  if (modalidad === 'PRESENCIAL' && !formData.ID_SEDE) {
    errors.ID_SEDE = 'La sede es obligatoria para modalidad presencial';
  }
  if (modalidad === 'VIRTUAL' && formData.ID_SEDE) {
    errors.ID_SEDE = 'La sede debe estar vacía para modalidad virtual';
  }
  if (!formData.ID_CURSO) {
    errors.ID_CURSO = 'El curso es obligatorio';
  }
  if (!formData.NUMERO_PLAZAS) {
    errors.NUMERO_PLAZAS = 'El número de plazas es obligatorio';
  }
  return errors;
};

export const convocatoriaCursoModalConfig = {
  createTitle: 'Añadir Convocatoria Curso',
  editTitle: 'Editar Convocatoria Curso',
  deleteTitle: '¿Eliminar curso/sede?',
  deleteMessage: (row) => `¿Estás seguro de que deseas eliminar el curso "${row?.NOMBRE_CURSO}" en sede "${row?.NOMBRE_SEDE}"? Se eliminarán también sus plazas y postulaciones asociadas.`,
  widthClass: 'w-1/2',
  size: 'lg'
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
  widthClass: 'w-1/3',
  size: 'md'
};
