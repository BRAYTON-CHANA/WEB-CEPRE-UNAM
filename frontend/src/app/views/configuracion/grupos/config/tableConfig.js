/**
 * Configuración de tabla multinivel para Grupos
 * 3 niveles: Periodo → Sede → Grupo
 */
export const tableConfig = {
  tableName: 'VW_GRUPOS'
};

/**
 * Genera los levelConfigs para TableMultiLevelRender.
 * Nivel 1: Periodo (solo visualización, sin actions)
 * Nivel 2: Sede (botón "+" para añadir grupo)
 * Nivel 3: Grupo (CRUD completo: editar, eliminar)
 */
export const getTableLevelConfigs = (gruposCrud, handleAddGrupo, handleAsignarPlazas) => [
  {
    level: 1,
    field: 'CODIGO_PERIODO',
    headers: [
      { title: 'NOMBRE_PERIODO', type: 'string' },
      { title: 'INICIO_PERIODO', type: 'date' },
      { title: 'FIN_PERIODO', type: 'date' }
    ],
    boundColumn: 'ID_PERIODO',
    // Sin acciones para periodos
  },
  {
    level: 2,
    field: 'NOMBRE_SEDE',
    headers: [],
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
    level: 3,
    headers: [
      { title: 'CODIGO_GRUPO', type: 'string' },
      //{ title: 'NOMBRE_GRUPO', type: 'string' },
      { title: 'NOMBRE_AREA', type: 'string' },
      { title: 'NOMBRE_TURNO', type: 'string' },
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
