/**
 * Configuración de formulario para DOCENTES
 * Formulario especial de 2 páginas:
 *   Página 1: Datos de usuario (seleccionar existente o crear/editar)
 *   Página 2: Datos de docente
 */

// ── Campos de la Página 1: Datos de Usuario ──
export const docenteUsuarioFields = [
  {
    name: 'ID_DOCENTE',
    type: 'text',
    hidden: true,
    required: false
  },
  {
    name: 'ID_USUARIO',
    type: 'text',
    hidden: true,
    required: false
  },
  {
    name: '_modo_usuario',
    type: 'select',
    label: 'Modo de usuario',
    required: true,
    options: [
      { value: 'seleccionar', label: 'Seleccionar usuario existente' },
      { value: 'crear', label: 'Crear nuevo usuario' }
    ],
    defaultValue: 'seleccionar',
    colSpan: 3,
    _page1Only: true
  },
  {
    name: '_usuario_seleccionado',
    type: 'function-select',
    label: 'Usuario vinculado',
    functionName: 'fn_usuarios_disponibles_docente',
    functionParams: {
      p_id_usuario_actual: '{_id_usuario_original}'
    },
    optionalParams: ['p_id_usuario_actual'],
    valueField: 'id_usuario',
    labelField: 'nombre_completo',
    descriptionField: 'dni',
    statusField: 'estado_usuario',
    searchable: true,
    showRefreshButton: true,
    showAddButton: true,
    placeholder: 'Seleccione un usuario',
    colSpan: 3,
    _visibleWhenModoSeleccionar: true,
    _inlineAddMode: true
  },
  // Campos editables del usuario (siempre visibles)
  { name: 'DNI', type: 'text', label: 'DNI', required: true, placeholder: '8 dígitos', maxLength: 8, colSpan: 1 },
  { name: 'APELLIDO_PATERNO', type: 'text', label: 'Apellido Paterno', required: true, placeholder: 'Ej: Pérez', colSpan: 1 },
  { name: 'APELLIDO_MATERNO', type: 'text', label: 'Apellido Materno', required: false, placeholder: 'Ej: García', colSpan: 1 },
  { name: 'NOMBRES', type: 'text', label: 'Nombres', required: true, placeholder: 'Ej: Juan Carlos', colSpan: 2 },
  { name: 'SEXO', type: 'select', label: 'Sexo', required: false, options: [{ value: 'M', label: 'Masculino' }, { value: 'F', label: 'Femenino' }], colSpan: 1 },
  { name: 'EMAIL', type: 'text', label: 'Email', required: true, placeholder: 'ejemplo@correo.com', colSpan: 2 },
  { name: 'TELEFONO', type: 'text', label: 'Teléfono', required: false, placeholder: 'Ej: 987654321', colSpan: 1 },
  { name: 'TELEFONO_OPCIONAL', type: 'text', label: 'Teléfono Opcional', required: false, placeholder: 'Ej: 987654321', colSpan: 1 },
  { name: 'FECHA_NACIMIENTO', type: 'native-date', label: 'Fecha de Nacimiento', required: false, max: new Date().toISOString().split('T')[0], colSpan: 2 },
  { name: 'DIRECCION', type: 'text', label: 'Dirección', required: false, placeholder: 'Ej: Av. Principal 123', colSpan: 3 },
  { name: 'DEPARTAMENTO', type: 'text', label: 'Departamento', required: false, placeholder: 'Ej: Lima', colSpan: 1 },
  { name: 'PROVINCIA', type: 'text', label: 'Provincia', required: false, placeholder: 'Ej: Lima', colSpan: 1 },
  { name: 'DISTRITO', type: 'text', label: 'Distrito', required: false, placeholder: 'Ej: Miraflores', colSpan: 1 },
  { name: 'REF_DOM', type: 'text', label: 'Referencia de Domicilio', required: false, placeholder: 'Ej: Frente al parque', colSpan: 3 },
  { name: 'DISCAPACIDAD', type: 'boolean', label: 'Tiene Discapacidad', required: false, defaultValue: false, colSpan: 3 },
  {
    name: 'TIPO_DISCAPACIDAD',
    type: 'text',
    label: 'Tipo de Discapacidad',
    required: false,
    placeholder: 'Ej: Visual',
    hidden: { field: 'DISCAPACIDAD', op: '=', value: false },
    blocked: { clearOnBlock: true, field: 'DISCAPACIDAD', op: '=', value: false },
    colSpan: 1
  },
  {
    name: 'NRO_CONADIS',
    type: 'text',
    label: 'N° CONADIS',
    required: false,
    placeholder: 'Ej: 1234567',
    hidden: { field: 'DISCAPACIDAD', op: '=', value: false },
    blocked: { clearOnBlock: true, field: 'DISCAPACIDAD', op: '=', value: false },
    colSpan: 2
  },
  // Archivo DNI (PDF)
  {
    name: 'DNI_ARCHIVO',
    type: 'file',
    label: 'Archivo de DNI',
    accept: '.pdf',
    maxSize: 10 * 1024 * 1024,
    singleFile: true,
    showPreview: true,
    allowDragDrop: true,
    ignoreField: true,
    colSpan: 3
  },
  // Vencimiento del DNI (después del archivo)
  { name: 'DNI_FECHA_VENCIMIENTO', type: 'native-date', label: 'Vencimiento del DNI', required: false, colSpan: 3 },
];

// ── Campos de la Página 2: Datos de Docente ──
export const docenteDocenteFields = [
  { name: 'RUC', type: 'text', label: 'RUC', required: true, placeholder: 'Ej: 11111111111', maxLength: 20, colSpan: 2 },
  {
    name: 'CONDICION_LABORAL',
    type: 'select',
    label: 'Condición laboral',
    required: true,
    options: [
      { value: 'CONTRATADO', label: 'Contratado' },
      { value: 'EXTERNO', label: 'Externo' },
      { value: 'ORDINARIO', label: 'Ordinario' }
    ],
    colSpan: 1
  },
  {
    name: 'GRADO_ACADEMICO',
    type: 'select',
    label: 'Grado Académico',
    required: false,
    allowClear: true,
    options: [
      { value: 'BACHILLER', label: 'Bachiller' },
      { value: 'TITULO_PROFESIONAL', label: 'Título Profesional' },
      { value: 'MAGISTER', label: 'Magíster' },
      { value: 'DOCTOR', label: 'Doctor' }
    ],
    colSpan: 3
  },
  {
    name: 'GRADO_ACADEMICO_DESCRIPCION',
    type: 'text',
    label: 'Descripción de Grado/Título',
    required: false,
    placeholder: 'Ej: en Educación, en Ingeniería',
    colSpan: 3
  },
  {
    name: 'GRADO_ACADEMICO_ARCHIVO',
    type: 'file',
    label: 'Archivo de Grado/Título',
    accept: '.pdf',
    maxSize: 10 * 1024 * 1024,
    singleFile: true,
    showPreview: true,
    allowDragDrop: true,
    ignoreField: true,
    colSpan: 3
  },
  {
    name: 'CONSTANCIA_SUNEDU_DRE_ARCHIVO',
    type: 'file',
    label: 'Constancia SUNEDU/DRE',
    accept: '.pdf',
    maxSize: 10 * 1024 * 1024,
    singleFile: true,
    showPreview: true,
    allowDragDrop: true,
    ignoreField: true,
    colSpan: 3
  }
];

// Todos los campos combinados (para compatibilidad)
export const docentesFormFields = [...docenteUsuarioFields, ...docenteDocenteFields];

// Layout multi-step: 2 páginas
export const docentesFormLayout = {
  type: 'multistep',
  pages: [
    {
      id: 'page-usuario',
      title: 'Datos de Usuario',
      description: 'Seleccione o cree el usuario del docente',
      sections: [
        { id: 'sec-usuario', title: 'Información del Usuario', columns: 3 }
      ]
    },
    {
      id: 'page-docente',
      title: 'Datos de Docente',
      description: 'Información académica y laboral del docente',
      sections: [
        { id: 'sec-docente', title: 'Información del Docente', columns: 3 }
      ]
    }
  ]
};

export const docentesMultiStep = {
  showDots: true,
  persistData: false,
  nextText: 'Siguiente',
  prevText: 'Atrás',
  submitText: 'Guardar Docente'
};

export const docentesValidation = (formData) => {
  const errors = {};
  const modo = formData._modo_usuario;

  // Validaciones de página 1 (usuario)
  if (modo === 'seleccionar' && !formData.ID_USUARIO) {
    errors.ID_USUARIO = 'Debe seleccionar un usuario';
  }
  if (!formData.DNI || formData.DNI.toString().trim() === '') {
    errors.DNI = 'El DNI es obligatorio';
  }
  if (!formData.APELLIDO_PATERNO || formData.APELLIDO_PATERNO.toString().trim() === '') {
    errors.APELLIDO_PATERNO = 'El apellido paterno es obligatorio';
  }
  if (!formData.NOMBRES || formData.NOMBRES.toString().trim() === '') {
    errors.NOMBRES = 'Los nombres son obligatorios';
  }
  if (!formData.EMAIL || formData.EMAIL.toString().trim() === '') {
    errors.EMAIL = 'El email es obligatorio';
  }

  // Validaciones de página 2 (docente)
  if (!formData.RUC || formData.RUC.toString().trim() === '') {
    errors.RUC = 'El RUC es obligatorio';
  }
  if (!formData.CONDICION_LABORAL) {
    errors.CONDICION_LABORAL = 'La condición laboral es obligatoria';
  }

  return errors;
};

export const docentesModalConfig = {
  createTitle: 'Crear Nuevo Docente',
  editTitle: 'Editar Docente',
  deleteTitle: '¿Eliminar docente?',
  deleteMessage: (row) => `¿Estás seguro de que deseas eliminar al docente "${row?.NOMBRE_COMPLETO}"?`,
  widthClass: 'w-1/2',
  size: '3xl'
};
