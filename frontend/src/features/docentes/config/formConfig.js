import AddUsuarioForm from '@/features/docentes/components/AddUsuarioForm';

/**
 * Configuración de formulario para DOCENTES
 */
export const docentesFormFields = [
  {
    name: 'ID_DOCENTE',
    type: 'text',
    hidden: true,
    required: false
  },
  {
    name: 'ID_USUARIO',
    type: 'function-select',
    label: 'Usuario',
    required: true,
    functionName: 'fn_usuarios_disponibles_docente',
    functionParams: {
      p_id_docente_actual: '{ID_DOCENTE}'
    },
    optionalParams: ['p_id_docente_actual'],
    valueField: 'id_usuario',
    labelField: 'nombre_completo',
    descriptionField: 'dni',
    statusField: 'estado_usuario',
    searchable: true,
    showRefreshButton: true,
    showAddButton: true,
    addModalTitle: 'Nuevo usuario',
    addModalSize: 'lg',
    addComponent: AddUsuarioForm,
    placeholder: 'Seleccione un usuario',
    displayFields: [
      { field: 'dni', label: 'DNI' },
      { field: 'fecha_nacimiento', label: 'F. Nacimiento' },
      { field: 'edad', label: 'Edad' },
      { field: 'sexo', label: 'Sexo' },
      { field: 'telefono', label: 'Teléfono' },
      { field: 'email', label: 'Email' },
      { field: 'direccion', label: 'Dirección' }
    ]
  },
  {
    name: 'RUC',
    type: 'text',
    label: 'RUC',
    required: true,
    placeholder: 'Ej: 11111111111',
    maxLength: 20
  },
  {
    name: 'CONDICION_LABORAL',
    type: 'select',
    label: 'Condición laboral',
    required: true,
    options: [
      { value: 'CONTRATADO', label: 'Contratado' },
      { value: 'EXTERNO', label: 'Externo' }
    ]
  }
];

export const docentesValidation = {
  ID_USUARIO: {
    required: { value: true, message: 'Debe seleccionar un usuario' }
  },
  RUC: {
    required: { value: true, message: 'El RUC es obligatorio' }
  },
  CONDICION_LABORAL: {
    required: { value: true, message: 'La condición laboral es obligatoria' }
  }
};

export const docentesModalConfig = {
  createTitle: 'Crear Nuevo Docente',
  editTitle: 'Editar Docente',
  deleteTitle: '¿Eliminar docente?',
  deleteMessage: (row) => `¿Estás seguro de que deseas eliminar al docente "${row?.NOMBRE_COMPLETO}"?`,
  widthClass: 'w-1/2'
};
