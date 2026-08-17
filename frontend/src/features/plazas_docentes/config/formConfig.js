/**
 * Configuración de formulario para PLAZA_DOCENTE
 */
export const plazaFormFields = [
  {
    name: 'ID_PERIODO',
    type: 'reference-select',
    label: 'Periodo',
    required: true,
    referenceTable: 'PERIODOS',
    referenceField: 'ID_PERIODO',
    referenceQuery: '{NOMBRE_PERIODO}',
    placeholder: 'Seleccione un periodo'
  },
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
    name: 'ID_CURSO',
    type: 'reference-select',
    label: 'Curso',
    required: true,
    referenceTable: 'CURSOS',
    referenceField: 'ID_CURSO',
    referenceQuery: '{NOMBRE_CURSO}',
    placeholder: 'Seleccione un curso'
  },
  {
    name: 'PAGO_POR_HORA',
    type: 'number',
    label: 'Pago por Hora',
    required: true,
    placeholder: '0.00'
  }
];

export const plazaMultiStep = {
  showDots: true,
  persistData: false,
  nextText: 'Siguiente',
  prevText: 'Atrás',
  submitText: 'Guardar Plaza'
};

export const plazaValidation = {
  ID_PERIODO: {
    required: { value: true, message: 'El periodo es obligatorio' }
  },
  ID_SEDE: {
    required: { value: true, message: 'La sede es obligatoria' }
  },
  ID_CURSO: {
    required: { value: true, message: 'El curso es obligatorio' }
  },
  PAGO_POR_HORA: {
    required: { value: true, message: 'El pago por hora es obligatorio' }
  }
};

export const plazaModalConfig = {
  createTitle: 'Crear Nueva Plaza Docente',
  editTitle: 'Editar Plaza Docente',
  deleteTitle: '¿Eliminar plaza docente?',
  deleteMessage: (row) => `¿Estás seguro de que deseas eliminar la plaza "${row?.IDENTIFICADOR_DOCENTE}"?`,
  widthClass: 'w-1/2'
};
