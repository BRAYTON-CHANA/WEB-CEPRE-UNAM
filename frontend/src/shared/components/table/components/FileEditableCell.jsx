import React, { useState, useRef, useCallback } from 'react';
import cacheService from '@/shared/services/cacheService';

/**
 * FileEditableCell — celda inline para ver/subir/reemplazar archivos.
 *
 * Estados visuales:
 *  - Sin archivo: botón "Subir archivo" con icono clip
 *  - Con archivo: filename + icono ojo (ver) + icono reemplazar (↻)
 *  - Subiendo: spinner
 *  - Error: icono ⚠ con tooltip
 *
 * Props:
 *  - column: { uploadFunction, getUrlFunction, targetTable, targetPrimaryKey }
 *  - value: STORAGE_PATH actual
 *  - rowData: fila completa (para filename, content_type, etc)
 *  - rowId: ID del registro
 *  - primaryKey: nombre del PK
 *  - onSaveSuccess: callback (rowId, field, newValue)
 *  - onSaveError: callback (rowId, field, error)
 */
const FileEditableCell = ({
  column,
  value,
  rowData,
  rowId,
  primaryKey = 'id',
  onSaveSuccess,
  onSaveError
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [localMeta, setLocalMeta] = useState(null); // { filename, contentType } tras subida
  const fileInputRef = useRef(null);

  const hasFile = Boolean(value || rowData?.STORAGE_PATH || localMeta);
  const filename = localMeta?.filename || rowData?.FILENAME || (value ? String(value).split('/').pop() : null);
  const contentType = localMeta?.contentType || rowData?.CONTENT_TYPE;

  const handleFileSelect = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ''; // reset para permitir re-seleccionar el mismo archivo

    setIsUploading(true);
    setError(null);
    try {
      const result = await column.uploadFunction(rowId, file);
      cacheService.invalidateAll();
      setLocalMeta({ filename: result.filename, contentType: result.contentType });
      onSaveSuccess?.(rowId, 'STORAGE_PATH', result.path, primaryKey);
    } catch (err) {
      setError(err.message || 'Error al subir archivo');
      onSaveError?.(rowId, 'STORAGE_PATH', err, primaryKey);
    } finally {
      setIsUploading(false);
    }
  }, [column, rowId, primaryKey, onSaveSuccess, onSaveError]);

  const handleView = useCallback(async (e) => {
    e.stopPropagation();
    if (!value && !rowData?.STORAGE_PATH) return;
    try {
      const url = await column.getUrlFunction(value || rowData.STORAGE_PATH);
      window.open(url, '_blank');
    } catch (err) {
      setError(err.message || 'Error al abrir archivo');
    }
  }, [value, rowData, column]);

  const handleReplace = useCallback((e) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  }, []);

  const handleUploadClick = useCallback((e) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  }, []);

  // Input file oculto
  const accept = column.accept || '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.png,.jpg,.jpeg';
  const maxSize = column.maxSize || 10 * 1024 * 1024;

  const handleInputChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file && file.size > maxSize) {
      setError(`Archivo demasiado grande (máx ${Math.round(maxSize / 1024 / 1024)}MB)`);
      return;
    }
    handleFileSelect(e);
  }, [maxSize, handleFileSelect]);

  return (
    <td className="px-4 py-2.5 text-sm whitespace-nowrap">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
      />

      {!hasFile && !isUploading && (
        <button
          onClick={handleUploadClick}
          className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-xs font-medium"
          title="Subir archivo"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Subir archivo
        </button>
      )}

      {hasFile && !isUploading && (
        <div className="inline-flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-gray-700 text-xs truncate max-w-[180px]" title={filename}>
            {renderFileIcon(contentType || filename)}
            <span className="truncate">{filename}</span>
          </span>
          <button
            onClick={handleView}
            className="text-blue-500 hover:text-blue-700 shrink-0"
            title="Ver archivo"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          <button
            onClick={handleReplace}
            className="text-blue-500 hover:text-blue-700 shrink-0"
            title="Reemplazar archivo"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </button>
        </div>
      )}

      {isUploading && (
        <div className="inline-flex items-center gap-2">
          <span className="text-gray-400 text-xs">Subiendo...</span>
          <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600"></span>
        </div>
      )}

      {error && !isUploading && (
        <div className="inline-flex items-center gap-1" title={error}>
          <span className="text-red-500 text-xs">⚠</span>
          <span className="text-red-500 text-xs truncate max-w-[120px]">{error}</span>
        </div>
      )}
    </td>
  );
};

// ── Helper: icono SVG según tipo de archivo ───────────────────────
function renderFileIcon(contentTypeOrFilename) {
  const str = String(contentTypeOrFilename || '').toLowerCase();

  // PDF — rojo
  if (str.includes('pdf') || str.endsWith('.pdf')) {
    return (
      <svg className="w-4 h-4 shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 24">
        <path d="M14 0H2a2 2 0 00-2 2v20a2 2 0 002 2h16a2 2 0 002-2V6l-6-6zm-1 7V1.5L18.5 7H13z" opacity="0.2"/>
        <path fill="none" stroke="currentColor" strokeWidth="1.5" d="M14 0H2a2 2 0 00-2 2v20a2 2 0 002 2h16a2 2 0 002-2V6l-6-6z"/>
        <text x="5" y="17" fontSize="6" fontWeight="bold" fill="currentColor">PDF</text>
      </svg>
    );
  }

  // Word — azul
  if (str.includes('word') || str.includes('msword') || str.endsWith('.doc') || str.endsWith('.docx')) {
    return (
      <svg className="w-4 h-4 shrink-0 text-blue-600" fill="currentColor" viewBox="0 0 20 24">
        <path d="M14 0H2a2 2 0 00-2 2v20a2 2 0 002 2h16a2 2 0 002-2V6l-6-6z" opacity="0.15"/>
        <path fill="none" stroke="currentColor" strokeWidth="1.5" d="M14 0H2a2 2 0 00-2 2v20a2 2 0 002 2h16a2 2 0 002-2V6l-6-6z"/>
        <text x="3" y="17" fontSize="5" fontWeight="bold" fill="currentColor">DOC</text>
      </svg>
    );
  }

  // Excel — verde
  if (str.includes('excel') || str.includes('spreadsheet') || str.endsWith('.xls') || str.endsWith('.xlsx')) {
    return (
      <svg className="w-4 h-4 shrink-0 text-green-600" fill="currentColor" viewBox="0 0 20 24">
        <path d="M14 0H2a2 2 0 00-2 2v20a2 2 0 002 2h16a2 2 0 002-2V6l-6-6z" opacity="0.15"/>
        <path fill="none" stroke="currentColor" strokeWidth="1.5" d="M14 0H2a2 2 0 00-2 2v20a2 2 0 002 2h16a2 2 0 002-2V6l-6-6z"/>
        <text x="3" y="17" fontSize="5" fontWeight="bold" fill="currentColor">XLS</text>
      </svg>
    );
  }

  // PowerPoint — naranja
  if (str.includes('powerpoint') || str.includes('presentation') || str.endsWith('.ppt') || str.endsWith('.pptx')) {
    return (
      <svg className="w-4 h-4 shrink-0 text-orange-600" fill="currentColor" viewBox="0 0 20 24">
        <path d="M14 0H2a2 2 0 00-2 2v20a2 2 0 002 2h16a2 2 0 002-2V6l-6-6z" opacity="0.15"/>
        <path fill="none" stroke="currentColor" strokeWidth="1.5" d="M14 0H2a2 2 0 00-2 2v20a2 2 0 002 2h16a2 2 0 002-2V6l-6-6z"/>
        <text x="3" y="17" fontSize="5" fontWeight="bold" fill="currentColor">PPT</text>
      </svg>
    );
  }

  // Imagen — púrpura
  if (str.includes('image') || str.endsWith('.png') || str.endsWith('.jpg') || str.endsWith('.jpeg') || str.endsWith('.gif')) {
    return (
      <svg className="w-4 h-4 shrink-0 text-purple-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21" />
      </svg>
    );
  }

  // ZIP — amarillo
  if (str.endsWith('.zip') || str.includes('zip') || str.includes('compressed')) {
    return (
      <svg className="w-4 h-4 shrink-0 text-yellow-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V10a2 2 0 00-2-2M5 8V4a2 2 0 012-2h4v4M9 4v4M9 12v2M9 16v2" />
      </svg>
    );
  }

  // Default — gris
  return (
    <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}

export default FileEditableCell;
