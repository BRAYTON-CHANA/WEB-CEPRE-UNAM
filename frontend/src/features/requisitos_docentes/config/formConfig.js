/**
 * Configuración de formulario para REQUISITOS_DOCENTES
 * No incluye ACTIVO (se maneja con toggle inline en la tabla).
 */
export const requisitosFormFields = [
  {
    name: 'NOMBRE',
    type: 'text',
    label: 'Nombre',
    required: true,
    placeholder: 'Ej: Plantilla de CV, Contrato Docente, etc.'
  },
  {
    name: 'TIPO',
    type: 'select',
    label: 'Tipo',
    required: true,
    defaultValue: 'plantilla',
    options: [
      { value: 'plantilla', label: 'Plantilla' },
      { value: 'instructivo', label: 'Instructivo' },
      { value: 'contrato', label: 'Contrato' },
      { value: 'anexo', label: 'Anexo' },
      { value: 'otro', label: 'Otro' }
    ]
  },
  {
    name: 'DESCRIPCION',
    type: 'textarea',
    label: 'Descripción',
    required: false,
    placeholder: 'Descripción del documento/plantilla'
  },
  {
    name: 'ARCHIVO',
    type: 'file',
    label: 'Archivo adjunto',
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
  NOMBRE: {
    required: { value: true, message: 'El nombre es requerido' }
  },
  TIPO: {
    required: { value: true, message: 'Debe seleccionar un tipo' }
  }
};

export const requisitosModalConfig = {
  createTitle: 'Crear Nuevo Requisito',
  editTitle: 'Editar Requisito',
  deleteTitle: '¿Eliminar requisito?',
  deleteMessage: (row) => `¿Estás seguro de que deseas eliminar el requisito "${row?.NOMBRE}"?`,
  widthClass: 'w-1/2'
};
