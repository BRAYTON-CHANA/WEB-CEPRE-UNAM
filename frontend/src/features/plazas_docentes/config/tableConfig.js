/**
 * Configuración de tabla multinivel para Plazas Docentes
 * Nivel 1: SEDES
 * Nivel 2: VW_PLAZA_DOCENTE_ASIGNADA (plaza + docente aceptado)
 */

/**
 * Config del nivel 1 (sedes) para TableMultiLevelEditable.
 */
export const getSedesLevelConfig = (plazasCrud, handleAddPlaza) => ({
  level: 1,
  headers: [
    { title: 'NOMBRE_SEDE', type: 'string', groupBy: true, label: 'Sede' }
  ],
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
});

/**
 * Config del nivel 2 (plazas) para TableMultiLevelEditable.
 */
export const getPlazasLevelConfig = (plazasCrud, handleViewPostulantes) => ({
  level: 2,
  headers: [
    { title: 'IDENTIFICADOR_DOCENTE', type: 'string', label: 'Identificador' },
    { title: 'NOMBRE_CURSO', type: 'string', label: 'Curso' },
    { title: 'PAGO_POR_HORA', type: 'number', label: 'Pago/Hora' },
    { title: 'DOCENTE_NOMBRE', type: 'string', label: 'Docente Asignado' },
    { title: 'DNI', type: 'string', label: 'DNI' },
    { title: 'FECHA_ACEPTACION', type: 'date', label: 'Fecha Aceptación' },
    { title: 'FECHA_CONTRATO', type: 'date', label: 'Fecha Contrato' },
    { title: 'PLAZA_ACTIVO', type: 'boolean', label: 'Activo', editable: true, targetTable: 'PLAZA_DOCENTE', targetField: 'ACTIVO' }
  ],
  boundColumn: 'ID_PLAZA_DOCENTE',
  actions: {
    viewPostulantes: {
      enabled: true,
      icon: 'user',
      label: 'Ver postulantes',
      className: 'text-purple-600 hover:bg-purple-100',
      onClick: (row) => handleViewPostulantes(row)
    },
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
});
