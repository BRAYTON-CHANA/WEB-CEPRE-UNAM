/**
 * Configuración de formulario para HORARIOS (por sede)
 */
export const horariosFormFields = [
  {
    name: 'ID_SEDE',
    type: 'reference-select',
    label: 'Sede',
    required: false,
    referenceTable: 'SEDES',
    referenceField: 'ID_SEDE',
    referenceQuery: '{NOMBRE_SEDE}',
    placeholder: 'Vacío = Virtual',
    showRefreshButton: true,
    colSpan: 2
  },
  {
    name: 'NOMBRE_HORARIO',
    type: 'text',
    label: 'Nombre del Horario',
    required: true,
    placeholder: 'Ej: Horario Regular, Horario Intensivo, etc.'
  },
  {
    name: 'HORA_INICIO_JORNADA',
    type: 'native-time',
    label: 'Hora Inicio Jornada',
    required: true,
    placeholder: 'Ej: 08:00'
  },
  {
    name: 'HORA_FIN_JORNADA',
    type: 'native-time',
    label: 'Hora Fin Jornada',
    required: true,
    placeholder: 'Ej: 14:00'
  },
  {
    name: 'DIAS_VALIDOS',
    type: 'checkbox',
    label: 'Días válidos',
    required: true,
    inline: true,
    options: [
      { value: 1, label: 'Lunes', description: 'Lunes' },
      { value: 2, label: 'Martes', description: 'Martes' },
      { value: 3, label: 'Miércoles', description: 'Miércoles' },
      { value: 4, label: 'Jueves', description: 'Jueves' },
      { value: 5, label: 'Viernes', description: 'Viernes' },
      { value: 6, label: 'Sábado', description: 'Sábado' },
      { value: 7, label: 'Domingo', description: 'Domingo' }
    ]
  },
  {
    name: 'DIAS_POR_SEMANA',
    type: 'number',
    label: 'Días por semana académica',
    required: true,
    min: 1,
    placeholder: 'Ej: 2'
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

  // Validar días válidos
  if (!Array.isArray(formData.DIAS_VALIDOS) || formData.DIAS_VALIDOS.length === 0) {
    errors.DIAS_VALIDOS = 'Debes seleccionar al menos un día válido';
  }

  // Validar días por semana
  const diasPorSemana = Number(formData.DIAS_POR_SEMANA);
  if (!Number.isFinite(diasPorSemana) || diasPorSemana < 1) {
    errors.DIAS_POR_SEMANA = 'Debe ser al menos 1 día por semana';
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
