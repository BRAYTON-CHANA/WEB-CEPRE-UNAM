/**
 * Configuración de formulario para POSTULACION_PLAZA
 * Se usa desde PostulacionesPlazaPanel.
 */
export const postulacionFormFields = [
  {
    name: 'ID_PLAZA_DOCENTE',
    type: 'hidden',
    hidden: true
  },
  {
    name: 'ID_DOCENTE',
    type: 'reference-select',
    label: 'Docente',
    required: true,
    referenceTable: 'VW_DOCENTES',
    referenceField: 'ID_DOCENTE',
    referenceQuery: '{NOMBRE_COMPLETO} (DNI: {DNI})',
    searchable: true,
    placeholder: 'Seleccione un docente'
  },
  {
    name: 'ESTADO',
    type: 'select',
    label: 'Estado',
    required: true,
    defaultValue: 'postulado',
    options: [
      { value: 'postulado', label: 'Postulado' },
      { value: 'en_revision', label: 'En revisión' },
      { value: 'entrevista', label: 'Entrevista' },
      { value: 'documentos', label: 'Documentos' },
      { value: 'contratado', label: 'Contratado' },
      { value: 'descartado', label: 'Descartado' }
    ]
  },
  {
    name: 'FECHA_ENTREVISTA',
    type: 'date',
    label: 'Fecha de entrevista',
    required: false
  },
  {
    name: 'NOTA_ENTREVISTA',
    type: 'textarea',
    label: 'Nota de entrevista',
    required: false
  },
  {
    name: 'OBSERVACIONES',
    type: 'textarea',
    label: 'Observaciones',
    required: false
  },
  {
    name: 'ARCHIVOS',
    type: 'file',
    label: 'Archivos adjuntos',
    required: false,
    ignoreField: true,
    multiple: true,
    singleFile: false,
    maxFiles: 10,
    accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.png,.jpg,.jpeg',
    maxSize: 10 * 1024 * 1024,
    showPreview: false,
    placeholder: 'Arrastra o selecciona archivos (máx. 10 MB c/u)'
  }
];

export const postulacionValidation = {
  ID_PLAZA_DOCENTE: {
    required: { value: true, message: 'Falta la plaza asociada' }
  },
  ID_DOCENTE: {
    required: { value: true, message: 'Debe seleccionar un docente' }
  },
  ESTADO: {
    required: { value: true, message: 'El estado es obligatorio' }
  }
};
