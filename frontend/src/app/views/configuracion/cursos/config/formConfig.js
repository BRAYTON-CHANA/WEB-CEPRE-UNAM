/**
 * Configuración de formulario para CURSOS
 */
export const cursosFormFields = [
  {
    name: 'CODIGO_CURSO',
    type: 'text',
    label: 'Código del Curso',
    required: true,
    placeholder: 'Ej: MAT-I, RM'
  },
  {
    name: 'NOMBRE_CURSO',
    type: 'text',
    label: 'Nombre del Curso',
    required: true,
    placeholder: 'Ej: MATEMATICA I, RAZONAMIENTO MATEMATICO'
  },
  {
    name: 'EJE_TEMATICO',
    type: 'unique-select',
    label: 'Eje Temático',
    required: true,
    tableName: 'CURSOS',
    columnName: 'EJE_TEMATICO',
    allowCreate: true,
    createTitle: 'Agregar Nuevo Eje Temático',
    searchable: false
  },
 
];

export const cursosMultiStep = {
  showDots: true,
  persistData: false,
  nextText: 'Siguiente',
  prevText: 'Atrás',
  submitText: 'Guardar Curso'
};

export const cursosValidation = {
  CODIGO_CURSO: {
    required: { value: true, message: 'El código del curso es requerido' }
  },
  NOMBRE_CURSO: {
    required: { value: true, message: 'El nombre del curso es requerido' }
  },
  EJE_TEMATICO: {
    required: { value: true, message: 'El eje temático es requerido' }
  }
};

export const cursosModalConfig = {
  createTitle: 'Crear Nuevo Curso',
  editTitle: 'Editar Curso',
  deleteTitle: '¿Eliminar curso?',
  deleteMessage: (row) => `¿Estás seguro de que deseas eliminar el curso "${row?.NOMBRE_CURSO}"?`,
  widthClass: 'w-1/2'
};
