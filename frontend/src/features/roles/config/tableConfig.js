/**
 * Configuración de tabla para Roles (un solo nivel)
 */
export const tableConfig = {
  tableName: 'VW_ROLES'
};

/**
 * Genera el levelConfig para TableMultiLevelRender.
 * @param {Object} rolesCrud - hooks CRUD de roles
 * @param {Function} handleEditPermisos - callback para abrir modal de permisos
 */
export const getTableLevelConfigs = (rolesCrud, handleEditPermisos) => [
  {
    level: 1,
    headers: [
      { title: 'NOMBRE_ROL', type: 'string', label: 'Nombre del Rol' },
      { title: 'DESCRIPCION', type: 'string', label: 'Descripción' },
      { title: 'NIVEL_ACCESO', type: 'string', label: 'Nivel de Acceso' },
      { title: 'ES_SISTEMA', type: 'badge', label: 'Tipo',
        colorMap: {
          sistema: 'bg-amber-100 text-amber-700',
          custom: 'bg-gray-100 text-gray-500'
        },
        displayValue: (row) => row.ES_SISTEMA ? 'Sistema' : 'Custom'
      },
      { title: 'ACTIVO', type: 'boolean', label: 'Activo', editable: true, targetTable: 'ROLES', targetField: 'ACTIVO', blocked: { field: 'ES_SISTEMA', op: '==', value: true } }
    ],
    boundColumn: 'ID_ROL',
    actions: {
      edit: {
        enabled: true,
        icon: 'edit',
        label: 'Editar',
        className: 'text-blue-600 hover:bg-blue-100',
        showIf: (row) => !row?.ES_SISTEMA,
        onClick: (row) => rolesCrud.handleEdit(row)
      },
      delete: {
        enabled: true,
        icon: 'trash',
        label: 'Eliminar',
        className: 'text-red-600 hover:bg-red-100',
        showIf: (row) => !row?.ES_SISTEMA,
        onClick: (row) => rolesCrud.handleDelete(row)
      },
      custom: [
        {
          enabled: true,
          icon: 'shield',
          label: 'Editar Permisos',
          className: 'text-indigo-600 hover:bg-indigo-50',
          onClick: (row) => handleEditPermisos(row)
        }
      ]
    }
  }
];
