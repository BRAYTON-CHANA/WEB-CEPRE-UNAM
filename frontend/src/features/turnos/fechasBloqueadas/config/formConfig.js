/**
 * Configuración de formulario para FECHAS_BLOQUEADAS
 */
export const fechasBloqueadasFormFields = [
  {
    name: 'ID_PERIODO',
    type: 'reference-select',
    label: 'Periodo',
    required: true,
    referenceTable: 'PERIODOS',
    referenceField: 'ID_PERIODO',
    referenceLabelField: 'NOMBRE_PERIODO',
    referenceQuery: '{NOMBRE_PERIODO}',
    placeholder: 'Selecciona un periodo',
    showRefreshButton: true,
    colSpan: 2
  },
  {
    name: 'FECHA',
    type: 'native-date',
    label: 'Fecha bloqueada',
    required: true
  },
  {
    name: 'DESCRIPCION',
    type: 'text',
    label: 'Descripción',
    required: false,
    placeholder: 'Ej: Feriado nacional, día no lectivo',
    colSpan: 2
  }
];

export const fechasBloqueadasMultiStep = {
  showDots: true,
  persistData: false,
  nextText: 'Siguiente',
  prevText: 'Atrás',
  submitText: 'Guardar Fecha Bloqueada'
};

export const fechasBloqueadasValidation = (formData) => {
  const errors = {};

  if (!formData.ID_PERIODO) {
    errors.ID_PERIODO = 'El periodo es requerido';
  }

  if (!formData.FECHA || formData.FECHA.toString().trim() === '') {
    errors.FECHA = 'La fecha es requerida';
  }

  return errors;
};

export const fechasBloqueadasModalConfig = {
  createTitle: 'Crear Fecha Bloqueada',
  editTitle: 'Editar Fecha Bloqueada',
  deleteTitle: '¿Eliminar fecha bloqueada?',
  deleteMessage: (row) => `¿Estás seguro de que deseas eliminar la fecha bloqueada del ${row?.FECHA}?`,
  widthClass: 'w-1/2',
  size: 'md'
};
