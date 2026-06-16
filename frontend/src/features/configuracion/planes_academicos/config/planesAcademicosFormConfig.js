export const planesAcademicosFormFields = [
  {
    name: 'ID_AREA',
    type: 'reference-select',
    label: 'Área',
    required: true,
    referenceTable: 'AREAS',
    referenceField: 'ID_AREA',
    referenceQuery: '{CODIGO_AREA} - {NOMBRE_AREA}',
    referenceFilters: [
      { field: 'ACTIVO', op: '=', value: 1 }
    ],
    placeholder: 'Seleccione un área'
  },
  {
    name: 'DESCRIPCION',
    type: 'text',
    label: 'Descripción del Plan',
    required: true,
    placeholder: 'Ej: Plan Académico 2025 - Ciclo 1'
  },
  {
    name: 'ACTIVO',
    type: 'boolean',
    label: 'Activo',
    required: false,
    defaultValue: true
  }
];

export const planesAcademicosMultiStep = {
  showDots: false,
  persistData: false,
  submitText: 'Guardar Plan Académico'
};

export const planesAcademicosValidation = {
  ID_AREA: {
    required: { value: true, message: 'Debe seleccionar un área' }
  },
  DESCRIPCION: {
    required: { value: true, message: 'La descripción es obligatoria' }
  }
};

export const planesAcademicosModalConfig = {
  createTitle: 'Crear Nuevo Plan Académico',
  editTitle: 'Editar Plan Académico',
  deleteTitle: '¿Eliminar plan académico?',
  deleteMessage: (row) => `¿Estás seguro de que deseas eliminar el plan "${row?.DESCRIPCION || row?.DESCRIPCION_PLAN}"?`,
  widthClass: 'w-1/2'
};
