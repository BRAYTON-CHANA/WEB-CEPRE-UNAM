/**
 * Configuración de tabla para Turnos (un solo nivel)
 */
export const tableConfig = {
  tableName: 'VW_TURNOS'
};

export const TURNO_BLOQUES_CONFIG = {
  viewName: 'VW_TURNO_BLOQUES',
  tableName: 'TURNO_BLOQUES',
  pkField: 'ID_BLOQUE',
  fkField: 'ID_TURNO',
  parentPkField: 'ID_TURNO',
  nombreField: 'NOMBRE_TURNO'
};

export const getTableLevelConfigs = ({ handleEdit, handleDelete, handleEditarBloques }) => [
  {
    level: 1,
    headers: [
      { title: 'CODIGO_PERIODO', type: 'string', label: 'Periodo' },
      { title: 'NOMBRE_SEDE', type: 'string', label: 'Sede' },
      { title: 'NOMBRE_TURNO', type: 'string', label: 'Nombre' },
      { title: 'HORA_INICIO_JORNADA', type: 'string', label: 'Inicio' },
      { title: 'HORA_FIN_JORNADA', type: 'string', label: 'Fin' },
      //{ title: 'NUM_SEMANAS', type: 'number', label: 'Semanas' },
      //{ title: 'DIAS_POR_SEMANA', type: 'number', label: 'Días/Sem' },
      {
        title: 'ACTIVO',
        type: 'boolean',
        label: 'Activo',
        editable: true,
        targetTable: 'TURNOS',
        targetField: 'ACTIVO'
      }
    ],
    boundColumn: 'ID_TURNO',
    actions: {
      edit: {
        enabled: true,
        icon: 'edit',
        label: 'Editar',
        className: 'text-blue-600 hover:bg-blue-100',
        onClick: (row) => handleEdit(row)
      },
      delete: {
        enabled: true,
        icon: 'trash',
        label: 'Eliminar',
        className: 'text-red-600 hover:bg-red-100',
        onClick: (row) => handleDelete(row)
      },
      editarBloques: {
        enabled: true,
        icon: 'edit',
        label: 'Editar Bloques',
        className: 'text-green-600 hover:bg-green-100',
        onClick: (row) => handleEditarBloques(row)
      }
    }
  }
];
