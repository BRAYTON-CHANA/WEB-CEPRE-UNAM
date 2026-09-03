import React from 'react';

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
    { title: 'FECHA_APERTURA', type: 'datetime', label: 'Apertura' },
    { title: 'FECHA_CIERRE', type: 'datetime', label: 'Cierre' },
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
 * Para Virtual (MODALIDAD='VIRTUAL', ID_SEDE=null), NOMBRE_SEDE='Virtual' desde la vista.
 */
export const getConvocatoriasSedeLevelConfig = (handleAddCursoFromSede) => ({
  level: 1,
  syncGrouping: true,
  headers: [
    { title: 'NOMBRE_SEDE', type: 'string', groupBy: true, label: 'Sede' },
    { title: 'MODALIDAD', type: 'string', label: 'Modalidad', hidden: true }
  ],
  // boundColumn usa NOMBRE_SEDE para que Virtual (ID_SEDE=null) tenga una clave única
  boundColumn: 'NOMBRE_SEDE',
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
export const getConvocatoriasCursoLevelConfig = (crud, handleViewPostulantes, handleAddPlaza, addingPlazaId = null) => ({
  level: 2,
  headers: [
    {
      title: 'NOMBRE_CURSO',
      type: 'info-card',
      label: 'Curso',
      displayValue: (row) => ({
        title: `${row.NOMBRE_CURSO} (${row.CODIGO_CURSO})`,
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
      disabled: (row) => addingPlazaId !== null && String(addingPlazaId) === String(row.ID_CONVOCATORIA_CURSO),
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
 * Lazy load desde VW_PLAZA_DOCENTE filtrado por ID_CONVOCATORIA_CURSO.
 */
export const getPlazasDocentesLevelConfig = (crud) => ({
  level: 3,
  headers: [
    { title: 'IDENTIFICADOR_DOCENTE', type: 'string', label: 'Identificador', editable: true, targetTable: 'PLAZA_DOCENTE', targetField: 'IDENTIFICADOR_DOCENTE' },
    {
      title: 'ID_POSTULACION',
      type: 'function-select',
      label: 'Docente Asignado',
      editable: true,
      functionName: 'fn_postulaciones_apto_convocatoria_curso',
      functionParams: {
        p_id_convocatoria_curso: '{ID_CONVOCATORIA_CURSO}',
        p_id_postulacion_actual: '{ID_POSTULACION}'
      },
      optionalParams: ['p_id_postulacion_actual'],
      valueField: 'id_postulacion',
      labelField: '{docente_nombre} · DNI: {dni}',
      descriptionField: 'RUC: {ruc}',
      placeholder: 'Sin asignar',
      searchable: true,
      freezeParams: true,
      showRefreshButton: true,
      targetTable: 'PLAZA_DOCENTE',
      targetField: 'ID_POSTULACION',
      render: (value, row) => {
        if (!value) return <span className="text-gray-300 italic">Sin asignar</span>;
        const ruc = row.RUC ? ` · RUC: ${row.RUC}` : '';
        const dni = row.DNI ? ` · DNI: ${row.DNI}` : '';
        return <span className="text-sm">{row.DOCENTE_NOMBRE}{ruc}{dni}</span>;
      }
    },
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

/**
 * Config del modo plano — todas las plazas de la convocatoria en una sola tabla.
 * Reusa VW_PLAZA_DOCENTE con columnas de sede/curso para contexto.
 */
export const getPlazasDocentesFlatConfig = (crud) => ({
  headers: [
    {
      field: 'CONTEXTO',
      title: 'Sede / Modalidad / Curso',
      type: 'string',
      render: (_value, row) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-gray-900">
            {row.NOMBRE_SEDE} · {row.MODALIDAD}
          </span>
          <span className="text-xs text-gray-500">
            {row.CODIGO_CURSO} - {row.NOMBRE_CURSO}
          </span>
        </div>
      )
    },
    { field: 'IDENTIFICADOR_DOCENTE', title: 'Identificador', type: 'string', editable: true, targetTable: 'PLAZA_DOCENTE', targetField: 'IDENTIFICADOR_DOCENTE' },
    { field: 'PAGO_POR_HORA', title: 'Pago/Hora', type: 'currency', editable: true, targetTable: 'PLAZA_DOCENTE', targetField: 'PAGO_POR_HORA' },
    {
      field: 'ID_POSTULACION',
      title: 'Docente Asignado',
      type: 'function-select',
      editable: true,
      functionName: 'fn_postulaciones_apto_convocatoria_curso',
      functionParams: {
        p_id_convocatoria_curso: '{ID_CONVOCATORIA_CURSO}',
        p_id_postulacion_actual: '{ID_POSTULACION}'
      },
      optionalParams: ['p_id_postulacion_actual'],
      valueField: 'id_postulacion',
      labelField: '{docente_nombre} · DNI: {dni}',
      descriptionField: 'RUC: {ruc}',
      placeholder: 'Sin asignar',
      searchable: true,
      freezeParams: true,
      showRefreshButton: true,
      targetTable: 'PLAZA_DOCENTE',
      targetField: 'ID_POSTULACION',
      render: (value, row) => {
        if (!value) return <span className="text-gray-300 italic">Sin asignar</span>;
        const ruc = row.RUC ? ` · RUC: ${row.RUC}` : '';
        const dni = row.DNI ? ` · DNI: ${row.DNI}` : '';
        return <span className="text-sm">{row.DOCENTE_NOMBRE}{ruc}{dni}</span>;
      }
    },
    { field: 'PLAZA_ACTIVO', title: 'Activo', type: 'boolean', editable: true, targetTable: 'PLAZA_DOCENTE', targetField: 'ACTIVO' }
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
