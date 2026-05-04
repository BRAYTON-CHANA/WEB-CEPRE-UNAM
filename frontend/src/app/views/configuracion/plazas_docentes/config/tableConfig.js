/**
 * Configuración de tabla multinivel para Plazas Docentes
 * 3 niveles: Periodo → Sede → Plaza Docente
 */
export const tableConfig = {
  tableName: 'VW_PERIODOS_SEDES_PLAZAS'
};

/**
 * Genera los levelConfigs para TableMultiLevelRender.
 * Nivel 1: Periodo (solo visualización, sin actions)
 * Nivel 2: Sede (botón "+" para añadir plaza docente)
 * Nivel 3: Plaza Docente (CRUD completo: editar, eliminar)
 */
export const getTableLevelConfigs = (plazasCrud, handleAddPlaza) => [
  {
    level: 1,
    field: 'CODIGO_PERIODO',
    //childCountLabel: { singular: 'sede', plural: 'sedes' },
    headers: [
      { title: 'NOMBRE_PERIODO', type: 'string' },
      { title: 'FECHA_INICIO', type: 'date' },
      { title: 'FECHA_FIN', type: 'date' }
    ],
    boundColumn: 'ID_PERIODO',
    // Sin acciones para periodos
  },
  {
    level: 2,
    field: 'NOMBRE_SEDE',
    headers: [],
    boundColumn: 'ID_SEDE',
    childCountLabel: { singular: 'plaza', plural: 'plazas' },
    actions: {
      addPlaza: {
        enabled: true,
        icon: 'plus',
        label: 'Añadir Plaza',
        className: 'text-green-600 hover:bg-green-100',
        onClick: (row) => handleAddPlaza(row)
      }
    }
  },
  {
    level: 3,
    headers: [
      { title: 'IDENTIFICADOR_DOCENTE', type: 'string' },
      { title: 'NOMBRE_DOCENTE', type: 'string' },
      { title: 'NOMBRE_CURSO', type: 'string' },
      { title: 'PAGO_POR_HORA', type: 'number' },
      { title: 'PLAZA_ACTIVO', type: 'boolean' }
    ],
    boundColumn: 'ID_PLAZA_DOCENTE',
    actions: {
      edit: {
        enabled: true,
        icon: 'edit',
        label: 'Editar',
        className: 'text-blue-600 hover:bg-blue-100',
        onClick: (row) => plazasCrud.handleEdit(row)
      },
      delete: {
        enabled: true,
        icon: 'trash',
        label: 'Eliminar',
        className: 'text-red-600 hover:bg-red-100',
        onClick: (row) => plazasCrud.handleDelete(row)
      }
    }
  }
];
