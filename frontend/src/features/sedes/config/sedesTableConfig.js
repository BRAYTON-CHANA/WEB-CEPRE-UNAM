/**
 * Configuración de tabla para SEDES (nivel 1) + header
 */

export const tableConfig = {
  tableName: 'SEDES'
};

export const headerProps = {
  headerTitle: 'Infraestructura',
  headerDescription: 'Administra las sedes académicas e infraestructura física, virtual e híbrida'
};

export const getHeaderActions = (sedesCrud) => [
  {
    text: 'Crear Sede',
    onClick: sedesCrud.handleCreate,
    font: 'bg-green-600 hover:bg-green-700 text-white'
  }
];

/**
 * Config del nivel 1 (sedes) para TableMultiLevelRender.
 * Se inyectan los handlers de CRUD al momento de uso.
 */
export const getSedesLevelConfig = (sedesCrud, handleAddAulaFromSede) => ({
  level: 1,
  headers: [
    { title: 'CODIGO_SEDE', type: 'string', groupBy: false, label: 'Código' },
    { title: 'NOMBRE_SEDE', type: 'string', groupBy: true, label: 'Sede' },
    { title: 'ACTIVO', type: 'boolean', label: 'Activo', editable: true, targetTable: 'SEDES', targetField: 'ACTIVO' }
  ],
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
});
