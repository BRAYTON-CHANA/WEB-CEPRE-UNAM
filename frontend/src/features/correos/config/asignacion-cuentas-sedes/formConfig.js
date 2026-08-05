/**
 * Configuración de formulario para TIPO_CORREO_CUENTA_SEDE
 */
export const asignacionCuentaSedeFormFields = [
  {
    name: 'ID_TIPO_CORREO',
    type: 'reference-select',
    label: 'Tipo de Correo',
    required: true,
    referenceTable: 'TIPOS_CORREO',
    referenceField: 'ID_TIPO',
    referenceLabelField: 'NOMBRE_TIPO',
    referenceQuery: '{NOMBRE_TIPO}',
    placeholder: 'Seleccione un tipo de correo',
    referenceFilters: [
      { field: 'ACTIVO', op: '=', value: 1 }
    ]
  },
  {
    name: 'ID_CUENTA',
    type: 'reference-select',
    label: 'Cuenta SMTP',
    required: true,
    referenceTable: 'CUENTAS_SMTP',
    referenceField: 'ID_CUENTA',
    referenceLabelField: 'NOMBRE_CUENTA',
    referenceQuery: '{NOMBRE_CUENTA}',
    placeholder: 'Seleccione una cuenta SMTP',
    referenceFilters: [
      { field: 'ACTIVO', op: '=', value: 1 }
    ]
  },
  {
    name: 'ID_SEDE',
    type: 'reference-select',
    label: 'Sede',
    required: false,
    referenceTable: 'SEDES',
    referenceField: 'ID_SEDE',
    referenceLabelField: 'NOMBRE_SEDE',
    referenceQuery: '{NOMBRE_SEDE}',
    placeholder: 'Todas las sedes (opcional)'
  }
];

export const asignacionCuentaSedeMultiStep = {
  showDots: true,
  persistData: false,
  nextText: 'Siguiente',
  prevText: 'Atrás',
  submitText: 'Guardar Asignación'
};

export const asignacionCuentaSedeValidation = {
  ID_TIPO_CORREO: {
    required: { value: true, message: 'El tipo de correo es obligatorio' }
  },
  ID_CUENTA: {
    required: { value: true, message: 'La cuenta SMTP es obligatoria' }
  }
};

export const asignacionCuentaSedeModalConfig = {
  createTitle: 'Crear Asignación',
  editTitle: 'Editar Asignación',
  deleteTitle: '¿Eliminar asignación?',
  deleteMessage: (row) => `¿Estás seguro de que deseas eliminar la asignación para "${row?.TIPO_CORREO_NOMBRE}"?`,
  widthClass: 'w-1/2'
};
