/**
 * Configuración de formulario para CARRERAS
 */
export const carreraFormFields = [
  {
    name: 'CODIGO_CARRERA',
    type: 'text',
    label: 'Código de Carrera',
    required: true,
    placeholder: 'Ej: INGCIV, GPDS'
  },
  {
    name: 'ID_SEDES',
    type: 'reference-array',
    label: 'Sedes',
    required: true,
    referenceTable: 'SEDES',
    referenceField: 'ID_SEDE',
    referenceLabelField: 'NOMBRE_SEDE',
    searchable: true,
    placeholder: 'Seleccionar sedes...',
    showRefreshButton: true
  },
  {
    name: 'ID_AREA',
    type: 'reference-select',
    label: 'Área',
    required: true,
    referenceTable: 'AREAS',
    referenceField: 'ID_AREA',
    referenceQuery: '{NOMBRE_AREA}',
    placeholder: 'Seleccione un área'
  },
  {
    name: 'NOMBRE_CARRERA',
    type: 'text',
    label: 'Nombre de Carrera',
    required: true,
    placeholder: 'Ej: Medicina Humana'
  },
];

export const carreraValidation = {
  CODIGO_CARRERA: {
    required: { value: true, message: 'El código de la carrera es obligatorio' }
  },
  ID_SEDES: {
    required: { value: true, message: 'Debe seleccionar al menos una sede' }
  },
  ID_AREA: {
    required: { value: true, message: 'El área es obligatoria' }
  },
  NOMBRE_CARRERA: {
    required: { value: true, message: 'El nombre de la carrera es obligatorio' }
  }
};

export const carreraModalConfig = {
  createTitle: 'Añadir Carrera',
  editTitle: 'Editar Carrera',
  deleteTitle: '¿Eliminar carrera?',
  deleteMessage: (row) => `¿Estás seguro de que deseas eliminar la carrera "${row?.NOMBRE_CARRERA}"?`,
  widthClass: 'w-1/2'
};
