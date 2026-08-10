/**
 * Configuración de tabla para Periodos (un solo nivel)
 */
export const tableConfig = {
  tableName: 'PERIODOS'
};

/**
 * Genera el levelConfig para TableMultiLevelRender.
 */
export const getTableLevelConfigs = ({ handleEdit, handleDelete }) => [
  {
    level: 1,
    headers: [
      { title: 'CODIGO_PERIODO', type: 'string', label: 'Código' },
      { title: 'NOMBRE_PERIODO', type: 'string', label: 'Nombre' },
      { title: 'FECHA_INICIO', type: 'date', label: 'Fecha Inicio' },
      { title: 'FECHA_FIN', type: 'date', label: 'Fecha Fin' },
      { title: 'ACTIVO', type: 'boolean', label: 'Activo', editable: true, targetTable: 'PERIODOS', targetField: 'ACTIVO' }
    ],
    boundColumn: 'ID_PERIODO',
    actions: {
      edit: {
        enabled: true,
        icon: 'edit',
        label: 'Editar',
        className: 'text-blue-600 hover:bg-blue-100',
        onClick: (row) => handleEdit(row)
      },
      delete: {
        enabled: true,
        icon: 'trash',
        label: 'Eliminar',
        className: 'text-red-600 hover:bg-red-100',
        onClick: (row) => handleDelete(row)
      }
    }
  }
];
