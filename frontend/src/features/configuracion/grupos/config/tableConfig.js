/**
 * Configuración de tabla multinivel para Grupos
 * 2 niveles: Sede → Grupo (selector de período en el componente padre)
 */
export const tableConfig = {
  tableName: 'VW_GRUPOS'
};

/**
 * Genera los levelConfigs para TableMultiLevelRender.
 * Nivel 1: Sede (botón "+" para añadir grupo)
 * Nivel 2: Grupo (CRUD completo: editar, eliminar)
 */
export const getTableLevelConfigs = (gruposCrud, handleAddGrupo, handleAsignarPlazas) => [
  {
    level: 1,
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
    level: 2,
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
