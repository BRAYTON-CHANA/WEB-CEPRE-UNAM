import React, { useState, useRef, useEffect } from 'react';
import BaseInput from './BaseInput';
import FileIcon from '../icons/FileIcon';
import { 
  FILE_TYPES, 
  getFileTypeInfo, 
  validateFile, 
  getCombinedFileTypeConfig,
  formatFileSize 
} from '../../../constants/fileConstants';

/**
 * Componente FileInput especializado mejorado
 * Usa BaseInput como base pero renderiza un input file con funcionalidades avanzadas
 * Incluye visualización personalizada por tipo, iconos representativos y comportamiento dinámico
 */
const FileInput = ({ 
  // Props específicas de archivo
  accept = '*',
  multiple = false,
  maxSize = 5 * 1024 * 1024,  // 5MB por defecto
  showPreview = true,
  showFileList = true,
  allowDragDrop = true,
  maxFiles = 5,
  singleFile = true,  // Nuevo: para distinguir single vs multi-file
  
  // Props de validación nuevas
  fileTypes = [],
  allowedExtensions = [],
  validationMode = 'strict',
  
  // Props de visualización
  showFileIcon = true,
  replaceMode = 'click',
  
  // Props de validación legacy
  allowedTypes = [],
  minFiles = 1,

  // Función para obtener URL de descarga de archivo existente (storage)
  getDownloadUrl = null,

  // Pasar todas las demás props al BaseInput
  ...baseInputProps
}) => {
  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);
  
  // Estado mejorado para manejo dinámico
  const [fileState, setFileState] = useState({
    hasFile: false,
    fileType: null,
    fileName: '',
    fileSize: 0,
    previewUrl: null,
    isReplacing: false,
    errors: []
  });
  
  const [dragActive, setDragActive] = useState(false);
  const lastValueRef = useRef(null);
  const objectUrlRef = useRef(null);  // URL temporal para archivos recién subidos
  const [resolvedUrl, setResolvedUrl] = useState(null);  // URL firmada de archivo existente
  const [urlLoading, setUrlLoading] = useState(false);

  // Limpiar object URL al desmontar
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  // Cargar URL firmada para archivo existente si no hay previewUrl
  useEffect(() => {
    if (fileState.hasFile && !fileState.previewUrl && !resolvedUrl && getDownloadUrl && !urlLoading) {
      setUrlLoading(true);
      const currentValue = baseInputProps.value;
      Promise.resolve(getDownloadUrl(currentValue))
        .then(url => setResolvedUrl(url))
        .catch(err => console.error('[FileInput] Error obteniendo URL:', err))
        .finally(() => setUrlLoading(false));
    }
    // Limpiar resolvedUrl cuando cambia el archivo
    if (!fileState.hasFile && resolvedUrl) {
      setResolvedUrl(null);
    }
  }, [fileState.hasFile, fileState.previewUrl, resolvedUrl, getDownloadUrl, urlLoading, baseInputProps.value]);

  // Inicializar el estado del archivo cuando el value representa un archivo existente
  useEffect(() => {
    const currentValue = baseInputProps.value;

    if (currentValue === lastValueRef.current) return;
    lastValueRef.current = currentValue;

    // Limpiar URL firmada anterior siempre que cambia el value
    setResolvedUrl(null);

    if (
      currentValue &&
      typeof currentValue === 'object' &&
      !Array.isArray(currentValue) &&
      !(currentValue instanceof File) &&
      currentValue.name
    ) {
      const file = currentValue;

      const typeInfo = getFileTypeInfo(file) || {
        category: 'documents',
        icon: 'document',
        label: 'Documento',
        showPreview: false
      };
      setFileState({
        hasFile: true,
        fileType: typeInfo,
        fileName: file.name || 'Archivo',
        fileSize: file.size || 0,
        previewUrl: file.url || null,
        isReplacing: false,
        errors: []
      });
    } else if (!currentValue || currentValue === '') {
      // Resetear fileState cuando no hay archivo
      setFileState({
        hasFile: false,
        fileType: null,
        fileName: '',
        fileSize: 0,
        previewUrl: null,
        isReplacing: false,
        errors: []
      });
    }
  }, [baseInputProps.value]);

  // Obtener configuración combinada de tipos de archivo
  const fileConfig = React.useMemo(() => {
    if (fileTypes.length > 0) {
      return getCombinedFileTypeConfig(fileTypes);
    }
    
    // Compatibilidad con accept
    if (accept && accept !== '*') {
      // Convertir accept a configuración básica
      const extensions = accept.split(',').map(ext => {
        const cleanExt = ext.trim();
        return cleanExt.startsWith('.') ? cleanExt : `.${cleanExt.replace('/*', '')}`;
      });
      
      return {
        mimeTypes: [],
        extensions: extensions,
        label: `Archivos (${extensions.join(', ')})`,
        maxFileSize: maxSize,
        showPreview: showPreview
      };
    }
    
    return {
      mimeTypes: [],
      extensions: [],
      label: 'Todos los archivos',
      maxFileSize: maxSize,
      showPreview: showPreview
    };
  }, [fileTypes, accept, maxSize, showPreview]);

  // Validar archivo con configuración mejorada
  const validateFileEnhanced = (file) => {
    const config = {
      ...fileConfig,
      mimeTypes: fileConfig.mimeTypes.length > 0 ? fileConfig.mimeTypes : undefined,
      extensions: allowedExtensions.length > 0 ? allowedExtensions : (fileConfig.extensions || []),
      maxFileSize: maxSize
    };
    
    return validateFile(file, config);
  };

  // Obtener extensiones para display (misma lógica que validación)
  const displayExtensions = allowedExtensions.length > 0 ? allowedExtensions : fileConfig.extensions;

  // Manejar selección de archivos
  const handleFileSelect = (files) => {
    const fileArray = Array.from(files);
    
    // Para modo single file, solo tomar el primer archivo
    const fileToProcess = singleFile ? fileArray[0] : null;
    
    if (!fileToProcess) {
      return;
    }
    
    // 1. Validar PRIMERO (crítico)
    const validation = validateFileEnhanced(fileToProcess);
    
    if (!validation.isValid) {
      // Mostrar errores inmediatamente sin procesar el archivo
      setFileState({
        hasFile: false,
        fileType: null,
        fileName: '',
        fileSize: 0,
        previewUrl: null,
        isReplacing: false,
        errors: [{
          file: fileToProcess.name,
          errors: validation.errors
        }]
      });
      return;
    }
    
    // 2. Solo procesar si es válido
    const typeInfo = getFileTypeInfo(fileToProcess);
    
    // Crear preview para imágenes
    let previewUrl = null;
    if (typeInfo.showPreview && showPreview && fileToProcess.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFileState(prev => ({ ...prev, previewUrl: e.target.result }));
      };
      reader.readAsDataURL(fileToProcess);
    }

    // Crear object URL para documentos (permite "Ver archivo" en nueva pestaña)
    if (!fileToProcess.type.startsWith('image/')) {
      // Limpiar URL anterior si existe
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      previewUrl = URL.createObjectURL(fileToProcess);
      objectUrlRef.current = previewUrl;
    }
    
    setFileState({
      hasFile: true,
      fileType: typeInfo,
      fileName: fileToProcess.name,
      fileSize: fileToProcess.size,
      previewUrl: fileToProcess.type.startsWith('image/') ? null : previewUrl,
      isReplacing: false,
      errors: []
    });
    
    // Llamar onChange con archivo válido
    if (baseInputProps.onChange) {
      baseInputProps.onChange(baseInputProps.name, [fileToProcess]);
    }
  };

  // Manejar drag & drop
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (allowDragDrop && e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  // Manejar click en el input
  const handleInputClick = () => {
    if (fileState.hasFile && replaceMode === 'click') {
      // Modo reemplazo: limpiar estado actual y permitir nueva selección
      setFileState({
        hasFile: false,
        fileType: null,
        fileName: '',
        fileSize: 0,
        previewUrl: null,
        isReplacing: true,
        errors: []
      });
    }
    
    fileInputRef.current?.click();
  };

  // Eliminar archivo actual
  const removeFile = () => {
    // Limpiar object URL si existe
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setFileState({
      hasFile: false,
      fileType: null,
      fileName: '',
      fileSize: 0,
      previewUrl: null,
      isReplacing: false,
      errors: []
    });
    
    if (baseInputProps.onChange) {
      baseInputProps.onChange(baseInputProps.name, []);
    }
  };

  // Validar archivos seleccionados
  const validateFiles = () => {
    if (baseInputProps.required && !fileState.hasFile) {
      return 'Debes seleccionar al menos un archivo';
    }
    
    if (fileState.errors.length > 0) {
      return fileState.errors[0].errors[0]; // Retornar primer error
    }
    
    return '';
  };

  // Validación específica de archivo
  const fileValidation = {
    ...baseInputProps.validation,
    custom: validateFiles
  };

  // Renderizar preview de imagen
  const ImagePreview = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Imagen Subida</h3>
        <div className="relative inline-block">
          {fileState.previewUrl ? (
            <img 
              src={fileState.previewUrl} 
              alt={fileState.fileName}
              className="max-w-xs max-h-48 rounded-lg border border-gray-300 shadow-md"
            />
          ) : (
            <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
              <FileIcon type="image" size="lg" />
            </div>
          )}
          
          {replaceMode === 'click' && (
            <button
              type="button"
              onClick={handleInputClick}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors"
              title="Reemplazar imagen"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      <div className="text-center">
        <p className="text-sm font-medium text-gray-900">{fileState.fileName}</p>
        <p className="text-xs text-gray-500">{formatFileSize(fileState.fileSize)}</p>
        <button
          type="button"
          onClick={handleInputClick}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Reemplazar Imagen
        </button>
      </div>
    </div>
  );

  // Renderizar preview de documento
  const DocumentPreview = () => {
    const isPdf = fileState.fileType?.icon === 'pdf' ||
      fileState.fileName?.toLowerCase().endsWith('.pdf') ||
      fileState.fileType?.label?.toLowerCase().includes('pdf');
    const viewUrl = fileState.previewUrl || resolvedUrl;

    return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Documento Subido</h3>
        <div className="inline-flex flex-col items-center space-y-3 p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          {showFileIcon && (
            <FileIcon type={fileState.fileType.icon} size="xl" />
          )}

          <div>
            <p className="text-lg font-bold text-gray-900">{fileState.fileName}</p>
            <p className="text-sm text-gray-600">{fileState.fileType.label}</p>
            <p className="text-xs text-gray-500">{formatFileSize(fileState.fileSize)}</p>

            {viewUrl && (
              <a
                href={viewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                title={isPdf ? 'Abrir PDF en nueva pestaña' : 'Descargar archivo'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isPdf ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  )}
                </svg>
                {isPdf ? 'Ver archivo' : 'Descargar archivo'}
              </a>
            )}
            {!viewUrl && urlLoading && (
              <div className="mt-3 inline-flex items-center gap-2 text-sm text-gray-500">
                <span className="inline-block w-3.5 h-3.5 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
                Obteniendo URL...
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleInputClick}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Cargar Otro Archivo
          </button>
        </div>
      </div>
    </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Label usando BaseInput (sin input oculto) */}
      {baseInputProps.label && (
        <div className="mb-2">
          <label 
            className={`
              block text-sm font-medium text-gray-700
              ${baseInputProps.disabled ? 'text-gray-400' : ''}
            `}
          >
            {baseInputProps.label}
            {baseInputProps.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        </div>
      )}

      {/* Input oculto para compatibilidad */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        disabled={baseInputProps.disabled}
      />

      {/* Renderizado condicional según estado */}
      {!fileState.hasFile ? (
        /* Área de drag & drop */
        allowDragDrop && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleInputClick}
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              ${dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
              }
              ${baseInputProps.disabled ? 'opacity-50 cursor-not-allowed' : ''}
              transition-colors duration-200
            `}
          >
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-4-4v4a4 4 0 014 4h4M7 16a4 4 0 01-4-4v4a4 4 0 014 4z" />
            </svg>
            
            <p className="text-sm text-gray-600 mb-2">
              {fileState.isReplacing ? 'Selecciona un nuevo archivo' : 'Arrastra y suelta archivos aquí'}
            </p>
            
            {/* Información DENTRO del área */}
            <div className="space-y-1 text-xs text-gray-500 mb-4">
              <p>
                {fileConfig.label}
              </p>
              
              {displayExtensions.length > 0 && (
                <p>
                  Extensiones permitidas: {displayExtensions.join(', ')}
                </p>
              )}
              
              {fileConfig.maxFileSize && (
                <p>
                  Tamaño máximo: {formatFileSize(fileConfig.maxFileSize)}
                </p>
              )}
              
              {baseInputProps.required && (
                <p className="text-red-500 font-medium">
                  Campo obligatorio
                </p>
              )}
            </div>
            
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              Seleccionar Archivos
            </button>
          </div>
        )
      ) : (
        /* Preview según tipo de archivo */
        fileState.fileType.showPreview && fileState.fileType.category === 'images' ? (
          <ImagePreview />
        ) : (
          <DocumentPreview />
        )
      )}

      {/* Errores de validación */}
      {fileState.errors.length > 0 && (
        <div className="mt-2 space-y-1">
          {fileState.errors.map((error, index) => (
            <div key={index} className="text-sm text-red-600">
              <strong>{error.file}:</strong> {error.errors.join(', ')}
            </div>
          ))}
        </div>
      )}

      {/* Error de validación del formulario */}
      {baseInputProps.error && baseInputProps.touched && (
        <div 
          className="mt-2 flex items-center text-sm text-red-600"
          role="alert"
        >
          <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          {baseInputProps.error}
        </div>
      )}

      {/* Información de configuración */}
      <div className="mt-2 text-xs text-gray-500">
        {singleFile ? (
          // Modo single file
          <>
            {fileConfig.maxFileSize && (
              <span>Tamaño máximo: {formatFileSize(fileConfig.maxFileSize)}</span>
            )}
          </>
        ) : (
          // Modo multi-file
          <>
            {maxFiles > 1 && (
              <span>Máximo {maxFiles} archivos</span>
            )}
            {fileConfig.maxFileSize && (
              <span className="ml-2">• {formatFileSize(fileConfig.maxFileSize)} c/u</span>
            )}
          </>
        )}
        {baseInputProps.required && (
          <span className="ml-2">• Obligatorio</span>
        )}
      </div>
    </div>
  );
};

export default FileInput;
