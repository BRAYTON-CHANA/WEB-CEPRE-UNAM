/**
 * Configuración de formulario para PERMISOS
 */
export const permisosFormFields = [
  {
    name: 'RECURSO',
    type: 'text',
    label: 'Recurso',
    required: true,
    placeholder: 'Ej: usuarios'
  },
  {
    name: 'ACCION',
    type: 'text',
    label: 'Acción',
    required: true,
    placeholder: 'Ej: crear'
  },
  {
    name: 'DESCRIPCION',
    type: 'text',
    label: 'Descripción',
    required: false,
    placeholder: 'Ej: Permite crear usuarios'
  },
  {
    name: 'ACTIVO',
    type: 'boolean',
    label: 'Activo',
    required: false,
    defaultValue: true
  }
];

export const permisosValidation = {
  RECURSO: {
    required: { value: true, message: 'El recurso es obligatorio' }
  },
  ACCION: {
    required: { value: true, message: 'La acción es obligatoria' }
  }
};

export const permisosModalConfig = {
  createTitle: 'Crear Nuevo Permiso',
  editTitle: 'Editar Permiso',
  deleteTitle: '¿Eliminar permiso?',
  deleteMessage: (row) => `¿Estás seguro de que deseas eliminar el permiso "${row?.RECURSO}:${row?.ACCION}"?`,
  widthClass: 'w-1/2'
};
