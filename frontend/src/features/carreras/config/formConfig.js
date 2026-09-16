/**
 * Configuración de formulario para CARRERAS
 * Nota: la asignación de sedes a carreras se gestiona via la tabla puente CARRERA_SEDE,
 * no desde este formulario. Aquí solo se editan los datos de la plantilla de la carrera.
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
  {
    name: 'ID_SEDES',
    type: 'reference-array',
    label: 'Sedes',
    referenceTable: 'SEDES',
    referenceField: 'ID_SEDE',
    referenceLabelField: 'NOMBRE_SEDE',
    searchable: true,
    placeholder: 'Seleccione las sedes',
    ignoreField: true
  }
];

export const carreraValidation = {
  CODIGO_CARRERA: {
    required: { value: true, message: 'El código de la carrera es obligatorio' }
  },
  ID_AREA: {
    required: { value: true, message: 'El área es obligatoria' }
  },
  NOMBRE_CARRERA: {
    required: { value: true, message: 'El nombre de la carrera es obligatorio' }
  },
  ID_SEDES: {
    required: { value: false, message: 'Debe seleccionar al menos una sede' }
  }
};

export const carreraModalConfig = {
  createTitle: 'Añadir Carrera',
  editTitle: 'Editar Carrera',
  deleteTitle: '¿Eliminar carrera?',
  deleteMessage: (row) => `¿Estás seguro de que deseas eliminar la carrera "${row?.NOMBRE_CARRERA}"?`,
  widthClass: 'w-1/2',
  size: 'md'
};
