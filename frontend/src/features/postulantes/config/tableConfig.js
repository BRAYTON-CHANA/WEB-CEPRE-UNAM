/**
 * Configuración de tabla multinivel para Postulantes
 * 3 niveles con agrupación síncrona: Sede → Grupo → Postulantes
 * Selector de período en el componente padre
 *
 * Usa VW_POSTULANTES que tiene todos los datos unidos:
 * - POSTULANTES + USUARIOS + nombres de FKs (SEDE, GRUPO, CARRERA, PERIODO)
 */
export const tableConfig = {
  tableName: 'VW_POSTULANTES'
};

/**
 * Genera los levelConfigs para TableMultiLevelRender.
 * Nivel 1: Sede (groupBy NOMBRE_SEDE_VACANTE)
 * Nivel 2: Grupo (groupBy CODIGO_GRUPO, botón "+" para añadir postulante)
 * Nivel 3: Postulantes del grupo (CRUD: editar, eliminar)
 */
export const getTableLevelConfigs = (postulantesCrud, handleAddPostulante) => [
  {
    level: 1,
    headers: [
      { title: 'NOMBRE_SEDE_VACANTE', type: 'string', groupBy: true, label: 'Sede' }
    ],
    boundColumn: 'ID_SEDE_VACANTE',
    childCountLabel: { singular: 'grupo', plural: 'grupos' }
  },
  {
    level: 2,
    headers: [
      { title: 'CODIGO_GRUPO', type: 'string', groupBy: true, label: 'Grupo' },
      { title: 'CAPACIDAD_MAXIMA', type: 'number', label: 'Capacidad' },
      { title: 'TOTAL_POSTULANTES', type: 'number', label: 'Postulantes' }
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
      { title: 'DNI', type: 'string' },
      { title: 'NOMBRE_COMPLETO', type: 'string', label: 'Postulante' },
      { title: 'NOMBRE_CARRERA', type: 'string', label: 'Carrera' },
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
