/**
 * Configuración de tabla para Docentes (un solo nivel)
 */
export const tableConfig = {
  tableName: 'VW_DOCENTES'
};

/**
 * Genera el levelConfig para TableMultiLevelRender.
 */
export const getTableLevelConfigs = (docentesCrud) => [
  {
    level: 1,
    headers: [
      { title: 'DNI', type: 'string', label: 'DNI' },
      { title: 'NOMBRE_COMPLETO', type: 'string', label: 'Docente', subtitle: { field: 'EMAIL' } },
      { title: 'RUC', type: 'string', label: 'RUC' },
      { title: 'CONDICION_LABORAL', type: 'string', label: 'Condición laboral' },
      { title: 'ACTIVO', type: 'boolean', label: 'Activo', editable: true, targetTable: 'DOCENTES', targetField: 'ACTIVO' }
    ],
    boundColumn: 'ID_DOCENTE',
    actions: {
      edit: {
        enabled: true,
        icon: 'edit',
        label: 'Editar',
        className: 'text-blue-600 hover:bg-blue-100',
        onClick: (row) => docentesCrud.handleEdit(row)
      },
      delete: {
        enabled: true,
        icon: 'trash',
        label: 'Eliminar',
        className: 'text-red-600 hover:bg-red-100',
        onClick: (row) => docentesCrud.handleDelete(row)
      }
    }
  }
];
