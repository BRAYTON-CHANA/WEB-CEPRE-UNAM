/**
 * Configuración de formulario para TURNOS
 */
export const turnoBaseFields = [
  {
    name: 'ID_SEDE',
    type: 'reference-select',
    label: 'Sede',
    required: true,
    referenceTable: 'SEDES',
    referenceField: 'ID_SEDE',
    referenceQuery: '{NOMBRE_SEDE}',
    referenceFilters: [
      { field: 'ACTIVO', op: '=', value: 1 }
    ],
    placeholder: 'Seleccione una sede'
  },
  {
    name: 'NOMBRE_TURNO',
    type: 'text',
    label: 'Nombre del Turno',
    required: true,
    placeholder: 'Ej: Turno Mañana, Turno Tarde, etc.'
  },
  {
    name: 'DESCRIPCION',
    type: 'text',
    label: 'Descripción',
    required: false,
    placeholder: 'Ej: Lunes a Viernes de 8:00 a 12:00'
  },
  {
    name: 'ID_HORARIO',
    type: 'reference-select',
    label: 'Horario (Plantilla)',
    required: true,
    referenceTable: 'HORARIOS',
    referenceField: 'ID_HORARIO',
    referenceQuery: '{NOMBRE_HORARIO}',
    referenceFilters: [
      { field: 'ACTIVO', op: '=', value: 1 }
    ],
    placeholder: 'Seleccione una plantilla de horario'
  },
  
];

export const turnoMultiStep = {
  showDots: true,
  persistData: false,
  nextText: 'Siguiente',
  prevText: 'Atrás',
  submitText: 'Guardar Turno'
};

export const turnoValidation = {
  ID_SEDE: {
    required: { value: true, message: 'Debe seleccionar una sede' }
  },
  NOMBRE_TURNO: {
    required: { value: true, message: 'El nombre del turno es obligatorio' }
  },
  ID_HORARIO: {
    required: { value: true, message: 'Debe seleccionar un horario' }
  }
};

export const turnoModalConfig = {
  createTitle: 'Crear Nuevo Turno',
  editTitle: 'Editar Turno',
  deleteTitle: '¿Eliminar turno?',
  deleteMessage: (row) => `¿Estás seguro de que deseas eliminar el turno "${row.NOMBRE_TURNO}"?`,
  widthClass: 'w-1/2'
};
