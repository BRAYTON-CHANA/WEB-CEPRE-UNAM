/**
 * Configuración de tabla para Tipos de Correo (un solo nivel)
 */
export const tableConfig = {
  tableName: 'TIPOS_CORREO'
};

/**
 * Genera el levelConfig para TableMultiLevelRender.
 */
export const getTableLevelConfigs = (tiposCorreoCrud) => [
  {
    level: 1,
    headers: [
      { title: 'NOMBRE_TIPO', type: 'string', label: 'Nombre' },
      { title: 'DESCRIPCION', type: 'string', label: 'Descripción' },
      { title: 'ENVIO_AUTOMATICO', type: 'boolean', label: 'Envío Auto' },
      { title: 'MULTI_USUARIO', type: 'boolean', label: 'Multi Usuario' },
      { title: 'ACTIVO', type: 'boolean', label: 'Activo' }
    ],
    boundColumn: 'ID_TIPO',
    actions: {
      edit: {
        enabled: true,
        icon: 'edit',
        label: 'Editar',
        className: 'text-blue-600 hover:bg-blue-100',
        onClick: (row) => tiposCorreoCrud.handleEdit(row)
      },
      delete: {
        enabled: true,
        icon: 'trash',
        label: 'Eliminar',
        className: 'text-red-600 hover:bg-red-100',
        onClick: (row) => tiposCorreoCrud.handleDelete(row)
      }
    }
  }
];
