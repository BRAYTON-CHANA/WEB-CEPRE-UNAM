/**
 * Configuración de tabla para Cuentas SMTP (un solo nivel)
 */
export const tableConfig = {
  tableName: 'CUENTAS_SMTP'
};

/**
 * Genera el levelConfig para TableMultiLevelRender.
 */
export const getTableLevelConfigs = (smtpCrud) => [
  {
    level: 1,
    headers: [
      { title: 'NOMBRE_CUENTA', type: 'string', label: 'Cuenta' },
      { title: 'SMTP_HOST', type: 'string', label: 'Host' },
      { title: 'SMTP_USER', type: 'string', label: 'Usuario' },
      { title: 'ES_CUENTA_DEFAULT', type: 'badge', label: 'Por defecto',
        colorMap: {
          si: 'bg-amber-100 text-amber-700',
          no: 'bg-gray-100 text-gray-400'
        },
        displayValue: (row) => row.ES_CUENTA_DEFAULT ? 'si' : 'no'
      },
      { title: 'ACTIVO', type: 'boolean', label: 'Activo', editable: true, targetTable: 'CUENTAS_SMTP', targetField: 'ACTIVO' },
      { title: 'CREADO_EN', type: 'string', label: 'Creado' }
    ],
    boundColumn: 'ID_CUENTA',
    actions: {
      edit: {
        enabled: true,
        icon: 'edit',
        label: 'Editar',
        className: 'text-blue-600 hover:bg-blue-100',
        onClick: (row) => smtpCrud.handleEdit(row)
      },
      delete: {
        enabled: true,
        icon: 'trash',
        label: 'Eliminar',
        className: 'text-red-600 hover:bg-red-100',
        onClick: (row) => smtpCrud.handleDelete(row)
      }
    }
  }
];
