/**
 * Configuración de tabla para Fechas Bloqueadas
 */
export const tableConfig = {
  tableName: 'VW_FECHAS_BLOQUEADAS'
};

export const getTableLevelConfigs = ({ handleEdit, handleDelete }) => [
  {
    level: 1,
    headers: [
      { title: 'CODIGO_PERIODO', type: 'string', label: 'Periodo' },
      { title: 'NOMBRE_PERIODO', type: 'string', label: 'Nombre Periodo' },
      { title: 'FECHA', type: 'date', label: 'Fecha' },
      { title: 'DESCRIPCION', type: 'string', label: 'Descripción' }
    ],
    boundColumn: 'ID_FECHA_BLOQUEADA',
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
