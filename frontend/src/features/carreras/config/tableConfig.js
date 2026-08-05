/**
 * Configuración de tabla para Carreras (un solo nivel)
 */
export const tableConfig = {
  tableName: 'VW_CARRERAS'
};

/**
 * Genera el levelConfig para TableMultiLevelRender.
 */
export const getTableLevelConfigs = (carrerasCrud) => [
  {
    level: 1,
    headers: [
      { title: 'NOMBRE_CARRERA', type: 'string', label: 'Carrera' },
      { title: 'NOMBRE_AREA', type: 'string', label: 'Área' },
      { title: 'SEDES_NOMBRES', type: 'array', label: 'Sedes' },
      { title: 'ACTIVO', type: 'boolean', label: 'Activo', editable: true, targetTable: 'CARRERAS', targetField: 'ACTIVO' }
    ],
    boundColumn: 'ID_CARRERA',
    actions: {
      edit: {
        enabled: true,
        icon: 'edit',
        label: 'Editar',
        className: 'text-blue-600 hover:bg-blue-100',
        onClick: (row) => carrerasCrud.handleEdit(row)
      },
      delete: {
        enabled: true,
        icon: 'trash',
        label: 'Eliminar',
        className: 'text-red-600 hover:bg-red-100',
        onClick: (row) => carrerasCrud.handleDelete(row)
      }
    }
  }
];
