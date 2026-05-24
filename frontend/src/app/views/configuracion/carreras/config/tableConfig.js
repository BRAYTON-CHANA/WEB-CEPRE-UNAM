/**
 * Configuración de tabla multinivel para Carreras
 * 2 niveles: Sede → Carreras
 */
export const tableConfig = {
  tableName: 'VW_CARRERAS_SEDE'
};

/**
 * Genera los levelConfigs para TableMultiLevelRender.
 * Nivel 1: Sede con conteo de carreras (botón "+" para añadir carrera)
 * Nivel 2: Carreras de la sede (CRUD: editar, eliminar)
 */
export const getTableLevelConfigs = (sedesCrud, carrerasCrud, handleAddCarrera) => [
  {
    level: 1,
    field: 'NOMBRE_SEDE',
    headers: [
      { title: 'TOTAL_CARRERAS', type: 'number' }
    ],
    boundColumn: 'ID_SEDE',
    childCountLabel: { singular: 'carrera', plural: 'carreras' },
    actions: {
      addCarrera: {
        enabled: true,
        icon: 'plus',
        label: 'Añadir Carrera',
        className: 'text-green-600 hover:bg-green-100',
        onClick: (row) => handleAddCarrera(row)
      }
    }
  },
  {
    level: 2,
    headers: [
      { title: 'NOMBRE_CARRERA', type: 'string' },
      { title: 'NOMBRE_AREA', type: 'string' },
      { title: 'CARRERA_ACTIVO', type: 'boolean' }
    ],
    boundColumn: 'ID_CARRERA',
    actions: {
      edit: {
        enabled: true,
        icon: 'edit',
        label: 'Editar',
        className: 'text-blue-600 hover:bg-blue-100',
        onClick: (row) => carrerasCrud.handleEdit(row)
      },
      delete: {
        enabled: true,
        icon: 'trash',
        label: 'Eliminar',
        className: 'text-red-600 hover:bg-red-100',
        onClick: (row) => carrerasCrud.handleDelete(row)
      }
    }
  }
];
