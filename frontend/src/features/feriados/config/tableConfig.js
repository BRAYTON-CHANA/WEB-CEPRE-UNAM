/**
 * Configuración de tabla para Feriados (un solo nivel)
 * Usa VW_FERIADOS que incluye CODIGO_PERIODO y NOMBRE_PERIODO.
 * La escritura se realiza sobre la tabla FERIADOS.
 */
export const tableConfig = {
  tableName: 'VW_FERIADOS'
};

/**
 * Genera el levelConfig para TableMultiLevelRender.
 */
export const getTableLevelConfigs = ({ handleEdit, handleDelete }) => [
  {
    level: 1,
    headers: [
      { title: 'NOMBRE_PERIODO', type: 'string', label: 'Periodo' },
      { title: 'FECHA', type: 'date', label: 'Fecha' },
      { title: 'DESCRIPCION', type: 'string', label: 'Descripción' }
    ],
    boundColumn: 'ID_FERIADO',
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
