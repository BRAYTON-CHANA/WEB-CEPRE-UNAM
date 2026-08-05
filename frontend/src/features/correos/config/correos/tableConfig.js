/**
 * Configuración de tabla para Correos (un solo nivel)
 */
export const tableConfig = {
  tableName: 'VW_CORREOS'
};

/**
 * Genera el levelConfig para TableMultiLevelRender.
 */
export const getTableLevelConfigs = (correosCrud) => [
  {
    level: 1,
    headers: [
      { title: 'TIPO', type: 'string', label: 'Tipo' },
      { title: 'USUARIOS_NOMBRES', type: 'array', label: 'Usuarios' },
      { title: 'DESTINATARIOS', type: 'array', label: 'Destinatarios' },
      { title: 'ASUNTO', type: 'string', label: 'Asunto' },
      { title: 'ESTADO', type: 'string', label: 'Estado' },
      { title: 'PRIORIDAD', type: 'string', label: 'Prioridad' },
      { title: 'FECHA_PROGRAMADA', type: 'string', label: 'Programado' },
      { title: 'CREADO_EN', type: 'string', label: 'Creado' },
      { title: 'ENVIO_AUTOMATICO', type: 'boolean', label: 'Auto' },
      { title: 'BLOQUEADO', type: 'boolean', label: 'Bloqueado' },
      { title: 'PERSONALIZADO', type: 'boolean', label: 'Personalizado' }
    ],
    boundColumn: 'ID_CORREO',
    actions: {
      edit: {
        enabled: true,
        icon: 'edit',
        label: 'Editar',
        className: 'text-blue-600 hover:bg-blue-100',
        onClick: (row) => correosCrud.handleEdit(row)
      },
      delete: {
        enabled: true,
        icon: 'trash',
        label: 'Eliminar',
        className: 'text-red-600 hover:bg-red-100',
        onClick: (row) => correosCrud.handleDelete(row)
      }
    }
  }
];
