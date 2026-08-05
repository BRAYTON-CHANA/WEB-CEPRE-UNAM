/**
 * Configuración de tabla para Áreas (un solo nivel)
 */
export const tableConfig = {
  tableName: 'AREAS'
};

/**
 * Genera el levelConfig para TableMultiLevelRender.
 */
export const getTableLevelConfigs = (areasCrud) => [
  {
    level: 1,
    headers: [
      { title: 'CODIGO_AREA', type: 'string', label: 'Código Área' },
      { title: 'NOMBRE_AREA', type: 'string', label: 'Nombre Área' },
      { title: 'ACTIVO', type: 'boolean', label: 'Activo', editable: true, targetTable: 'AREAS', targetField: 'ACTIVO' }
    ],
    boundColumn: 'ID_AREA',
    actions: {
      edit: {
        enabled: true,
        icon: 'edit',
        label: 'Editar',
        className: 'text-blue-600 hover:bg-blue-100',
        onClick: (row) => areasCrud.handleEdit(row)
      },
      delete: {
        enabled: true,
        icon: 'trash',
        label: 'Eliminar',
        className: 'text-red-600 hover:bg-red-100',
        onClick: (row) => areasCrud.handleDelete(row)
      }
    }
  }
];
