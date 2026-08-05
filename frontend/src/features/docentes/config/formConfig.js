/**
 * Configuración de formulario para DOCENTES
 */
export const docentesFormFields = [
  {
    name: 'ID_USUARIO',
    type: 'reference-select',
    label: 'Usuario',
    required: true,
    referenceTable: 'USUARIOS',
    referenceField: 'ID_USUARIO',
    referenceQuery: '{APELLIDOS} {NOMBRES} (DNI: {DNI})',
    placeholder: 'Seleccione un usuario'
  }
];

export const docentesValidation = {
  ID_USUARIO: {
    required: { value: true, message: 'Debe seleccionar un usuario' }
  }
};

export const docentesModalConfig = {
  createTitle: 'Crear Nuevo Docente',
  editTitle: 'Editar Docente',
  deleteTitle: '¿Eliminar docente?',
  deleteMessage: (row) => `¿Estás seguro de que deseas eliminar al docente "${row?.NOMBRE_COMPLETO}"?`,
  widthClass: 'w-1/2'
};
