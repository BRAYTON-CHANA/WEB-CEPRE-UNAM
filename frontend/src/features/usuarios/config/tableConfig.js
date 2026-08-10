/**
 * Configuración de tabla para Usuarios (un solo nivel)
 */
export const tableConfig = {
  tableName: 'VW_USUARIOS'
};

/**
 * Genera el levelConfig para TableMultiLevelRender.
 */
export const getTableLevelConfigs = ({ usuariosCrud, onResetPassword, onVerPerfil }) => [
  {
    level: 1,
    headers: [
      { title: 'DNI', type: 'string', label: 'DNI' },
      { title: 'APELLIDOS', type: 'string', label: 'Apellidos' },
      { title: 'NOMBRES', type: 'string', label: 'Nombres' },
      { title: 'EMAIL', type: 'string', label: 'Email' },
      { title: 'ROLES_NOMBRES', type: 'array', label: 'Roles' },
      { title: 'ACTIVO', type: 'boolean', label: 'Activo', editable: true, targetTable: 'USUARIOS', targetField: 'ACTIVO', targetPrimaryKey: 'ID_USUARIO' }
    ],
    boundColumn: 'ID_USUARIO',
    actions: {
      edit: {
        enabled: true,
        icon: 'edit',
        label: 'Editar',
        className: 'text-blue-600 hover:bg-blue-100',
        onClick: (row) => usuariosCrud.handleEdit(row)
      },
      delete: {
        enabled: true,
        icon: 'trash',
        label: 'Eliminar',
        className: 'text-red-600 hover:bg-red-100',
        onClick: (row) => usuariosCrud.handleDelete(row)
      },
      dropdown: [
        {
          enabled: true,
          icon: 'user',
          label: 'Ver perfil',
          className: 'text-slate-900 hover:bg-slate-100',
          onClick: (row) => onVerPerfil(row)
        },
        {
          enabled: true,
          icon: 'shield',
          label: 'Reiniciar contraseña',
          className: 'text-slate-900 hover:bg-slate-100',
          showIf: (row) => !!row.DNI,
          onClick: (row) => onResetPassword(row)
        }
      ]
    }
  }
];
