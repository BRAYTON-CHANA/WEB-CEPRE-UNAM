/**
 * Configuración de tabla para Password Reset Codes (un solo nivel)
 */
export const tableConfig = {
  tableName: 'VW_PASSWORD_RESET_CODES'
};

/**
 * Genera el levelConfig para TableMultiLevelRender.
 */
export const getTableLevelConfigs = (passwordResetCrud) => [
  {
    level: 1,
    headers: [
      { title: 'DNI', type: 'string', label: 'DNI' },
      { title: 'EMAIL', type: 'string', label: 'Correo' },
      { title: 'CODIGO', type: 'string', label: 'Código' },
      { title: 'CORREO_ASUNTO', type: 'string', label: 'Correo Relacionado' },
      { title: 'EXPIRA_EN', type: 'string', label: 'Expira' },
      { title: 'USADO', type: 'boolean', label: 'Usado' },
      { title: 'FECHA_USO', type: 'string', label: 'Fecha de Uso' },
      { title: 'CREADO_EN', type: 'string', label: 'Creado' }
    ],
    boundColumn: 'ID_RESET',
    actions: {
      edit: {
        enabled: true,
        icon: 'edit',
        label: 'Editar',
        className: 'text-blue-600 hover:bg-blue-100',
        onClick: (row) => passwordResetCrud.handleEdit(row)
      },
      delete: {
        enabled: true,
        icon: 'trash',
        label: 'Eliminar',
        className: 'text-red-600 hover:bg-red-100',
        onClick: (row) => passwordResetCrud.handleDelete(row)
      }
    }
  }
];
