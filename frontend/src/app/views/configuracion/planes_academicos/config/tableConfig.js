/**
 * Configuración de tabla multinivel para Plan Académico y Cursos
 */
export const tableConfig = {
  tableName: 'VW_PLAN_ACADEMICO_CURSOS'
};

/**
 * Genera los levelConfigs para TableMultiLevelRender.
 * Se inyectan los handlers de cada CRUD al momento de uso.
 */
export const getTableLevelConfigs = (planesCrud, planesCursosCrud, handleAddCursoToPlan) => [
  {
    level: 1,
    field: 'DESCRIPCION_PLAN',
    headers: [
      { title: 'ACTIVO_PLAN', type: 'boolean' }

    ],
    boundColumn: 'ID_PLAN',
    actions: {
      edit: {
        enabled: true,
        icon: 'edit',
        label: 'Editar',
        className: 'text-blue-600 hover:bg-blue-100',
        onClick: (row) => planesCrud.handleEdit(row)
      },
      delete: {
        enabled: true,
        icon: 'trash',
        label: 'Eliminar',
        className: 'text-red-600 hover:bg-red-100',
        onClick: (row) => planesCrud.handleDelete(row)
      },
      addCurso: {
        enabled: true,
        icon: 'plus',
        label: 'Añadir Curso',
        className: 'text-green-600 hover:bg-green-100',
        onClick: (row) => handleAddCursoToPlan(row)
      }
    }
  },
  {
    level: 2,
    headers: [
      { title: 'NOMBRE_CURSO', type: 'string' },
      { title: 'HORAS_ACADEMICAS_CICLO', type: 'string' },
      { title: 'HORAS_ACADEMICAS_TOTALES', type: 'string' }
    ],
    boundColumn: 'ID_PLAN_ACADEMICO_CURSO',
    actions: {
      edit: {
        enabled: true,
        icon: 'edit',
        label: 'Editar',
        className: 'text-blue-600 hover:bg-blue-100',
        onClick: (row) => planesCursosCrud.handleEdit(row)
      },
      delete: {
        enabled: true,
        icon: 'trash',
        label: 'Eliminar',
        className: 'text-red-600 hover:bg-red-100',
        onClick: (row) => planesCursosCrud.handleDelete(row)
      }
    }
  }
];
