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
 * Nivel único: tabla plana con todos los postulantes del período.
 */
export const getTableLevelConfigs = (postulantesCrud, _handleAddPostulante, onAsignarGrupo, onRegenerarAsistencias) => [
  {
    level: 1,
    headers: [
      { title: 'DNI', type: 'string' },
      { title: 'NOMBRE_COMPLETO', type: 'string', label: 'Postulante' },
      { title: 'EDAD', type: 'number' },
      { title: 'SEXO', type: 'string' },
      { title: 'FECHA_NACIMIENTO', type: 'date', label: 'Fec. Nac.' },
      { title: 'USUARIO_TELEFONO', type: 'string', label: 'Teléfono' },
      { title: 'USUARIO_EMAIL', type: 'string', label: 'Correo' },
      { title: 'USUARIO_DIRECCION', type: 'string', label: 'Dirección' },
      { title: 'USUARIO_DEPARTAMENTO', type: 'string', label: 'Dep.' },
      { title: 'USUARIO_PROVINCIA', type: 'string', label: 'Prov.' },
      { title: 'USUARIO_DISTRITO', type: 'string', label: 'Dist.' },
      { title: 'USUARIO_DISCAPACIDAD', type: 'boolean', label: 'Discap.' },
      { title: 'USUARIO_TIPO_DISCAPACIDAD', type: 'string', label: 'Tipo Discap.' },
      { title: 'NOMBRE_SEDE_VACANTE', type: 'string', label: 'Sede Vacante' },
      { title: 'NOMBRE_SEDE_EXAMEN', type: 'string', label: 'Sede Examen' },
      { title: 'CODIGO_GRUPO', type: 'string', label: 'Cod. Grupo' },
      { title: 'NOMBRE_GRUPO', type: 'string', label: 'Grupo' },
      { title: 'NOMBRE_CARRERA', type: 'string', label: 'Carrera' },
      { title: 'COLEGIO', type: 'string' },
      { title: 'TIPO_COLEGIO', type: 'string', label: 'Tipo Colegio' },
      { title: 'TURNO', type: 'string' },
      { title: 'GRADO', type: 'number' },
      { title: 'ANIO_EGRESO', type: 'number', label: 'Año Egreso' },
      { title: 'VALIDADO_POR', type: 'string', label: 'Validado por' },
      { title: 'NOMBRE_APODERADO', type: 'string', label: 'Apoderado' },
      { title: 'TELEFONO_APODERADO', type: 'string', label: 'Telf. Apoderado' },
      { title: 'TIENE_HERMANO', type: 'boolean', label: 'Tiene Hermano' },
      { title: 'DNI_HERMANO', type: 'string', label: 'DNI Hermano' },
      { title: 'ALUMNO_LIBRE', type: 'boolean' },
      { title: 'APTO', type: 'boolean' },
      { title: 'POSTULANTE_ACTIVO', type: 'boolean', label: 'Activo' }
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
      },
      dropdown: [
        {
          enabled: true,
          icon: 'users',
          label: 'Asignar grupo',
          className: 'text-blue-600 hover:bg-blue-100',
          onClick: (row) => onAsignarGrupo(row)
        },
        ...(onRegenerarAsistencias ? [{
          enabled: true,
          icon: 'users',
          label: 'Regenerar asistencias',
          className: 'text-blue-600 hover:bg-blue-100',
          showIf: (row) => !!row.ID_GRUPO &&
            (row.GRUPO_ACTIVO === true || row.GRUPO_ACTIVO === 'true' || row.GRUPO_ACTIVO === 't'),
          onClick: (row) => onRegenerarAsistencias([row.ID_POSTULANTE])
        }] : [])
      ]
    }
  }
];
