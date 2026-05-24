/**
 * Configuración de tabla multinivel para Postulantes
 * 2 niveles: Grupo (con conteo) → Postulantes
 * Selector de período en el componente padre
 * 
 * Usa VW_GRUPOS_POSTULANTES que tiene todos los datos:
 * - Grupos con conteo de postulantes (nivel 1)
 * - Postulantes del grupo (nivel 2)
 */
export const tableConfig = {
  tableName: 'VW_GRUPOS_POSTULANTES'
};

/**
 * Genera los levelConfigs para TableMultiLevelRender.
 * Nivel 1: Grupo con conteo de postulantes (botón "+" para añadir postulante)
 * Nivel 2: Postulantes del grupo (CRUD: editar, eliminar)
 */
export const getTableLevelConfigs = (postulantesCrud, handleAddPostulante) => [
  {
    level: 1,
    field: 'CODIGO_GRUPO',
    headers: [
      //{ title: 'NOMBRE_GRUPO', type: 'string' },
      { title: 'NOMBRE_SEDE', type: 'string' },
      //{ title: 'NOMBRE_AREA', type: 'string' },
      //{ title: 'NOMBRE_TURNO', type: 'string' },
      { title: 'CAPACIDAD_MAXIMA', type: 'number' },
      { title: 'TOTAL_POSTULANTES', type: 'number' }
    ],
    boundColumn: 'ID_GRUPO',
    childCountLabel: { singular: 'postulante', plural: 'postulantes' },
    actions: {
      addPostulante: {
        enabled: true,
        icon: 'plus',
        label: 'Añadir Postulante',
        className: 'text-green-600 hover:bg-green-100',
        onClick: (row) => handleAddPostulante(row)
      }
    }
  },
  {
    level: 2,
    headers: [
      { title: 'APELLIDOS', type: 'string' },
      { title: 'NOMBRES', type: 'string' },
      { title: 'NOMBRE_CARRERA', type: 'string' },
      { title: 'ALUMNO_LIBRE', type: 'boolean' },
      //{ title: 'POSTULANTE_ACTIVO', type: 'boolean' }
    ],
    boundColumn: 'ID_POSTULANTE',
    actions: {
      edit: {
        enabled: true,
        icon: 'edit',
        label: 'Editar',
        className: 'text-blue-600 hover:bg-blue-100',
        onClick: (row) => postulantesCrud.handleEdit(row)
      },
      delete: {
        enabled: true,
        icon: 'trash',
        label: 'Eliminar',
        className: 'text-red-600 hover:bg-red-100',
        onClick: (row) => postulantesCrud.handleDelete(row)
      }
    }
  }
];
