/**
 * Configuración de la tabla de reportes de grupos
 */

export const tableConfig = {
  tableName: 'VW_GRUPOS',
  primaryKey: 'ID_GRUPO'
};

export const levelConfigs = [
  {
    level: 1,
    headers: [
      { title: 'CODIGO_GRUPO', type: 'string' },
      { title: 'NOMBRE_GRUPO', type: 'string' },
      { title: 'CAPACIDAD_MAXIMA', type: 'number' },
      { title: 'FECHA_INICIO', type: 'date' },
      { title: 'FECHA_TERMINO', type: 'date' }
    ],
    boundColumn: 'ID_GRUPO'
  }
];
