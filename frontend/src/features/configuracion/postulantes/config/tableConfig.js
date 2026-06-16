/**
 * Configuración de tabla multinivel para Postulantes
 * 3 niveles: Sede → Grupo → Postulantes
 * Selector de período en el componente padre
 * 
 * Usa VW_GRUPOS_POSTULANTES que tiene todos los datos:
 * - Sedes con grupos (nivel 1)
 * - Grupos con conteo de postulantes (nivel 2)
 * - Postulantes del grupo (nivel 3)
 */
export const tableConfig = {
  tableName: 'VW_GRUPOS_POSTULANTES'
};

/**
 * Genera los levelConfigs para TableMultiLevelRender.
 * Nivel 1: Sede con conteo de grupos
 * Nivel 2: Grupo con conteo de postulantes (botón "+" para añadir postulante)
 * Nivel 3: Postulantes del grupo (CRUD: editar, eliminar)
 */
export const getTableLevelConfigs = (postulantesCrud, handleAddPostulante) => [
  {
    level: 1,
    field: 'NOMBRE_SEDE',
    headers: [],
    boundColumn: 'ID_SEDE',
    childCountLabel: { singular: 'grupo', plural: 'grupos' }
  },
  {
    level: 2,
    field: 'CODIGO_GRUPO',
    headers: [
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
    level: 3,
    headers: [
      { title: 'APELLIDOS', type: 'string' },
      { title: 'NOMBRES', type: 'string' },
      { title: 'NOMBRE_CARRERA', type: 'string' },
      { title: 'ALUMNO_LIBRE', type: 'boolean' }
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
