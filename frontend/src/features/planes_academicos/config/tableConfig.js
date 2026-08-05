/**
 * Configuración de tabla multinivel para Plan Académico y Cursos
 */

export const tableConfig = {
  tableName: 'VW_PLAN_ACADEMICO'
};

/**
 * Genera los levelConfigs para TableMultiLevelRender.
 * Se inyectan los handlers de cada CRUD al momento de uso.
 */
export const getPlanAcademicoLevelConfig = (planesCrud, handleAddCursoToPlan) => ({
  level: 1,
  headers: [
    { title: 'DESCRIPCION', type: 'string', groupBy: true, label: 'Plan Académico' },
    { title: 'NOMBRE_AREA', type: 'string', label: 'Área' },
    { title: 'ACTIVO', type: 'boolean', label: 'Activo', editable: true, targetTable: 'PLAN_ACADEMICO', targetField: 'ACTIVO', targetPrimaryKey: 'ID_PLAN' }
  ],
  childCountLabel: { singular: 'curso', plural: 'cursos' },
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
});

export const getPlanAcademicoCursosLevelConfig = (cursosCrud) => ({
  level: 2,
  headers: [
    { title: 'NOMBRE_CURSO', type: 'string', label: 'Curso' },
    { title: 'CODIGO_CURSO', type: 'string', label: 'Código' },
    { title: 'HORAS_ACADEMICAS_CICLO', type: 'number', label: 'H/Ciclo' },
    { title: 'HORAS_ACADEMICAS_TOTALES', type: 'number', label: 'H/Total' },
    { title: 'ACTIVO', type: 'boolean', label: 'Activo', editable: true, targetTable: 'PLAN_ACADEMICO_CURSOS', targetField: 'ACTIVO', targetPrimaryKey: 'ID_PLAN_ACADEMICO_CURSO' }
  ],
  boundColumn: 'ID_PLAN_ACADEMICO_CURSO',
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
});
