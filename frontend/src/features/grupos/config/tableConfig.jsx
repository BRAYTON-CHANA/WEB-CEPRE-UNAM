import React from 'react';
/**
 * Configuración de tabla multinivel para Grupos
 * 3 niveles con lazy loading:
 *   Nivel 1: Sedes (incl. virtual) — async, boundColumn CODIGO_SEDE
 *   Nivel 2: Áreas — syncGrouping (agrupación dentro de data async)
 *   Nivel 3: Grupos — filas planas con ACTIVO editable
 */

/**
 * Genera los levelConfigs para TableMultiLevelEditable.
 * Nivel 1: Sede (async, botón "+" para añadir grupo)
 * Nivel 2: Área (syncGrouping, agrupa los grupos por área)
 * Nivel 3: Grupo (CRUD completo: editar, eliminar, ACTIVO editable)
 */
export const getTableLevelConfigs = (gruposCrud, handleAddGrupo, handleAsignarPlazas, handleVerCursos, handleVerProgramacion) => [
  {
    level: 1,
    headers: [
      { title: 'CODIGO_SEDE', type: 'string', label: 'Código' },
      { title: 'NOMBRE_SEDE', type: 'string', groupBy: true, label: 'Sede' }
    ],
    boundColumn: 'CODIGO_SEDE',
    childCountLabel: { singular: 'grupo', plural: 'grupos' },
    actions: {
      addGrupo: {
        enabled: true,
        icon: 'plus',
        label: 'Añadir Grupo',
        className: 'text-green-600 hover:bg-green-100',
        onClick: (row) => handleAddGrupo(row)
      }
    }
  },
  {
    level: 2,
    syncGrouping: true,
    headers: [
      { title: 'NOMBRE_AREA', type: 'string', groupBy: true, label: 'Área' }
    ],
    boundColumn: 'ID_AREA',
    actions: {}
  },
  {
    level: 3,
    headers: [
      { title: 'CODIGO_GRUPO', type: 'string', label: 'Código' },
      { title: 'NOMBRE_GRUPO', type: 'string', label: 'Grupo' },
      { title: 'NOMBRE_HORARIO', type: 'string', label: 'Horario' },
      { title: 'CAPACIDAD_MAXIMA', type: 'number', label: 'Cap.' },
      { title: 'FECHA_INICIO', type: 'string', label: 'Inicio' },
      { title: 'FECHA_TERMINO', type: 'string', label: 'Término' },
      { title: 'GRUPO_ACTIVO', type: 'boolean', label: 'Activo', editable: (row) => !row.GRUPO_ACTIVO, targetTable: 'GRUPOS', targetField: 'ACTIVO', confirmBeforeSave: {
        title: '¿Activar Grupo?',
        message: 'Al activar este grupo se crearán las sesiones agrupadas a partir de la programación y se cambiará al modo manual. Esta acción no se puede deshacer.',
        confirmText: 'Activar',
        cancelText: 'Cancelar',
        whenValue: true
      } }
    ],
    boundColumn: 'ID_GRUPO',
    actions: {
      edit: {
        enabled: true,
        icon: 'edit',
        label: 'Editar',
        className: 'text-blue-600 hover:bg-blue-100',
        onClick: (row) => gruposCrud.handleEdit(row)
      },
      delete: {
        enabled: true,
        icon: 'trash',
        label: 'Eliminar',
        className: 'text-red-600 hover:bg-red-100',
        onClick: (row) => gruposCrud.handleDelete(row)
      },
      dropdown: [
        ...(handleVerCursos ? [{
          label: 'Ver Cursos',
          icon: 'book',
          className: 'text-gray-700 hover:bg-gray-100',
          onClick: (row) => handleVerCursos(row)
        }] : []),
        ...(handleVerProgramacion ? [{
          label: 'Ver Programación',
          icon: 'calendar',
          className: 'text-gray-700 hover:bg-gray-100',
          onClick: (row) => handleVerProgramacion(row)
        }] : [])
      ]
    }
  }
];

/**
 * Config del modo plano — todos los grupos del periodo en una sola tabla.
 * Reusa VW_GRUPOS con columnas de sede/área para contexto.
 */
export const getGruposFlatConfig = (gruposCrud, handleVerCursos, handleVerProgramacion) => ({
  headers: [
    {
      field: 'CONTEXTO',
      title: 'Sede / Modalidad / Área',
      type: 'string',
      render: (_value, row) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-gray-900">
            {row.NOMBRE_SEDE} · {row.MODALIDAD}
          </span>
          <span className="text-xs text-gray-500">
            {row.CODIGO_AREA} {row.NOMBRE_AREA}
          </span>
        </div>
      )
    },
    { field: 'CODIGO_GRUPO', title: 'Código', type: 'string' },
    { field: 'NOMBRE_GRUPO', title: 'Grupo', type: 'string' },
    { field: 'NOMBRE_HORARIO', title: 'Horario', type: 'string' },
    { field: 'CAPACIDAD_MAXIMA', title: 'Cap.', type: 'number' },
    { field: 'FECHA_INICIO', title: 'Inicio', type: 'string' },
    { field: 'FECHA_TERMINO', title: 'Término', type: 'string' },
    { field: 'GRUPO_ACTIVO', title: 'Activo', type: 'boolean', editable: (row) => !row.GRUPO_ACTIVO, targetTable: 'GRUPOS', targetField: 'ACTIVO', confirmBeforeSave: {
      title: '¿Activar Grupo?',
      message: 'Al activar este grupo se crearán las sesiones agrupadas a partir de la programación y se cambiará al modo manual. Esta acción no se puede deshacer.',
      confirmText: 'Activar',
      cancelText: 'Cancelar',
      whenValue: true
    } }
  ],
  boundColumn: 'ID_GRUPO',
  actions: {
    edit: {
      enabled: true,
      icon: 'edit',
      label: 'Editar',
      className: 'text-blue-600 hover:bg-blue-100',
      onClick: (row) => gruposCrud.handleEdit(row)
    },
    delete: {
      enabled: true,
      icon: 'trash',
      label: 'Eliminar',
      className: 'text-red-600 hover:bg-red-100',
      onClick: (row) => gruposCrud.handleDelete(row)
    },
    verCursos: [
      ...(handleVerCursos ? [{
        label: 'Ver Cursos',
        icon: 'book',
        className: 'text-gray-700 hover:bg-gray-100',
        onClick: (row) => handleVerCursos(row)
      }] : []),
      ...(handleVerProgramacion ? [{
        label: 'Ver Programación',
        icon: 'calendar',
        className: 'text-gray-700 hover:bg-gray-100',
        onClick: (row) => handleVerProgramacion(row)
      }] : [])
    ]
  }
});
