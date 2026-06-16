/**
 * Configuración de tabla multinivel para Áreas y Cursos
 */
export const tableConfig = {
  tableName: 'VW_AREAS_CURSOS'
};

/**
 * Genera los levelConfigs para TableMultiLevelRender.
 * Se inyectan los handlers de cada CRUD al momento de uso.
 */
export const getTableLevelConfigs = (areasCrud, areaCursoCrud, handleAddCursoToArea) => [
  {
    level: 1,
    field: 'CODIGO_AREA',
    headers: [
      { title: 'NOMBRE_AREA', type: 'string' },
    ],
    childCountLabel: { singular: 'curso', plural: 'cursos' },
    boundColumn: 'ID_AREA',
    actions: {
      edit: {
        enabled: true,
        icon: 'edit',
        label: 'Editar',
        className: 'text-blue-600 hover:bg-blue-100',
        onClick: (row) => areasCrud.handleEdit(row)
      },
      delete: {
        enabled: true,
        icon: 'trash',
        label: 'Eliminar',
        className: 'text-red-600 hover:bg-red-100',
        onClick: (row) => areasCrud.handleDelete(row)
      },
      addCurso: {
        enabled: true,
        icon: 'plus',
        label: 'Añadir Curso',
        className: 'text-green-600 hover:bg-green-100',
        onClick: (row) => handleAddCursoToArea(row)
      }
    }
  },
  {
    level: 2,
    headers: [
      { title: 'CODIGO', type: 'string' },
      { title: 'NOMBRE_CURSO', type: 'string' }
    ],
    boundColumn: 'ID_CURSO_AREA',
    actions: {
      edit: {
        enabled: true,
        icon: 'edit',
        label: 'Editar',
        className: 'text-blue-600 hover:bg-blue-100',
        onClick: (row) => areaCursoCrud.handleEdit(row)
      },
      delete: {
        enabled: true,
        icon: 'trash',
        label: 'Eliminar',
        className: 'text-red-600 hover:bg-red-100',
        onClick: (row) => areaCursoCrud.handleDelete(row)
      }
    }
  }
];
