import React, { useState, useEffect, useRef, useCallback } from 'react';
import Modal from '@/shared/components/modal/views/Modal';
import { getDniUrl, uploadDniFile } from '@/features/usuarios/services/usuariosStorageService';
import { db } from '@/shared/api';
import cacheService from '@/shared/services/cacheService';

/**
 * DniViewerModal — modal con visor PDF embebido para el documento de DNI.
 * Permite ver el PDF actual y reemplazarlo por uno nuevo.
 *
 * @param {boolean} open - si el modal está abierto
 * @param {Object|null} user - fila del usuario (con DNI_STORAGE_PATH, ID_USUARIO, NOMBRE_COMPLETO)
 * @param {Function} onClose - handler para cerrar
 * @param {Function} onUpdated - callback tras reemplazar el archivo (para refrescar tabla)
 */
function DniViewerModal({ open, user, onClose, onUpdated }) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!open || !user?.DNI_STORAGE_PATH) {
      setUrl(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setUrl(null);

    getDniUrl(user.DNI_STORAGE_PATH)
      .then((signedUrl) => {
        if (!cancelled) {
          setUrl(signedUrl);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'No se pudo obtener el archivo de DNI');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, user]);

  const handleReplaceClick = useCallback(() => {
    setUploadError(null);
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar que sea PDF
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setUploadError('Solo se permiten archivos PDF');
      e.target.value = '';
      return;
    }

    // Validar tamaño (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('El archivo es demasiado grande (máx 10MB)');
      e.target.value = '';
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const idUsuario = user?.ID_USUARIO;
      if (!idUsuario) throw new Error('No se pudo identificar al usuario');

      // Subir archivo al storage
      const uploadResult = await uploadDniFile(idUsuario, file);

      // Actualizar metadata en la BD
      await db.update('USUARIOS', idUsuario, {
        DNI_STORAGE_PATH: uploadResult.path,
        DNI_FILENAME: uploadResult.filename,
        DNI_CONTENT_TYPE: uploadResult.contentType,
        DNI_TAMAÑO_BYTES: uploadResult.size
      }, 'ID_USUARIO');

      cacheService.invalidateAll();

      // Recargar la URL firmada con el nuevo path
      const newUrl = await getDniUrl(uploadResult.path);
      setUrl(newUrl);

      // Notificar a la tabla para refrescar
      if (onUpdated) onUpdated();
    } catch (err) {
      setUploadError(err.message || 'Error al reemplazar el archivo');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }, [user, onUpdated]);

  const userName = user?.NOMBRE_COMPLETO || [user?.NOMBRES, user?.APELLIDO_PATERNO].filter(Boolean).join(' ') || 'Usuario';

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={`DNI — ${userName}`}
      size="2xl"
      closeOnOutsideClick={false}
    >
      <div className="p-4">
        {/* Input file oculto */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Barra de acciones superior */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {user?.DNI_TIENE_ARCHIVO ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Con archivo
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Sin archivo
              </span>
            )}

            {user?.DNI_ESTADO && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                user.DNI_ESTADO === 'Vigente' ? 'bg-green-100 text-green-700'
                  : user.DNI_ESTADO === 'Vencido' ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {user.DNI_ESTADO === 'Vigente' && (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {user.DNI_ESTADO === 'Vencido' && (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {user.DNI_ESTADO}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleReplaceClick}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {uploading ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {user?.DNI_TIENE_ARCHIVO ? 'Reemplazar' : 'Subir PDF'}
              </>
            )}
          </button>
        </div>

        {/* Error de upload */}
        {uploadError && (
          <div className="mb-3 p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{uploadError}</p>
          </div>
        )}

        {/* Contenido principal */}
        {loading && (
          <div className="text-center py-16">
            <div className="inline-block w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-3" />
            <p className="text-sm text-gray-500">Cargando documento...</p>
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        )}

        {!loading && !error && !url && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 mb-4">Este usuario no tiene archivo de DNI subido.</p>
            <p className="text-xs text-gray-400">Usa el botón "Subir PDF" para agregar uno.</p>
          </div>
        )}

        {!loading && !error && url && (
          <div className="rounded-lg overflow-hidden border border-gray-200">
            <iframe
              src={url}
              title={`DNI — ${userName}`}
              className="w-full h-[75vh]"
              style={{ border: 'none' }}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}

export default DniViewerModal;
