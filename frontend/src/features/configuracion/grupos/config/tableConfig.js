/**
 * Configuración de tabla multinivel para Grupos
 * 2 niveles: Sede → Grupo (selector de período en el componente padre)
 */
export const tableConfig = {
  tableName: 'VW_GRUPOS'
};

/**
 * Columnas para la tabla de asignación de plazas (modal).
 */
export const PLAZAS_COLUMNS = [
  { field: 'NOMBRE_CURSO',          title: 'Curso',         editable: false },
  { field: 'NOMBRE_AREA',          title: 'Nombre Area',  editable: false },
  { field: 'DESCRIPCION_PLAN',      title: 'Plan',          editable: false },
  { field: 'HORAS_ACADEMICAS_CICLO',title: 'Hrs Ciclo',     editable: false },
  {
    field: 'ID_PLAZA_DOCENTE',
    title: 'Plaza / Docente',
    editable: true,
    type: 'function-select',
    functionName: 'fn_plazas_disponibles_por_curso_periodo_sede',
    functionParams: {
      p_id_periodo:      '{ID_PERIODO}',
      p_id_sede:         '{ID_SEDE}',
      p_id_curso:        '{ID_CURSO}',
      p_id_plaza_actual: '{ID_PLAZA_DOCENTE}'
    },
    optionalParams: ['p_id_plaza_actual'],
    valueField: 'id_plaza_docente',
    labelField: '{identificador_docente} - {nombre_curso}',
    descriptionField: '{docente_nombre_completo}',
    placeholder: 'Seleccione una plaza...',
    searchable: true,
    freezeParams: true,
    showRefreshButton: true
  }
];

/**
 * Genera los levelConfigs para TableMultiLevelRender.
 * Nivel 1: Sede (botón "+" para añadir grupo)
 * Nivel 2: Grupo (CRUD completo: editar, eliminar)
 */
export const getTableLevelConfigs = (gruposCrud, handleAddGrupo, handleAsignarPlazas) => [
  {
    level: 1,
    headers: [
      { title: 'NOMBRE_SEDE', type: 'string', groupBy: true, label: 'Sede' }
    ],
    boundColumn: 'ID_SEDE',
    childCountLabel: { singular: 'grupo', plural: 'grupos' },
    actions: {
      addGrupo: {
        enabled: true,
        icon: 'plus',
        label: 'Añadir Grupo',
        className: 'text-green-600 hover:bg-green-100',
        onClick: (row) => handleAddGrupo(row)
      }
    }
  },
  {
    level: 2,
    headers: [
      { title: 'CODIGO_GRUPO', type: 'string' },
      //{ title: 'NOMBRE_GRUPO', type: 'string' },
      { title: 'NOMBRE_AREA', type: 'string' },
      { title: 'NOMBRE_HORARIO', type: 'string' },
      { title: 'NOMBRE_AULA', type: 'string' },
      { title: 'CAPACIDAD_MAXIMA', type: 'number' },
      { title: 'FECHA_INICIO', type: 'string' },
      { title: 'FECHA_TERMINO', type: 'string' },
      { title: 'GRUPO_ACTIVO', type: 'boolean' }
    ],
    boundColumn: 'ID_GRUPO',
    actions: {
      asignarPlazas: {
        enabled: true,
        icon: 'eye',
        label: 'Asignar Plazas',
        className: 'text-purple-600 hover:bg-purple-100',
        onClick: (row) => handleAsignarPlazas(row)
      },
      edit: {
        enabled: true,
        icon: 'edit',
        label: 'Editar',
        className: 'text-blue-600 hover:bg-blue-100',
        onClick: (row) => gruposCrud.handleEdit(row)
      },
      delete: {
        enabled: true,
        icon: 'trash',
        label: 'Eliminar',
        className: 'text-red-600 hover:bg-red-100',
        onClick: (row) => gruposCrud.handleDelete(row)
      }
    }
  }
];
