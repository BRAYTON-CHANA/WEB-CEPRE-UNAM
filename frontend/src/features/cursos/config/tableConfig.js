/**
 * Configuración de tabla para Cursos (un solo nivel)
 */
export const tableConfig = {
  tableName: 'VW_CURSOS'
};

/**
 * Genera el levelConfig para TableMultiLevelRender.
 */
export const getTableLevelConfigs = (cursosCrud) => [
  {
    level: 1,
    headers: [
      { title: 'CODIGO_CURSO', type: 'string',label:'Codigo Curso' },
      { title: 'NOMBRE_CURSO', type: 'string',label:'Nombre Curso' },
      { title: 'EJE_TEMATICO', type: 'string',label:'Eje Tematico' },
      { title: 'COLOR', type: 'color',label:'Color' },
      { title: 'ACTIVO', type: 'boolean', label: 'Activo', editable: true, targetTable: 'CURSOS', targetField: 'ACTIVO' }
    ],
    boundColumn: 'ID_CURSO',
    actions: {
      edit: {
        enabled: true,
        icon: 'edit',
        label: 'Editar',
        className: 'text-blue-600 hover:bg-blue-100',
        onClick: (row) => cursosCrud.handleEdit(row)
      },
      delete: {
        enabled: true,
        icon: 'trash',
        label: 'Eliminar',
        className: 'text-red-600 hover:bg-red-100',
        onClick: (row) => cursosCrud.handleDelete(row)
      }
    }
  }
];
