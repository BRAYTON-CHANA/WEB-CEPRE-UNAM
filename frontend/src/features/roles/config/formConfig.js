/**
 * Configuración de formulario para ROLES
 * Nota: ID_PERMISOS se edita via ArrayEditorModal (acción "Editar Permisos" en tabla)
 *       ES_SISTEMA no es editable desde el form (se gestiona a nivel BD)
 */
export const rolesFormFields = [
  {
    name: 'NOMBRE_ROL',
    type: 'text',
    label: 'Nombre del Rol',
    required: true,
    placeholder: 'Ej: administrador'
  },
  {
    name: 'DESCRIPCION',
    type: 'text',
    label: 'Descripción',
    required: false,
    placeholder: 'Ej: Acceso total al sistema'
  },
  {
    name: 'NIVEL_ACCESO',
    type: 'number',
    label: 'Nivel de Acceso',
    required: false,
    defaultValue: 1,
    placeholder: '1'
  }
];

export const rolesValidation = {
  NOMBRE_ROL: {
    required: { value: true, message: 'El nombre del rol es obligatorio' }
  }
};

export const rolesModalConfig = {
  createTitle: 'Crear Nuevo Rol',
  editTitle: 'Editar Rol',
  deleteTitle: '¿Eliminar rol?',
  deleteMessage: (row) => `¿Estás seguro de que deseas eliminar el rol "${row?.NOMBRE_ROL}"?`,
  widthClass: 'w-1/2'
};
