/**
 * Configuración de tabla para Periodos (un solo nivel)
 */
export const tableConfig = {
  tableName: 'PERIODOS'
};

/**
 * Genera el levelConfig para TableMultiLevelRender.
 */
export const getTableLevelConfigs = (periodosCrud) => [
  {
    level: 1,
    headers: [
      { title: 'CODIGO_PERIODO', type: 'string' },
      { title: 'NOMBRE_PERIODO', type: 'string' },
      { title: 'FECHA_INICIO', type: 'date' },
      { title: 'FECHA_FIN', type: 'date' },
      { title: 'ACTIVO', type: 'boolean' }
    ],
    boundColumn: 'ID_PERIODO',
    actions: {
      edit: {
        enabled: true,
        icon: 'edit',
        label: 'Editar',
        className: 'text-blue-600 hover:bg-blue-100',
        onClick: (row) => periodosCrud.handleEdit(row)
      },
      delete: {
        enabled: true,
        icon: 'trash',
        label: 'Eliminar',
        className: 'text-red-600 hover:bg-red-100',
        onClick: (row) => periodosCrud.handleDelete(row)
      }
    }
  }
];
