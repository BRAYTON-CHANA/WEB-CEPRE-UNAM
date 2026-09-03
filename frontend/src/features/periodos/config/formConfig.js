/**
 * Configuración de formulario para PERIODOS
 */
export const periodosFormFields = [
  {
    name: 'CODIGO_PERIODO',
    type: 'text',
    label: 'Código del Periodo',
    required: true,
    placeholder: 'Ej: 2026-III'
  },
  {
    name: 'NOMBRE_PERIODO',
    type: 'text',
    label: 'Nombre del Periodo',
    required: true,
    placeholder: 'Ej: Ciclo 2026-III'
  },
  {
    name: 'FECHA_INICIO',
    type: 'native-date',
    label: 'Fecha de Inicio',
    required: true
  },
  {
    name: 'FECHA_FIN',
    type: 'native-date',
    label: 'Fecha de Fin',
    required: true
  }
];

export const periodosMultiStep = {
  showDots: true,
  persistData: false,
  nextText: 'Siguiente',
  prevText: 'Atrás',
  submitText: 'Guardar Periodo'
};

export const periodosValidation = (formData) => {
  const errors = {};

  if (!formData.CODIGO_PERIODO || formData.CODIGO_PERIODO.toString().trim() === '') {
    errors.CODIGO_PERIODO = 'El código del periodo es requerido';
  }

  if (!formData.NOMBRE_PERIODO || formData.NOMBRE_PERIODO.toString().trim() === '') {
    errors.NOMBRE_PERIODO = 'El nombre del periodo es requerido';
  }

  if (!formData.FECHA_INICIO || formData.FECHA_INICIO.toString().trim() === '') {
    errors.FECHA_INICIO = 'La fecha de inicio es requerida';
  }

  if (!formData.FECHA_FIN || formData.FECHA_FIN.toString().trim() === '') {
    errors.FECHA_FIN = 'La fecha de fin es requerida';
  }

  // Validación cross-field: la fecha de fin debe ser mayor que la de inicio
  if (formData.FECHA_INICIO && formData.FECHA_FIN) {
    if (formData.FECHA_INICIO >= formData.FECHA_FIN) {
      errors.FECHA_FIN = 'La fecha de fin debe ser mayor que la fecha de inicio';
    }
  }

  return errors;
};

export const periodosModalConfig = {
  createTitle: 'Crear Nuevo Periodo',
  editTitle: 'Editar Periodo',
  deleteTitle: '¿Eliminar periodo?',
  deleteMessage: (row) => `¿Estás seguro de que deseas eliminar el periodo "${row?.NOMBRE_PERIODO}" (${row?.CODIGO_PERIODO})?`,
  widthClass: 'w-1/2',
  size: 'md'
};
