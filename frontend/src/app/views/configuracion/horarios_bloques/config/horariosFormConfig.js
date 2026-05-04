/**
 * Configuración de formulario para HORARIOS
 */
export const horariosFormFields = [
  {
    name: 'NOMBRE_HORARIO',
    type: 'text',
    label: 'Nombre del Horario',
    required: true,
    placeholder: 'Ej: Horario Regular, Horario Intensivo, etc.'
  },
  {
    name: 'HORA_INICIO_JORNADA',
    type: 'time',
    label: 'Hora Inicio Jornada',
    required: true,
    placeholder: 'Ej: 08:00'
  },
  {
    name: 'HORA_FIN_JORNADA',
    type: 'time',
    label: 'Hora Fin Jornada',
    required: true,
    placeholder: 'Ej: 14:00'
  },
  {
    name: 'MATRIZ_DIAS',
    type: 'matrix',
    label: 'Matriz de Días',
    required: false,
    rows: 1,
    cols: 1,
    cellType: 'select',
    cellOptions: [
      { value: null, label: '—' },
      { value: 1, label: 'Lunes' },
      { value: 2, label: 'Martes' },
      { value: 3, label: 'Miércoles' },
      { value: 4, label: 'Jueves' },
      { value: 5, label: 'Viernes' },
      { value: 6, label: 'Sábado' },
      { value: 7, label: 'Domingo' }
    ],
    allowNull: true
  }
];

export const horariosMultiStep = {
  showDots: true,
  persistData: false,
  nextText: 'Siguiente',
  prevText: 'Atrás',
  submitText: 'Guardar Horario'
};

export const horariosValidation = (formData) => {
  const errors = {};

  if (!formData.NOMBRE_HORARIO || formData.NOMBRE_HORARIO.toString().trim() === '') {
    errors.NOMBRE_HORARIO = 'El nombre del horario es obligatorio';
  }

  if (!formData.HORA_INICIO_JORNADA || formData.HORA_INICIO_JORNADA.toString().trim() === '') {
    errors.HORA_INICIO_JORNADA = 'La hora de inicio es obligatoria';
  }

  if (!formData.HORA_FIN_JORNADA || formData.HORA_FIN_JORNADA.toString().trim() === '') {
    errors.HORA_FIN_JORNADA = 'La hora de fin es obligatoria';
  }

  // Validación cross-field: la hora de fin debe ser mayor que la de inicio
  if (formData.HORA_INICIO_JORNADA && formData.HORA_FIN_JORNADA) {
    if (formData.HORA_INICIO_JORNADA >= formData.HORA_FIN_JORNADA) {
      errors.HORA_FIN_JORNADA = 'La hora de fin debe ser mayor que la hora de inicio';
    }
  }

  return errors;
};

export const horariosModalConfig = {
  createTitle: 'Crear Nueva Plantilla de Horario',
  editTitle: 'Editar Plantilla de Horario',
  deleteTitle: '¿Eliminar horario?',
  deleteMessage: (row) => `¿Estás seguro de que deseas eliminar el horario "${row.NOMBRE_HORARIO}"?`,
  size: 'full',
  widthClass: 'w-full'
};
