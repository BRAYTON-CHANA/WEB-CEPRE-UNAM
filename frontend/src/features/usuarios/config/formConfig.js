/**
 * Configuración de formulario para USUARIOS
 */
import { getDniUrl, getConadisUrl } from '@/features/usuarios/services/usuariosStorageService';

export const usuariosFormFields = [
  // ════════════════════════════════════════════════════════════
  // SECCIÓN 1: Datos del DNI
  // ════════════════════════════════════════════════════════════
  {
    name: 'DNI',
    type: 'text',
    label: 'DNI',
    required: true,
    placeholder: '8 dígitos',
    maxLength: 8,
    colSpan: 1,
    section: 1
  },
  {
    name: 'APELLIDO_PATERNO',
    type: 'text',
    label: 'Apellido Paterno',
    required: true,
    placeholder: 'Ej: Pérez',
    colSpan: 1,
    section: 1
  },
  {
    name: 'APELLIDO_MATERNO',
    type: 'text',
    label: 'Apellido Materno',
    required: true,
    placeholder: 'Ej: García',
    colSpan: 1,
    section: 1
  },
  {
    name: 'NOMBRES',
    type: 'text',
    label: 'Nombres',
    required: true,
    placeholder: 'Ej: Juan Carlos',
    colSpan: 2,
    section: 1
  },
  {
    name: 'SEXO',
    type: 'select',
    label: 'Sexo',
    required: true,
    options: [
      { value: 'M', label: 'Masculino' },
      { value: 'F', label: 'Femenino' }
    ],
    colSpan: 1,
    section: 1
  },
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
    colSpan: 3,
    section: 1,
    getDownloadUrl: (fileValue) => {
      if (fileValue && fileValue.storagePath) {
        return getDniUrl(fileValue.storagePath);
      }
      return null;
    }
  },
  {
    name: 'DNI_FECHA_VENCIMIENTO',
    type: 'native-date',
    label: 'Vencimiento del DNI',
    required: false,
    colSpan: 1,
    section: 1
  },
  {
    name: 'CODIGO_UBIGEO_NACIMIENTO',
    type: 'text',
    label: 'Código Ubigeo (Nacimiento)',
    required: false,
    placeholder: '6 dígitos',
    maxLength: 6,
    colSpan: 1,
    section: 1
  },
  {
    name: 'FECHA_NACIMIENTO',
    type: 'native-date',
    label: 'Fecha de Nacimiento',
    required: true,
    max: new Date().toISOString().split('T')[0],
    colSpan: 1,
    section: 1
  },
  // ════════════════════════════════════════════════════════════
  // SECCIÓN 2: Contacto y Ubicación
  // ════════════════════════════════════════════════════════════
  {
    name: 'EMAIL',
    type: 'text',
    label: 'Email',
    required: true,
    placeholder: 'ejemplo@correo.com',
    colSpan: 1,
    section: 2
  },
  {
    name: 'TELEFONO',
    type: 'text',
    label: 'Teléfono',
    required: false,
    placeholder: 'Ej: 987654321',
    colSpan: 1,
    section: 2
  },
  {
    name: 'TELEFONO_OPCIONAL',
    type: 'text',
    label: 'Teléfono Opcional',
    required: false,
    placeholder: 'Ej: 987654321',
    colSpan: 1,
    section: 2
  },
  {
    name: 'DEPARTAMENTO',
    type: 'text',
    label: 'Departamento',
    required: true,
    placeholder: 'Ej: Lima',
    colSpan: 1,
    section: 2
  },
  {
    name: 'PROVINCIA',
    type: 'text',
    label: 'Provincia',
    required: true,
    placeholder: 'Ej: Lima',
    colSpan: 1,
    section: 2
  },
  {
    name: 'DISTRITO',
    type: 'text',
    label: 'Distrito',
    required: true,
    placeholder: 'Ej: Miraflores',
    colSpan: 1,
    section: 2
  },
  {
    name: 'DIRECCION',
    type: 'text',
    label: 'Dirección',
    required: false,
    placeholder: 'Ej: Av. Principal 123',
    colSpan: 2,
    section: 2
  },
  {
    name: 'REF_DOM',
    type: 'text',
    label: 'Referencia de Domicilio',
    required: false,
    placeholder: 'Ej: Frente al parque',
    colSpan: 1,
    section: 2
  },
  // ════════════════════════════════════════════════════════════
  // SECCIÓN 3: Discapacidad
  // ════════════════════════════════════════════════════════════
  {
    name: 'DISCAPACIDAD',
    type: 'boolean',
    label: '¿Cuenta usted con alguna discapacidad?',
    required: false,
    defaultValue: false,
    colSpan: 3,
    section: 3
  },
  {
    name: 'TIPO_DISCAPACIDAD',
    type: 'text',
    label: 'Tipo de Discapacidad',
    required: false,
    placeholder: 'Ej: Visual',
    hidden: { field: 'DISCAPACIDAD', op: '=', value: false },
    blocked: { clearOnBlock: true, field: 'DISCAPACIDAD', op: '=', value: false },
    colSpan: 2,
    section: 3
  },
  {
    name: 'NRO_CONADIS',
    type: 'text',
    label: 'N° CONADIS',
    required: false,
    placeholder: 'Ej: 1234567',
    hidden: { field: 'DISCAPACIDAD', op: '=', value: false },
    blocked: { clearOnBlock: true, field: 'DISCAPACIDAD', op: '=', value: false },
    colSpan: 1,
    section: 3
  },
  {
    name: 'CONADIS_ARCHIVO',
    type: 'file',
    label: 'Certificado CONADIS',
    accept: '.pdf',
    maxSize: 10 * 1024 * 1024,
    singleFile: true,
    showPreview: true,
    allowDragDrop: true,
    ignoreField: true,
    hidden: { field: 'DISCAPACIDAD', op: '=', value: false },
    blocked: { clearOnBlock: true, field: 'DISCAPACIDAD', op: '=', value: false },
    colSpan: 3,
    section: 3,
    getDownloadUrl: (fileValue) => {
      if (fileValue && fileValue.storagePath) {
        return getConadisUrl(fileValue.storagePath);
      }
      return null;
    }
  },
  // ════════════════════════════════════════════════════════════
  // SECCIÓN 4: Roles (sin título)
  // ════════════════════════════════════════════════════════════
  {
    name: 'ID_ROLES',
    type: 'reference-array',
    label: 'Roles Asignados',
    ignoreField: true,
    referenceTable: 'ROLES',
    referenceField: 'ID_ROL',
    referenceLabelField: 'NOMBRE_ROL',
    referenceFilters: [{ field: 'ES_SISTEMA', op: '=', value: false }],
    searchable: true,
    placeholder: 'Seleccionar roles...',
    required: false,
    showRefreshButton: true,
    colSpan: 3,
    section: 4
  }
];

/**
 * Layout del formulario de usuarios: 3 columnas con secciones
 */
export const usuariosFormLayout = {
  type: 'single',
  columns: 3,
  sections: [
    { id: 'sec-dni', title: 'Datos del DNI', columns: 3 },
    { id: 'sec-contacto-ubicacion', title: 'Contacto y Ubicación', columns: 3 },
    { id: 'sec-discapacidad', title: 'Discapacidad', columns: 3 },
    { id: 'sec-roles', title: '', columns: 3 }
  ]
};

export const usuariosValidation = {
  DNI: {
    required: { value: true, message: 'El DNI es obligatorio' }
  },
  APELLIDO_PATERNO: {
    required: { value: true, message: 'El apellido paterno es obligatorio' }
  },
  APELLIDO_MATERNO: {
    required: { value: true, message: 'El apellido materno es obligatorio' }
  },
  NOMBRES: {
    required: { value: true, message: 'Los nombres son obligatorios' }
  },
  SEXO: {
    required: { value: true, message: 'El sexo es obligatorio' }
  },
  EMAIL: {
    required: { value: true, message: 'El email es obligatorio' }
  },
  FECHA_NACIMIENTO: {
    required: { value: true, message: 'La fecha de nacimiento es obligatoria' }
  },
  DEPARTAMENTO: {
    required: { value: true, message: 'El departamento es obligatorio' }
  },
  PROVINCIA: {
    required: { value: true, message: 'La provincia es obligatoria' }
  },
  DISTRITO: {
    required: { value: true, message: 'El distrito es obligatorio' }
  }
};

export const usuariosModalConfig = {
  createTitle: 'Crear Nuevo Usuario',
  editTitle: 'Editar Usuario',
  deleteTitle: '¿Eliminar usuario?',
  deleteMessage: (row) => `¿Estás seguro de que deseas eliminar al usuario "${row?.NOMBRE_COMPLETO || row?.NOMBRES}"?`,
  widthClass: 'w-1/2',
  size: '2xl'
};
