import AddUsuarioForm from '@/features/docentes/components/AddUsuarioForm';

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
    referenceDisplayFields: [
      { field: 'EMAIL', label: 'Email' },
      { field: 'TELEFONO', label: 'Teléfono' },
      { field: 'DIRECCION', label: 'Dirección' },
      { field: 'FECHA_NACIMIENTO', label: 'Fecha de nacimiento' },
      { field: 'SEXO', label: 'Sexo' }
    ],
    showRefreshButton: true,
    showAddButton: true,
    addModalTitle: 'Nuevo usuario',
    addModalSize: 'lg',
    addComponent: AddUsuarioForm,
    placeholder: 'Seleccione un usuario'
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
