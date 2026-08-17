/**
 * Configuración de tabla para Convocatorias
 * Página 1: lista plana de convocatorias (VW_CONVOCATORIAS)
 * Página 2: 3 niveles (sedes → cursos → plazas) filtrados por ID_CONVOCATORIA
 */

/**
 * Config del nivel 1 — lista plana de convocatorias (página 1).
 * Tabla simple sin expand, con actions: Manejar, Editar, Eliminar.
 */
export const getConvocatoriasListLevelConfig = (crud, onManage) => ({
  level: 1,
  headers: [
    { title: 'NOMBRE_PERIODO', type: 'string', label: 'Periodo' },
    {
      title: 'DESCRIPCION',
      type: 'info-card',
      label: 'Descripción',
      displayValue: (row) => ({
        title: row.DESCRIPCION || '-',
        tags: [
          { label: 'Plazas', value: row.TOTAL_PLAZAS, colorClass: 'bg-blue-100 text-blue-700' },
          { label: 'Postulaciones', value: row.TOTAL_POSTULACIONES, colorClass: 'bg-purple-100 text-purple-700' }
        ]
      })
    },
    { title: 'FECHA_APERTURA', type: 'date', label: 'Apertura' },
    { title: 'FECHA_CIERRE', type: 'date', label: 'Cierre' },
    { title: 'ACTIVO', type: 'boolean', label: 'Activo', editable: true, targetTable: 'CONVOCATORIA', targetField: 'ACTIVO' }
  ],
  boundColumn: 'ID_CONVOCATORIA',
  actions: {
    manage: {
      enabled: true,
      icon: 'settings',
      label: 'Manejar Convocatoria',
      className: 'text-green-600 hover:bg-green-100',
      onClick: (row) => onManage(row)
    },
    edit: {
      enabled: true,
      icon: 'edit',
      label: 'Editar',
      className: 'text-blue-600 hover:bg-blue-100',
      onClick: (row) => crud.handleEdit(row)
    },
    delete: {
      enabled: true,
      icon: 'trash',
      label: 'Eliminar',
      className: 'text-red-600 hover:bg-red-100',
      onClick: (row) => crud.handleDelete(row)
    }
  }
});

/**
 * Config del nivel 1 del panel de manejo (agrupación por sede).
 * Agrupa los convocatoria_curso por NOMBRE_SEDE (client-side grouping).
 * Recibe los rows del fetch filtrado por ID_CONVOCATORIA.
 */
export const getConvocatoriasSedeLevelConfig = (handleAddCursoFromSede) => ({
  level: 1,
  syncGrouping: true,
  headers: [
    { title: 'NOMBRE_SEDE', type: 'string', groupBy: true, label: 'Sede' }
  ],
  boundColumn: 'ID_SEDE',
  childCountLabel: { singular: 'curso', plural: 'cursos' },
  actions: {
    addCurso: {
      enabled: true,
      icon: 'plus',
      label: 'Añadir Convocatoria Curso',
      className: 'text-green-600 hover:bg-green-100',
      onClick: (row) => handleAddCursoFromSede(row)
    }
  }
});

/**
 * Config del nivel 2 del panel de manejo (convocatoria_curso: detalle curso + plazas).
 * Rows individuales dentro de cada grupo de sede.
 * Render como info-card: título del curso + chips de conteos.
 */
export const getConvocatoriasCursoLevelConfig = (crud, handleViewPostulantes, handleAddPlaza) => ({
  level: 2,
  headers: [
    {
      title: 'NOMBRE_CURSO',
      type: 'info-card',
      label: 'Curso',
      displayValue: (row) => ({
        title: row.NOMBRE_CURSO,
        tags: [
          { label: 'Creadas', value: row.PLAZAS_CREADAS, colorClass: 'bg-blue-100 text-blue-700' },
          { label: 'Asignadas', value: row.PLAZAS_ASIGNADAS, colorClass: 'bg-green-100 text-green-700' },
          { label: 'Postulaciones', value: row.TOTAL_POSTULACIONES, colorClass: 'bg-purple-100 text-purple-700' }
        ]
      })
    },
    { title: 'NUMERO_PLAZAS', type: 'number', label: 'Máximo Plazas', editable: true, targetTable: 'CONVOCATORIA_CURSO', targetField: 'NUMERO_PLAZAS' },
    { title: 'ACTIVO', type: 'boolean', label: 'Activo', editable: true, targetTable: 'CONVOCATORIA_CURSO', targetField: 'ACTIVO' }
  ],
  boundColumn: 'ID_CONVOCATORIA_CURSO',
  actions: {
    addPlaza: {
      enabled: true,
      showIf: (row) => Number(row.PLAZAS_CREADAS) < Number(row.NUMERO_PLAZAS),
      icon: 'plus',
      label: 'Añadir Plaza Docente',
      className: 'text-green-600 hover:bg-green-100',
      onClick: (row) => handleAddPlaza(row)
    },
    viewPostulantes: {
      enabled: true,
      icon: 'user',
      label: 'Ver postulantes',
      className: 'text-purple-600 hover:bg-purple-100',
      onClick: (row) => handleViewPostulantes(row)
    },
    delete: {
      enabled: true,
      icon: 'trash',
      label: 'Eliminar',
      className: 'text-red-600 hover:bg-red-100',
      onClick: (row) => crud.handleDelete(row)
    }
  }
});

/**
 * Config del nivel 3 del panel de manejo (plazas docentes asignadas a un convocatoria_curso).
 * Lazy load desde VW_PLAZA_DOCENTE_ASIGNADA filtrado por ID_CONVOCATORIA_CURSO.
 */
export const getPlazasDocentesLevelConfig = (crud) => ({
  level: 3,
  headers: [
    { title: 'IDENTIFICADOR_DOCENTE', type: 'string', label: 'Identificador' },
    { title: 'DOCENTE_NOMBRE', type: 'string', label: 'Docente' },
    { title: 'PAGO_POR_HORA', type: 'currency', label: 'Pago/Hora', editable: true, targetTable: 'PLAZA_DOCENTE', targetField: 'PAGO_POR_HORA' },
    { title: 'PLAZA_ACTIVO', type: 'boolean', label: 'Activo', editable: true, targetTable: 'PLAZA_DOCENTE', targetField: 'ACTIVO' }
  ],
  boundColumn: 'ID_PLAZA_DOCENTE',
  actions: {
    delete: {
      enabled: true,
      icon: 'trash',
      label: 'Eliminar',
      className: 'text-red-600 hover:bg-red-100',
      onClick: (row) => crud.handleDelete(row)
    }
  }
});
