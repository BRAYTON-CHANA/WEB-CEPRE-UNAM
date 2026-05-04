/**
 * Configuración de tabla multinivel para Horarios y Bloques
 */
export const tableConfig = {
  tableName: 'VW_HORARIO_BLOQUES'
};

/**
 * Genera los levelConfigs para TableMultiLevelRender.
 * Se inyectan los handlers de cada CRUD al momento de uso.
 */
export const getTableLevelConfigs = (horariosCrud, bloquesCrud, handleAddBloqueToHorario, handleViewPlantilla) => [
  {
    level: 1, 
    field: 'NOMBRE_HORARIO',
    headers: [
      { title: 'HORA_INICIO_JORNADA', type: 'string' },
      { title: 'HORA_FIN_JORNADA', type: 'string' }
    ],
    childCountLabel: { singular: 'bloque', plural: 'bloques' },
    boundColumn: 'ID_HORARIO',
    actions: {
      edit: {
        enabled: true,
        icon: 'edit',
        label: 'Editar',
        className: 'text-blue-600 hover:bg-blue-100',
        onClick: (row) => horariosCrud.handleEdit(row)
      },
      delete: {
        enabled: true,
        icon: 'trash',
        label: 'Eliminar',
        className: 'text-red-600 hover:bg-red-100',
        onClick: (row) => horariosCrud.handleDelete(row)
      },
      addBloque: {
        enabled: true,
        icon: 'plus',
        label: 'Añadir Bloque',
        className: 'text-green-600 hover:bg-green-100',
        onClick: (row) => handleAddBloqueToHorario(row)
      },
      verPlantilla: {
        enabled: true,
        icon: 'eye',
        label: 'Ver Plantilla',
        className: 'text-purple-600 hover:bg-purple-100',
        onClick: (row) => handleViewPlantilla(row)
      }
    }
  },
  {
    level: 2,
    headers: [
      { title: 'ORDEN', type: 'string' },
      { title: 'DURACION', type: 'string' },
      { title: 'TIPO_BLOQUE', type: 'string' },
      { title: 'ETIQUETA', type: 'string' }
    ],
    boundColumn: 'ID_BLOQUE',
    actions: {
      edit: {
        enabled: true,
        icon: 'edit',
        label: 'Editar',
        className: 'text-blue-600 hover:bg-blue-100',
        onClick: (row) => bloquesCrud.handleEdit(row)
      },
      delete: {
        enabled: true,
        icon: 'trash',
        label: 'Eliminar',
        className: 'text-red-600 hover:bg-red-100',
        onClick: (row) => bloquesCrud.handleDelete(row)
      }
    }
  }
];
