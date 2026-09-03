/**
 * Configuración de formulario para FERIADOS
 */
export const feriadosFormFields = [
  {
    name: 'ID_PERIODO',
    type: 'reference-select',
    label: 'Periodo',
    required: true,
    referenceTable: 'PERIODOS',
    referenceField: 'ID_PERIODO',
    referenceQuery: '{NOMBRE_PERIODO}',
    placeholder: 'Seleccione un periodo',
    showRefreshButton: true,
    colSpan: 2
  },
  {
    name: 'FECHA',
    type: 'native-date',
    label: 'Fecha del Feriado',
    required: true,
    colSpan: 1
  },
  {
    name: 'DESCRIPCION',
    type: 'text',
    label: 'Descripción',
    required: false,
    placeholder: 'Ej: Día del Trabajador',
    colSpan: 1
  }
];

export const feriadosMultiStep = {
  showDots: true,
  persistData: false,
  nextText: 'Siguiente',
  prevText: 'Atrás',
  submitText: 'Guardar Feriado'
};

export const feriadosValidation = (formData) => {
  const errors = {};

  if (!formData.ID_PERIODO || formData.ID_PERIODO.toString().trim() === '') {
    errors.ID_PERIODO = 'El periodo es requerido';
  }

  if (!formData.FECHA || formData.FECHA.toString().trim() === '') {
    errors.FECHA = 'La fecha del feriado es requerida';
  }

  return errors;
};

export const feriadosModalConfig = {
  createTitle: 'Crear Nuevo Feriado',
  editTitle: 'Editar Feriado',
  deleteTitle: '¿Eliminar feriado?',
  deleteMessage: (row) => `¿Estás seguro de que deseas eliminar el feriado del ${row?.FECHA || ''} (${row?.NOMBRE_PERIODO || 'periodo'})?`,
  widthClass: 'w-1/2',
  size: 'md'
};
