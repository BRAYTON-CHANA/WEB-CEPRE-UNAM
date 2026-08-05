/**
 * Configuración de tabla para Asignación Tipo-Correo-Cuenta-Sede (un solo nivel)
 */
export const tableConfig = {
  tableName: 'VW_TIPO_CORREO_CUENTA_SEDE'
};

/**
 * Genera el levelConfig para TableMultiLevelRender.
 */
export const getTableLevelConfigs = (asignacionCrud) => [
  {
    level: 1,
    headers: [
      { title: 'TIPO_CORREO_NOMBRE', type: 'string', label: 'Tipo de Correo' },
      { title: 'CUENTA_NOMBRE', type: 'string', label: 'Cuenta SMTP' },
      { title: 'SEDE_NOMBRE', type: 'string', label: 'Sede' }
    ],
    boundColumn: 'ID_ASIGNACION',
    actions: {
      edit: {
        enabled: true,
        icon: 'edit',
        label: 'Editar',
        className: 'text-blue-600 hover:bg-blue-100',
        onClick: (row) => asignacionCrud.handleEdit(row)
      },
      delete: {
        enabled: true,
        icon: 'trash',
        label: 'Eliminar',
        className: 'text-red-600 hover:bg-red-100',
        onClick: (row) => asignacionCrud.handleDelete(row)
      }
    }
  }
];
