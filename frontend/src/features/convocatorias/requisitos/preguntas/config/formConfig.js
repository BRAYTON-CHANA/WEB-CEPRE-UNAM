/**
 * Configuración de formulario para CONVOCATORIA_PREGUNTAS
 * Campos condicionales:
 *   - OPCIONES, PERMITE_OTROS, MODO_SELECCION: visibles si TIPO_RESPUESTA = 'opcion_multiple'
 *   - TIPO_TEXTO: visible si TIPO_RESPUESTA = 'texto'
 *   - MIN_VALOR, MAX_VALOR: visibles si (texto + entero/float)
 *   - MAX_CARACTERES: visible si (texto + libre) o (opcion_multiple + permite_otros)
 *   - OBLIGATORIO: switch siempre visible
 *
 * Nota: conditionEvaluator usa { field, op, value } con op en (=, !=, in, notIn, ...).
 * `hidden` evalúa "ocultar si true". Para "mostrar si X" se expresa "ocultar si NOT X".
 * Los campos nuevos se marcan ignoreField: true (el servicio custom los toma de formData).
 */

// Condición: ocultar MIN_VALOR / MAX_VALOR
// Visible si: texto AND tipo_texto IN [entero,float]
// Oculto si: (TIPO_RESPUESTA != texto) OR (TIPO_RESPUESTA=texto AND TIPO_TEXTO NOT IN [entero,float])
const hiddenLimitesNumericos = {
  or: [
    { field: 'TIPO_RESPUESTA', op: '!=', value: 'texto' },
    { and: [
      { field: 'TIPO_RESPUESTA', op: '=', value: 'texto' },
      { field: 'TIPO_TEXTO', op: 'notIn', value: ['entero', 'float'] }
    ]}
  ]
};

// Condición: ocultar MAX_CARACTERES
// Visible si: (texto AND tipo_texto=libre) OR (opcion_multiple AND permite_otros=true)
// Oculto si: (TIPO_RESPUESTA NOT IN [texto, opcion_multiple]) OR (TIPO_RESPUESTA=texto AND TIPO_TEXTO!=libre) OR (TIPO_RESPUESTA=opcion_multiple AND PERMITE_OTROS!=true)
const hiddenMaxCaracteres = {
  or: [
    { field: 'TIPO_RESPUESTA', op: 'notIn', value: ['texto', 'opcion_multiple'] },
    { and: [
      { field: 'TIPO_RESPUESTA', op: '=', value: 'texto' },
      { field: 'TIPO_TEXTO', op: '!=', value: 'libre' }
    ]},
    { and: [
      { field: 'TIPO_RESPUESTA', op: '=', value: 'opcion_multiple' },
      { field: 'PERMITE_OTROS', op: '!=', value: true }
    ]}
  ]
};

export const preguntasFormFields = [
  {
    name: 'CONDICION_LABORAL',
    type: 'select',
    label: 'Condición laboral',
    required: true,
    defaultValue: 'CONTRATADO',
    options: [
      { value: 'CONTRATADO', label: 'Contratado' },
      { value: 'EXTERNO', label: 'Externo' },
      { value: 'ORDINARIO', label: 'Ordinario' }
    ]
  },
  {
    name: 'NOMBRE',
    type: 'text',
    label: 'Pregunta',
    required: true,
    placeholder: 'Ej: ¿Tiene experiencia docente?'
  },
  {
    name: 'DESCRIPCION',
    type: 'textarea',
    label: 'Descripción',
    required: false,
    placeholder: 'Descripción o ayuda para responder la pregunta'
  },
  {
    name: 'ORDEN',
    type: 'number',
    label: 'Orden',
    required: true,
    defaultValue: 1,
    placeholder: '1',
    helperText: 'Número para ordenar dentro de la condición laboral (menor = primero). Debe ser único por condición laboral.'
  },
  {
    name: 'TIPO_RESPUESTA',
    type: 'select',
    label: 'Tipo de respuesta',
    required: true,
    defaultValue: 'texto',
    options: [
      { value: 'texto', label: 'Texto' },
      { value: 'si_no', label: 'Sí / No' },
      { value: 'opcion_multiple', label: 'Opción múltiple' }
    ]
  },
  {
    name: 'OPCIONES',
    type: 'string-array',
    label: 'Opciones',
    placeholderItem: 'Escriba una opción...',
    hidden: { field: 'TIPO_RESPUESTA', op: '!=', value: 'opcion_multiple' },
    ignoreField: true
  },
  {
    name: 'PERMITE_OTROS',
    type: 'switch',
    label: 'Permitir respuesta "Otros"',
    defaultValue: false,
    hidden: { field: 'TIPO_RESPUESTA', op: '!=', value: 'opcion_multiple' },
    ignoreField: true
  },
  {
    name: 'MODO_SELECCION',
    type: 'select',
    label: 'Modo de selección',
    defaultValue: 'unica',
    options: [
      { value: 'unica', label: 'Único' },
      { value: 'multiple', label: 'Múltiple' }
    ],
    hidden: { field: 'TIPO_RESPUESTA', op: '!=', value: 'opcion_multiple' },
    ignoreField: true
  },
  {
    name: 'TIPO_TEXTO',
    type: 'select',
    label: 'Formato del texto',
    defaultValue: 'libre',
    options: [
      { value: 'libre', label: 'Libre (cualquier texto)' },
      { value: 'entero', label: 'Solo números enteros' },
      { value: 'float', label: 'Solo números decimales' }
    ],
    hidden: { field: 'TIPO_RESPUESTA', op: '!=', value: 'texto' },
    ignoreField: true
  },
  {
    name: 'MIN_VALOR',
    type: 'number',
    label: 'Valor mínimo',
    placeholder: 'Ej: 0',
    helperText: 'Aplica si el texto es numérico (entero/float).',
    hidden: hiddenLimitesNumericos,
    ignoreField: true
  },
  {
    name: 'MAX_VALOR',
    type: 'number',
    label: 'Valor máximo',
    placeholder: 'Ej: 100',
    helperText: 'Aplica si el texto es numérico (entero/float).',
    hidden: hiddenLimitesNumericos,
    ignoreField: true
  },
  {
    name: 'MAX_CARACTERES',
    type: 'number',
    label: 'Máximo de caracteres',
    placeholder: 'Ej: 200',
    helperText: 'Aplica si el texto es libre o si la opción múltiple permite "Otros".',
    hidden: hiddenMaxCaracteres,
    ignoreField: true
  },
  {
    name: 'OBLIGATORIO',
    type: 'switch',
    label: 'Pregunta obligatoria',
    defaultValue: false
  }
];

export const preguntasMultiStep = {
  showDots: true,
  persistData: false,
  nextText: 'Siguiente',
  prevText: 'Atrás',
  submitText: 'Guardar Pregunta'
};

export const preguntasValidation = {
  CONDICION_LABORAL: {
    required: { value: true, message: 'Debe seleccionar una condición laboral' }
  },
  NOMBRE: {
    required: { value: true, message: 'La pregunta es requerida' }
  },
  ORDEN: {
    required: { value: true, message: 'El orden es requerido' }
  },
  TIPO_RESPUESTA: {
    required: { value: true, message: 'Debe seleccionar un tipo de respuesta' }
  }
};

export const preguntasModalConfig = {
  createTitle: 'Crear Nueva Pregunta',
  editTitle: 'Editar Pregunta',
  deleteTitle: '¿Eliminar pregunta?',
  deleteMessage: (row) => `¿Estás seguro de que deseas eliminar la pregunta "${row?.NOMBRE}"?`,
  widthClass: 'w-1/2',
  size: 'md'
};
