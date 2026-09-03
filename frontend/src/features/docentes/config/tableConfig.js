/**
 * Configuración de tabla para Docentes (un solo nivel)
 * Columnas ricas: DNI con estado, archivos visibles, datos de contacto.
 */
export const tableConfig = {
  tableName: 'VW_DOCENTES'
};

/**
 * Genera el levelConfig para TableMultiLevelRender.
 * @param {Object} params - { docentesCrud, onVerDni, onVerGrado, onVerConstancia }
 */
export const getTableLevelConfigs = ({
  docentesCrud,
  onVerDni,
  onVerGrado,
  onVerConstancia,
  onEditarTablas
} = {}) => [
  {
    level: 1,
    headers: [
      // DNI con estado (Vigente/Vencido/Sin fecha)
      {
        title: 'DNI',
        type: 'stacked',
        label: 'DNI',
        displayValue: (row) => ({
          primary: row.DNI,
          secondary: row.DNI_ESTADO || 'Sin fecha'
        }),
        colorMap: {
          vigente: 'bg-green-100 text-green-700',
          vencido: 'bg-red-100 text-red-700',
          'sin fecha': 'bg-gray-100 text-gray-500'
        }
      },
      // Archivo DNI — action-badge para ver/reemplazar
      {
        title: 'DNI_FILENAME',
        type: 'action-badge',
        label: 'DNI Doc',
        displayValue: (row) => {
          if (row.DNI_TIENE_ARCHIVO) {
            return {
              label: row.DNI_FILENAME || 'archivo.pdf',
              title: row.DNI_FILENAME || 'Ver archivo DNI',
              actions: [
                { icon: 'eye', title: 'Ver archivo', colorClass: 'text-blue-600 hover:text-blue-800 hover:bg-blue-50', onClick: () => onVerDni?.(row) },
                { icon: 'replace', title: 'Reemplazar archivo', colorClass: 'text-gray-500 hover:text-gray-700 hover:bg-gray-100', onClick: () => onVerDni?.(row) }
              ]
            };
          }
          return {
            label: 'Sin archivo',
            actions: [
              { icon: 'upload', title: 'Subir archivo', colorClass: 'text-red-500 hover:text-red-700 hover:bg-red-50', onClick: () => onVerDni?.(row) }
            ]
          };
        }
      },
      // Docente (nombre + email)
      {
        title: 'NOMBRE_COMPLETO',
        type: 'string',
        label: 'Docente',
        subtitle: { field: 'EMAIL' }
      },
      // RUC
      {
        title: 'RUC',
        type: 'string',
        label: 'RUC'
      },
      // Condición laboral
      {
        title: 'CONDICION_LABORAL',
        type: 'string',
        label: 'Condición'
      },
      // Grado Académico / Título Profesional — action-badge unificado
      {
        title: 'GRADO_ACADEMICO_FILENAME',
        type: 'action-badge',
        label: 'Grado/Título',
        displayValue: (row) => {
          // Display combinado: "Bachiller en Educación" o solo "Bachiller"
          const gradoBase = row.GRADO_ACADEMICO || '';
          const descripcion = row.GRADO_ACADEMICO_DESCRIPCION || '';
          const labelTexto = [gradoBase, descripcion].filter(Boolean).join(' ') || row.GRADO_ACADEMICO_FILENAME || 'archivo.pdf';
          if (row.GRADO_ACADEMICO_TIENE_ARCHIVO) {
            return {
              label: labelTexto,
              title: row.GRADO_ACADEMICO_FILENAME || 'Ver grado/título',
              actions: [
                { icon: 'eye', title: 'Ver archivo', colorClass: 'text-blue-600 hover:text-blue-800 hover:bg-blue-50', onClick: () => onVerGrado?.(row) },
                { icon: 'replace', title: 'Reemplazar archivo', colorClass: 'text-gray-500 hover:text-gray-700 hover:bg-gray-100', onClick: () => onVerGrado?.(row) }
              ]
            };
          }
          return {
            label: 'Sin archivo',
            actions: [
              { icon: 'upload', title: 'Subir archivo', colorClass: 'text-red-500 hover:text-red-700 hover:bg-red-50', onClick: () => onVerGrado?.(row) }
            ]
          };
        }
      },
      // Constancia SUNEDU/DRE — action-badge
      {
        title: 'CONSTANCIA_SUNEDU_DRE_FILENAME',
        type: 'action-badge',
        label: 'SUNEDU',
        displayValue: (row) => {
          if (row.CONSTANCIA_SUNEDU_DRE_TIENE_ARCHIVO) {
            return {
              label: row.CONSTANCIA_SUNEDU_DRE_FILENAME || 'archivo.pdf',
              title: row.CONSTANCIA_SUNEDU_DRE_FILENAME || 'Ver constancia SUNEDU/DRE',
              actions: [
                { icon: 'eye', title: 'Ver archivo', colorClass: 'text-blue-600 hover:text-blue-800 hover:bg-blue-50', onClick: () => onVerConstancia?.(row) },
                { icon: 'replace', title: 'Reemplazar archivo', colorClass: 'text-gray-500 hover:text-gray-700 hover:bg-gray-100', onClick: () => onVerConstancia?.(row) }
              ]
            };
          }
          return {
            label: 'Sin archivo',
            actions: [
              { icon: 'upload', title: 'Subir archivo', colorClass: 'text-red-500 hover:text-red-700 hover:bg-red-50', onClick: () => onVerConstancia?.(row) }
            ]
          };
        }
      },
      // Activo (editable inline) — DOCENTE_ACTIVO desde VW_DOCENTES
      {
        title: 'DOCENTE_ACTIVO',
        type: 'boolean',
        label: 'Activo',
        editable: true,
        targetTable: 'DOCENTES',
        targetField: 'ACTIVO',
        targetPrimaryKey: 'ID_DOCENTE'
      }
    ],
    boundColumn: 'ID_DOCENTE',
    actions: {
      direct: [
        {
          enabled: true,
          icon: 'edit',
          label: 'Editar',
          className: 'text-blue-600 hover:bg-blue-100',
          onClick: (row) => docentesCrud.handleEdit(row)
        },
        {
          enabled: true,
          icon: 'trash',
          label: 'Eliminar',
          className: 'text-red-600 hover:bg-red-100',
          onClick: (row) => docentesCrud.handleDelete(row)
        }
      ],
      dropdown: [
        {
          enabled: true,
          icon: 'table',
          label: 'Editar tablas relacionadas',
          className: 'text-purple-600 hover:bg-purple-100',
          onClick: (row) => onEditarTablas?.(row)
        }
      ]
    }
  }
];
