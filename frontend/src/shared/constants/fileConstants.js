/**
 * Constantes para tipos de archivo con iconos, colores y validaciones
 * Sistema centralizado para manejo de archivos en FileInput
 */

// Iconos SVG para diferentes tipos de archivo
export const FILE_ICONS = {
  // Imágenes
  image: `<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>`,
  
  // PDF
  pdf: `<svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18.5,9H13V3.5L18.5,9M6,20V4H11V10H18V20H6Z" />
    <rect x="8" y="12" width="8" height="2" fill="#DC2626"/>
    <rect x="8" y="15" width="6" height="1" fill="#DC2626"/>
  </svg>`,
  
  // Word
  word: `<svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18.5,9H13V3.5L18.5,9M6,20V4H11V10H18V20H6Z" />
    <text x="12" y="16" text-anchor="middle" font-size="8" font-weight="bold" fill="#2563EB">W</text>
  </svg>`,
  
  // Excel
  excel: `<svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18.5,9H13V3.5L18.5,9M6,20V4H11V10H18V20H6Z" />
    <text x="12" y="16" text-anchor="middle" font-size="8" font-weight="bold" fill="#16A34A">X</text>
  </svg>`,
  
  // PowerPoint
  powerpoint: `<svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18.5,9H13V3.5L18.5,9M6,20V4H11V10H18V20H6Z" />
    <text x="12" y="16" text-anchor="middle" font-size="8" font-weight="bold" fill="#DC2626">P</text>
  </svg>`,
  
  // Documento genérico
  document: `<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>`,
  
  // Video
  video: `<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>`,
  
  // Audio
  audio: `<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
  </svg>`,
  
  // Archivo genérico
  file: `<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>`,
  
  // Comprimido
  archive: `<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>`
};

// Definiciones de tipos de archivo con configuración completa
export const FILE_TYPES = {
  // Imágenes
  IMAGES: {
    category: 'images',
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
    label: 'Imágenes',
    icon: 'image',
    color: 'blue',
    showPreview: true,
    maxFileSize: 10 * 1024 * 1024 // 10MB
  },
  
  // PDF específico
  PDF: {
    category: 'documents',
    mimeTypes: ['application/pdf'],
    extensions: ['.pdf'],
    label: 'PDF',
    icon: 'pdf',
    color: 'red',
    showPreview: false,
    maxFileSize: 20 * 1024 * 1024 // 20MB
  },
  
  // Word
  WORD: {
    category: 'documents',
    mimeTypes: [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    extensions: ['.doc', '.docx'],
    label: 'Word',
    icon: 'word',
    color: 'blue',
    showPreview: false,
    maxFileSize: 10 * 1024 * 1024 // 10MB
  },
  
  // Excel
  EXCEL: {
    category: 'documents',
    mimeTypes: [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    extensions: ['.xls', '.xlsx'],
    label: 'Excel',
    icon: 'excel',
    color: 'green',
    showPreview: false,
    maxFileSize: 10 * 1024 * 1024 // 10MB
  },
  
  // PowerPoint
  POWERPOINT: {
    category: 'documents',
    mimeTypes: [
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ],
    extensions: ['.ppt', '.pptx'],
    label: 'PowerPoint',
    icon: 'powerpoint',
    color: 'orange',
    showPreview: false,
    maxFileSize: 15 * 1024 * 1024 // 15MB
  },
  
  // Videos
  VIDEOS: {
    category: 'media',
    mimeTypes: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'],
    extensions: ['.mp4', '.avi', '.mov', '.wmv', '.webm'],
    label: 'Videos',
    icon: 'video',
    color: 'purple',
    showPreview: false,
    maxFileSize: 100 * 1024 * 1024 // 100MB
  },
  
  // Audio
  AUDIO: {
    category: 'media',
    mimeTypes: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'],
    extensions: ['.mp3', '.wav', '.ogg', '.m4a'],
    label: 'Audio',
    icon: 'audio',
    color: 'pink',
    showPreview: false,
    maxFileSize: 20 * 1024 * 1024 // 20MB
  },
  
  // Archivos comprimidos
  ARCHIVES: {
    category: 'archives',
    mimeTypes: [
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'application/gzip'
    ],
    extensions: ['.zip', '.rar', '.7z', '.gz'],
    label: 'Archivos Comprimidos',
    icon: 'archive',
    color: 'yellow',
    showPreview: false,
    maxFileSize: 50 * 1024 * 1024 // 50MB
  },
  
  // Documentos genéricos
  DOCUMENTS: {
    category: 'documents',
    mimeTypes: [
      'text/plain',
      'text/csv',
      'application/json',
      'application/xml'
    ],
    extensions: ['.txt', '.csv', '.json', '.xml'],
    label: 'Documentos',
    icon: 'document',
    color: 'gray',
    showPreview: false,
    maxFileSize: 5 * 1024 * 1024 // 5MB
  }
};

// Colores para los iconos según el tipo
export const FILE_COLORS = {
  blue: 'bg-blue-100 text-blue-600 border-blue-300',
  red: 'bg-red-100 text-red-600 border-red-300',
  green: 'bg-green-100 text-green-600 border-green-300',
  orange: 'bg-orange-100 text-orange-600 border-orange-300',
  purple: 'bg-purple-100 text-purple-600 border-purple-300',
  pink: 'bg-pink-100 text-pink-600 border-pink-300',
  yellow: 'bg-yellow-100 text-yellow-600 border-yellow-300',
  gray: 'bg-gray-100 text-gray-600 border-gray-300'
};

// Obtener configuración de tipo de archivo por MIME type
export const getFileTypeByMimeType = (mimeType) => {
  for (const [key, type] of Object.entries(FILE_TYPES)) {
    if (type.mimeTypes.includes(mimeType)) {
      return { key, ...type };
    }
  }
  return null;
};

// Obtener configuración de tipo de archivo por extensión
export const getFileTypeByExtension = (fileName) => {
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  
  for (const [key, type] of Object.entries(FILE_TYPES)) {
    if (type.extensions.includes(extension)) {
      return { key, ...type };
    }
  }
  return null;
};

// Obtener configuración combinada para múltiples tipos
export const getCombinedFileTypeConfig = (typeKeys) => {
  const combined = {
    mimeTypes: [],
    extensions: [],
    label: '',
    maxFileSize: 0
  };
  
  const labels = [];
  let showPreview = false;
  
  typeKeys.forEach(key => {
    const type = FILE_TYPES[key];
    if (type) {
      combined.mimeTypes.push(...type.mimeTypes);
      combined.extensions.push(...type.extensions);
      labels.push(type.label);
      combined.maxFileSize = Math.max(combined.maxFileSize, type.maxFileSize);
      showPreview = showPreview || type.showPreview;
    }
  });
  
  combined.label = labels.length > 1 ? labels.slice(0, -1).join(', ') + ' y ' + labels[labels.length - 1] : labels[0] || 'Archivos';
  combined.showPreview = showPreview;
  
  // Eliminar duplicados
  combined.mimeTypes = [...new Set(combined.mimeTypes)];
  combined.extensions = [...new Set(combined.extensions)];
  
  return combined;
};

// Validar archivo según configuración
export const validateFile = (file, config) => {
  const errors = [];
  
  // Validar MIME type
  if (config.mimeTypes && config.mimeTypes.length > 0) {
    if (!config.mimeTypes.includes(file.type)) {
      errors.push(`Tipo de archivo no permitido. Permitidos: ${config.extensions.join(', ')}`);
    }
  }
  
  // Validar extensión
  if (config.extensions && config.extensions.length > 0) {
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!config.extensions.includes(extension)) {
      errors.push(`Extensión no permitida. Permitidas: ${config.extensions.join(', ')}`);
    }
  }
  
  // Validar tamaño
  if (config.maxFileSize && file.size > config.maxFileSize) {
    const maxSizeMB = (config.maxFileSize / (1024 * 1024)).toFixed(1);
    errors.push(`Archivo demasiado grande. Máximo: ${maxSizeMB}MB`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Obtener tipo de archivo para un archivo específico
export const getFileTypeInfo = (file) => {
  // Primero intentar por MIME type
  let typeInfo = getFileTypeByMimeType(file.type);
  
  // Si no se encuentra, intentar por extensión
  if (!typeInfo) {
    typeInfo = getFileTypeByExtension(file.name);
  }
  
  // Si aún no se encuentra, usar tipo genérico
  if (!typeInfo) {
    typeInfo = {
      key: 'DOCUMENTS',
      ...FILE_TYPES.DOCUMENTS,
      label: 'Archivo',
      icon: 'file',
      color: 'gray'
    };
  }
  
  return typeInfo;
};

// Formatear tamaño de archivo
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = (bytes / Math.pow(1024, i)).toFixed(2);
  
  return `${size} ${sizes[i]}`;
};
