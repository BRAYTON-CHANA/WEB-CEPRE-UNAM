/**
 * Configuración de tabla para AULAS (nivel 2)
 */

/**
 * Config del nivel 2 (aulas) para TableMultiLevelRender.
 * Se inyectan los handlers de CRUD al momento de uso.
 */
export const getAulasLevelConfig = (aulasCrud) => ({
  level: 2,
  headers: [
    { title: 'NOMBRE_AULA', type: 'string', label: 'Aula' },
    { title: 'UBICACION', type: 'string', label: 'Ubicación' },
    { title: 'CAPACIDAD', type: 'number', label: 'Capacidad' },
    { title: 'ACTIVO', type: 'boolean', label: 'Activo', editable: true, targetTable: 'AULAS', targetField: 'ACTIVO' }
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
});
