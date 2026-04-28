// ==========================================
// CONFIGURACIÓN DE HORARIO_BLOQUES
// ==========================================

export const horarioBloquesTableConfig = {
  tableName: 'VW_HORARIO_BLOQUES',
  headers: [
    { title: 'ORDEN', type: 'number' },
    { title: 'HORA_INICIO_CALCULADA', type: 'string' },
    { title: 'HORA_FIN_CALCULADA', type: 'string' },
    { title: 'DURACION', type: 'number' },
    { title: 'TIPO_BLOQUE', type: 'string' },
    { title: 'ETIQUETA', type: 'string' }
  ],
  boundColumn: 'ID_BLOQUE'
};

export const horarioBloquesFormConfig = (selectedIdHorario) => ({
  tableName: 'HORARIO_BLOQUES',
  primaryKey: 'ID_BLOQUE',
  fields: [
    { 
      name: 'ID_HORARIO', 
      type: 'reference-select',
      label: 'Horario', 
      required: true,
      defaultValue: selectedIdHorario,
      disabled: selectedIdHorario !== null,
      referenceTable: 'HORARIOS',
      referenceField: 'ID_HORARIO',
      referenceQuery: '{NOMBRE_HORARIO}',
      referenceFilters: [
        { field: 'ACTIVO', op: '=', value: 1 }
      ],
      placeholder: 'Seleccione horario'
    },
    { 
      name: 'ORDEN', 
      type: 'number', 
      label: 'Orden', 
      required: true,
      placeholder: 'Ej: 1',
      min: 1
    },
    { 
      name: 'DURACION', 
      type: 'number', 
      label: 'Duración (minutos)', 
      required: true,
      placeholder: 'Ej: 50',
      min: 1
    },
    { 
      name: 'TIPO_BLOQUE', 
      type: 'select', 
      label: 'Tipo de Bloque', 
      required: true,
      placeholder: 'Seleccione tipo',
      options: [
        { value: 'clase', label: 'Clase' },
        { value: 'break', label: 'Break' }
      ]
    },
    { 
      name: 'ETIQUETA', 
      type: 'text', 
      label: 'Etiqueta', 
      required: false,
      placeholder: 'Ej: Bloque 1'
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
    submitText: 'Guardar Bloque'
  },
  validation: (formData) => {
    const errors = {};
    
    if (!formData.ID_HORARIO) {
      errors.ID_HORARIO = 'El horario es requerido';
    }
    
    if (!formData.ORDEN || formData.ORDEN <= 0) {
      errors.ORDEN = 'El orden debe ser mayor que 0';
    }
    
    if (!formData.DURACION || formData.DURACION <= 0) {
      errors.DURACION = 'La duración debe ser mayor que 0';
    }
    
    if (!formData.TIPO_BLOQUE) {
      errors.TIPO_BLOQUE = 'El tipo de bloque es requerido';
    }
    
    return errors;
  }
});

export const horarioBloquesTableComponentParameters = (selectedIdHorario) => ({
  showCount: false,
  emptyMessage: 'No hay bloques registrados para este horario',
  variant: 'default',
  striped: true,
  hover: true,
  bordered: true,
  sortable: true,
  selectable: false,
  expandable: false,
  filterable: false,
  pagination: false,
  fit: false,
  itemsPerPage: 10,
  currentPage: 1,
  onPageChange: null,
  fixatedFilters: selectedIdHorario ? [{ column: 'ID_HORARIO', op: '=', value: selectedIdHorario }] : null
});

export const horarioBloquesModalConfig = {
  createTitle: 'Crear Nuevo Bloque',
  editTitle: 'Editar Bloque',
  size: 'medium',
  widthClass: 'w-1/2'
};
