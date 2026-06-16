/**
 * Configuración de formulario para CARRERAS
 */
export const carreraFormFields = [
  {
    name: 'ID_SEDE',
    type: 'reference-select',
    label: 'Sede',
    required: true,
    referenceTable: 'SEDES',
    referenceField: 'ID_SEDE',
    referenceQuery: '{NOMBRE_SEDE}',
    placeholder: 'Seleccione una sede'
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
    name: 'ACTIVO',
    type: 'boolean',
    label: 'Activo',
    required: false,
    defaultValue: true
  }
];

export const carreraValidation = {
  ID_SEDE: {
    required: { value: true, message: 'La sede es obligatoria' }
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
