/**
 * Configuración de tabla para Convocatoria Preguntas (2 niveles)
 * Nivel 1: Condición laboral (grupo) con botón "Añadir Pregunta"
 * Nivel 2: Preguntas individuales con tipo de respuesta badge, editar, eliminar
 */
export const tableConfig = {
  tableName: 'VW_CONVOCATORIA_PREGUNTAS'
};

// Mapeo de tipos de respuesta a etiquetas legibles
export const TIPO_RESPUESTA_LABELS = {
  texto: 'Texto',
  si_no: 'Sí/No',
  opcion_multiple: 'Opción múltiple'
};

// Colores por tipo de respuesta
export const TIPO_RESPUESTA_COLORS = {
  texto: 'bg-gray-100 text-gray-700 border-gray-200',
  si_no: 'bg-blue-50 text-blue-700 border-blue-200',
  opcion_multiple: 'bg-purple-50 text-purple-700 border-purple-200'
};

// Etiquetas para TIPO_TEXTO (sub-tipo de texto)
export const TIPO_TEXTO_LABELS = {
  libre: 'Libre',
  entero: 'Solo enteros',
  float: 'Solo decimales'
};

// Etiquetas para MODO_SELECCION (sub-tipo de opcion_multiple)
export const MODO_SELECCION_LABELS = {
  unica: 'Única',
  multiple: 'Múltiple'
};

/**
 * Genera los levelConfigs para TableMultiLevelEditable.
 * Nivel 1: Condición laboral (groupBy) + botón añadir pregunta
 * Nivel 2: Pregunta individual (tipo badge, editar, eliminar)
 * OBLIGATORIO y ACTIVO son editables inline.
 */
export const getTableLevelConfigs = ({ handleEdit, handleDelete, handleAddPregunta }) => [
  {
    level: 1,
    headers: [
      { title: 'CONDICION_LABORAL', type: 'string', groupBy: true, label: 'Condición' }
    ],
    boundColumn: 'ID_PREGUNTA',
    childCountLabel: { singular: 'pregunta', plural: 'preguntas' },
    actions: {
      addPregunta: {
        enabled: true,
        icon: 'plus',
        label: 'Añadir Pregunta',
        className: 'text-green-600 hover:bg-green-100',
        onClick: (row) => handleAddPregunta(row)
      }
    }
  },
  {
    level: 2,
    headers: [
      { title: 'NOMBRE', type: 'string', label: 'Pregunta' },
      { title: 'DESCRIPCION', type: 'string', label: 'Descripción' },
      { title: 'ORDEN', type: 'number', label: 'Orden', editable: true, targetTable: 'CONVOCATORIA_PREGUNTAS', targetField: 'ORDEN' },
      {
        title: 'TIPO_RESPUESTA',
        type: 'badge',
        label: 'Tipo',
        editable: false,
        render: (value) => (
          <span className={`inline-flex items-center px-2 py-0.5 text-[10px] rounded font-medium border ${TIPO_RESPUESTA_COLORS[value] || TIPO_RESPUESTA_COLORS.texto}`}>
            {TIPO_RESPUESTA_LABELS[value] || value}
          </span>
        )
      },
      {
        title: 'MODO_SELECCION',
        type: 'badge',
        label: 'Modo',
        editable: false,
        render: (value) => {
          if (!value || value === 'unica') return null;
          return (
            <span className="inline-flex items-center px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[10px] rounded font-medium border border-amber-200">
              {MODO_SELECCION_LABELS[value] || value}
            </span>
          );
        }
      },
      { title: 'OBLIGATORIO', type: 'boolean', label: 'Obligatorio', editable: true, targetTable: 'CONVOCATORIA_PREGUNTAS', targetField: 'OBLIGATORIO' },
      { title: 'ACTIVO', type: 'boolean', label: 'Activo', editable: true, targetTable: 'CONVOCATORIA_PREGUNTAS', targetField: 'ACTIVO' }
    ],
    boundColumn: 'ID_PREGUNTA',
    actions: {
      edit: {
        enabled: true,
        icon: 'edit',
        label: 'Editar',
        className: 'text-blue-600 hover:bg-blue-100',
        onClick: (row) => handleEdit(row)
      },
      delete: {
        enabled: true,
        icon: 'trash',
        label: 'Eliminar',
        className: 'text-red-600 hover:bg-red-100',
        onClick: (row) => handleDelete(row)
      }
    }
  }
];
