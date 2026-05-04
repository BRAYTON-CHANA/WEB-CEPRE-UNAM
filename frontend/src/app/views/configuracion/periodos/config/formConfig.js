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
    type: 'date',
    label: 'Fecha de Inicio',
    required: true
  },
  {
    name: 'FECHA_FIN',
    type: 'date',
    label: 'Fecha de Fin',
    required: true
  },
  {
    name: 'ACTIVO',
    type: 'boolean',
    label: 'Activo',
    required: false,
    defaultValue: true
  }
];

export const periodosMultiStep = {
  showDots: true,
  persistData: false,
  nextText: 'Siguiente',
  prevText: 'Atrás',
  submitText: 'Guardar Periodo'
};

export const periodosValidation = {
  CODIGO_PERIODO: {
    required: { value: true, message: 'El código del periodo es requerido' }
  },
  NOMBRE_PERIODO: {
    required: { value: true, message: 'El nombre del periodo es requerido' }
  },
  FECHA_INICIO: {
    required: { value: true, message: 'La fecha de inicio es requerida' }
  },
  FECHA_FIN: {
    required: { value: true, message: 'La fecha de fin es requerida' }
  }
};

export const periodosModalConfig = {
  createTitle: 'Crear Nuevo Periodo',
  editTitle: 'Editar Periodo',
  deleteTitle: '¿Eliminar periodo?',
  deleteMessage: (row) => `¿Estás seguro de que deseas eliminar el periodo "${row?.NOMBRE_PERIODO}" (${row?.CODIGO_PERIODO})?`,
  widthClass: 'w-1/2'
};
