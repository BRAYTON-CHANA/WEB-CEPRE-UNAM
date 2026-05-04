/**
 * Configuración de tabla multinivel para Sedes y Aulas
 */
export const tableConfig = {
  tableName: 'VW_SEDES_AULAS'
};

/**
 * Genera los levelConfigs para TableMultiLevelRender.
 * Se inyectan los handlers de cada CRUD al momento de uso.
 */
export const getTableLevelConfigs = (sedesCrud, aulasCrud, handleAddAulaFromSede) => [
  {
    level: 1,
    field: 'NOMBRE_SEDE',
    headers: [],
    childCountLabel: { singular: 'aula', plural: 'aulas' },
    boundColumn: 'ID_SEDE',
    actions: {
      edit: {
        enabled: true,
        icon: 'edit',
        label: 'Editar',
        className: 'text-blue-600 hover:bg-blue-100',
        onClick: (row) => sedesCrud.handleEdit(row)
      },
      delete: {
        enabled: true,
        icon: 'trash',
        label: 'Eliminar',
        className: 'text-red-600 hover:bg-red-100',
        onClick: (row) => sedesCrud.handleDelete(row)
      },
      addAula: {
        enabled: true,
        icon: 'plus',
        label: 'Añadir Aula',
        className: 'text-green-600 hover:bg-green-100',
        onClick: (row) => handleAddAulaFromSede(row)
      }
    }
  },
  {
    level: 2,
    headers: [
      { title: 'NOMBRE_AULA', type: 'string' },
      { title: 'UBICACION', type: 'string' },
      { title: 'CAPACIDAD', type: 'number' }
    ],
    boundColumn: 'ID_AULA',
    actions: {
      edit: {
        enabled: true,
        icon: 'edit',
        label: 'Editar',
        className: 'text-blue-600 hover:bg-blue-100',
        onClick: (row) => aulasCrud.handleEdit(row)
      },
      delete: {
        enabled: true,
        icon: 'trash',
        label: 'Eliminar',
        className: 'text-red-600 hover:bg-red-100',
        onClick: (row) => aulasCrud.handleDelete(row)
      }
    }
  }
];
