/**
 * Configuración de tabla multinivel para Sedes y Turnos
 */
export const tableConfig = {
  tableName: 'VW_SEDES_TURNOS_HORARIOS'
};

/**
 * Genera los levelConfigs para TableMultiLevelRender.
 * Se inyectan los handlers de cada CRUD al momento de uso.
 * Nivel 1: SEDES — solo visualización, sin editar ni eliminar
 * Nivel 2: TURNOS — CRUD completo
 */
export const getTableLevelConfigs = (turnosCrud, handleAddTurnoToSede) => [
  {
    level: 1,
    field: 'NOMBRE_SEDE',
    headers: [],
    childCountLabel: { singular: 'turno', plural: 'turnos' },
    boundColumn: 'ID_SEDE',
    actions: {
      // Sin edit ni delete para sedes
      addTurno: {
        enabled: true,
        icon: 'plus',
        label: 'Añadir Turno',
        className: 'text-green-600 hover:bg-green-100',
        onClick: (row) => handleAddTurnoToSede(row)
      }
    }
  },
  {
    level: 2,
    headers: [
      { title: 'NOMBRE_TURNO', type: 'string' },
      { title: 'DESCRIPCION', type: 'string' },
      { title: 'NOMBRE_HORARIO', type: 'string' }
    ],
    boundColumn: 'ID_TURNO',
    actions: {
      edit: {
        enabled: true,
        icon: 'edit',
        label: 'Editar',
        className: 'text-blue-600 hover:bg-blue-100',
        onClick: (row) => turnosCrud.handleEdit(row)
      },
      delete: {
        enabled: true,
        icon: 'trash',
        label: 'Eliminar',
        className: 'text-red-600 hover:bg-red-100',
        onClick: (row) => turnosCrud.handleDelete(row)
      }
    }
  }
];
