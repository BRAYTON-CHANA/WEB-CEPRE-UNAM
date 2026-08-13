/**
 * Configuración de formulario para REQUISITOS_DOCENTES
 * No incluye ACTIVO (se maneja con toggle inline en la tabla).
 */
export const requisitosFormFields = [
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
    name: 'CLASIFICACION',
    type: 'text',
    label: 'Clasificación',
    required: true,
    placeholder: 'Ej: CV, DNI, Contrato, Anexo...'
  },
  {
    name: 'NOMBRE',
    type: 'text',
    label: 'Nombre',
    required: true,
    placeholder: 'Ej: Plantilla de CV, DNI escaneado, etc.'
  },
  {
    name: 'DESCRIPCION',
    type: 'textarea',
    label: 'Descripción',
    required: false,
    placeholder: 'Descripción de la plantilla'
  },
  {
    name: 'ARCHIVO',
    type: 'file',
    label: 'Archivo plantilla',
    required: false,
    ignoreField: true,
    singleFile: true,
    accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip',
    maxSize: 10 * 1024 * 1024,
    showPreview: false,
    placeholder: 'Arrastra o selecciona un archivo (máx. 10 MB)'
  }
];

export const requisitosMultiStep = {
  showDots: true,
  persistData: false,
  nextText: 'Siguiente',
  prevText: 'Atrás',
  submitText: 'Guardar Requisito'
};

export const requisitosValidation = {
  CONDICION_LABORAL: {
    required: { value: true, message: 'Debe seleccionar una condición laboral' }
  },
  CLASIFICACION: {
    required: { value: true, message: 'La clasificación es requerida' }
  },
  NOMBRE: {
    required: { value: true, message: 'El nombre es requerido' }
  }
};

export const requisitosModalConfig = {
  createTitle: 'Crear Nuevo Requisito',
  editTitle: 'Editar Requisito',
  deleteTitle: '¿Eliminar requisito?',
  deleteMessage: (row) => `¿Estás seguro de que deseas eliminar el requisito "${row?.NOMBRE}"?`,
  widthClass: 'w-1/2'
};
