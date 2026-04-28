// ==========================================
// CONFIGURACIÓN DE HORARIOS
// ==========================================

export const tableConfig = {
  tableName: 'HORARIOS',
  headers: [
    { title: 'NOMBRE_HORARIO', type: 'string' },
    { title: 'HORA_INICIO_JORNADA', type: 'string' },
    { title: 'HORA_FIN_JORNADA', type: 'string' },
    { title: 'ACTIVO', type: 'boolean' }
  ],
  boundColumn: 'ID_HORARIO'
};

export const formConfig = {
  tableName: 'HORARIOS',
  primaryKey: 'ID_HORARIO',
  fields: [
    { 
      name: 'NOMBRE_HORARIO', 
      type: 'text', 
      label: 'Nombre del Horario', 
      required: true,
      placeholder: 'Ej: Jornada 7:10-19:00'
    },
    { 
      name: 'HORA_INICIO_JORNADA', 
      type: 'time', 
      label: 'Hora Inicio Jornada', 
      required: true,
      placeholder: 'Ej: 07:10'
    },
    { 
      name: 'HORA_FIN_JORNADA', 
      type: 'time', 
      label: 'Hora Fin Jornada', 
      required: true,
      placeholder: 'Ej: 19:00'
    },
    { 
      name: 'ACTIVO', 
      type: 'boolean', 
      label: 'Activo', 
      required: false,
      defaultValue: true
    }
  ],
  layout: null,
  confirmSubmit: true,
  multiStep: {
    showDots: false,
    persistData: false,
    nextText: 'Siguiente',
    prevText: 'Atrás',
    submitText: 'Guardar Horario'
  },
  validation: (formData) => {
    const errors = {};
    
    if (!formData.NOMBRE_HORARIO) {
      errors.NOMBRE_HORARIO = 'El nombre del horario es requerido';
    }
    
    if (!formData.HORA_INICIO_JORNADA) {
      errors.HORA_INICIO_JORNADA = 'La hora de inicio es requerida';
    }
    
    if (!formData.HORA_FIN_JORNADA) {
      errors.HORA_FIN_JORNADA = 'La hora de fin es requerida';
    }
    
    return errors;
  }
};

export const tableComponentParameters = {
  showCount: false,
  emptyMessage: 'No hay horarios registrados',
  variant: 'default',
  striped: true,
  hover: true,
  bordered: true,
  sortable: true,
  selectable: false,
  expandable: false,
  filterable: true,
  pagination: false,
  fit: false,
  itemsPerPage: 10,
  currentPage: 1,
  onPageChange: null
};

export const modalConfig = {
  createTitle: 'Crear Nuevo Horario',
  editTitle: 'Editar Horario',
  size: 'medium',
  widthClass: 'w-1/2'
};
