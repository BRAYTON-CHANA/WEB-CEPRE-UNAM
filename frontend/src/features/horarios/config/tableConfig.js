/**
 * Configuración de tabla multinivel para Horarios y Bloques
 */

export const HORARIO_BLOQUES_CONFIG = {
  viewName: 'VW_HORARIO_BLOQUES',
  tableName: 'HORARIO_BLOQUES',
  pkField: 'ID_BLOQUE',
  fkField: 'ID_HORARIO',
  parentPkField: 'ID_HORARIO',
  nombreField: 'NOMBRE_HORARIO'
};

export const getHorariosLevelConfig = (horariosCrud, handleEditarBloques) => ({
  level: 1,
  headers: [
    { title: 'NOMBRE_HORARIO', type: 'string', groupBy: true, label: 'Horario' },
    { title: 'NOMBRE_SEDE', type: 'string', label: 'Sede' },
    { title: 'HORA_INICIO_JORNADA', type: 'string', label: 'Inicio' },
    { title: 'HORA_FIN_JORNADA', type: 'string', label: 'Fin' }
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
    editarBloques: {
      enabled: true,
      icon: 'edit',
      label: 'Editar Bloques',
      className: 'text-green-600 hover:bg-green-100',
      onClick: (row) => handleEditarBloques(row)
    }
  }
});

export const getHorarioBloquesLevelConfig = (bloquesCrud) => ({
  level: 2,
  headers: [
    { title: 'ORDEN', type: 'number', label: 'Orden' },
    { title: 'DURACION', type: 'number', label: 'Duración' },
    { title: 'HORA_INICIO_CALCULADA', type: 'string', label: 'Inicio' },
    { title: 'HORA_FIN_CALCULADA', type: 'string', label: 'Fin' },
    { title: 'TIPO_BLOQUE', type: 'string', label: 'Tipo' },
    { title: 'ETIQUETA', type: 'string', label: 'Etiqueta' }
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
});
