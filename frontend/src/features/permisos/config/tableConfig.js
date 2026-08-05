/**
 * Configuración de tabla para Permisos (un solo nivel)
 */
export const tableConfig = {
  tableName: 'VW_PERMISOS'
};

/**
 * Genera el levelConfig para TableMultiLevelRender.
 */
export const getTableLevelConfigs = (permisosCrud) => [
  {
    level: 1,
    headers: [
      { title: 'RECURSO', type: 'string', label: 'Recurso' },
      { title: 'ACCION', type: 'string', label: 'Acción' },
      { title: 'DESCRIPCION', type: 'string', label: 'Descripción' },
      { title: 'ACTIVO', type: 'boolean', label: 'Activo' }
    ],
    boundColumn: 'ID_PERMISO',
    actions: {
      edit: {
        enabled: true,
        icon: 'edit',
        label: 'Editar',
        className: 'text-blue-600 hover:bg-blue-100',
        onClick: (row) => permisosCrud.handleEdit(row)
      },
      delete: {
        enabled: true,
        icon: 'trash',
        label: 'Eliminar',
        className: 'text-red-600 hover:bg-red-100',
        onClick: (row) => permisosCrud.handleDelete(row)
      }
    }
  }
];
