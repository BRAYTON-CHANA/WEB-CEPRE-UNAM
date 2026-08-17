/**
 * Configuración de tabla para Permisos (read-only, agrupado por RECURSO)
 * Los permisos se gestionan via SQL seeds. La asignación rol→permiso se hace en la página de roles.
 */
export const tableConfig = {
  tableName: 'VW_PERMISOS'
};

/**
 * Genera el levelConfig para TableMultiLevel (read-only).
 * Nivel 1: agrupa por RECURSO (groupBy)
 * Nivel 2: permisos individuales (solo lectura)
 */
export const getTableLevelConfigs = () => [
  {
    level: 1,
    headers: [
      { title: 'RECURSO', type: 'string', label: 'Recurso', groupBy: true }
    ],
    boundColumn: 'RECURSO',
    actions: {}
  },
  {
    level: 2,
    headers: [
      { title: 'ACCION', type: 'string', label: 'Acción' },
      { title: 'DESCRIPCION', type: 'string', label: 'Descripción' }
    ],
    boundColumn: 'ID_PERMISO',
    actions: {}
  }
];
