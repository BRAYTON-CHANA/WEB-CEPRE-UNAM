import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Modal from '@/shared/components/modal/views/Modal';
import { db } from '@/shared/api';
import cacheService from '@/shared/services/cacheService';
import {
  uploadDocenteFile,
  getDocenteFileUrl,
  getDniUrl,
  DOCENTE_ARCHIVO_TIPOS
} from '@/features/docentes/services/docentesStorageService';

/**
 * DocenteArchivoViewerModal — modal con visor PDF embebido para documentos de docente.
 * Soporta 3 tipos: DNI, Grado/Título, Constancia SUNEDU/DRE.
 *
 * @param {boolean} open - si el modal está abierto
 * @param {Object|null} docente - fila de VW_DOCENTES
 * @param {string} tipoArchivo - 'dni' | 'grado_academico' | 'constancia_sunedu_dre'
 * @param {Function} onClose - handler para cerrar
 * @param {Function} onUpdated - callback tras reemplazar el archivo (para refrescar tabla)
 */
function DocenteArchivoViewerModal({ open, docente, tipoArchivo, onClose, onUpdated }) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [gradoAcademico, setGradoAcademico] = useState('');
  const [gradoDescripcion, setGradoDescripcion] = useState('');
  const [savingCampo, setSavingCampo] = useState(false);
  const fileInputRef = useRef(null);

  // Metadatos según tipo de archivo (memoizado para evitar re-renders)
  const config = useMemo(() => {
    switch (tipoArchivo) {
      case 'dni':
        return {
          label: 'DNI',
          storagePathField: 'DNI_STORAGE_PATH',
          filenameField: 'DNI_FILENAME',
          tieneArchivoField: 'DNI_TIENE_ARCHIVO',
          estadoField: 'DNI_ESTADO',
          targetTable: 'USUARIOS',
          targetPk: 'ID_USUARIO',
          metaFields: ['DNI_STORAGE_PATH', 'DNI_FILENAME', 'DNI_CONTENT_TYPE', 'DNI_TAMAÑO_BYTES'],
          getUrl: getDniUrl,
        };
      case DOCENTE_ARCHIVO_TIPOS.GRADO_ACADEMICO:
        return {
          label: 'Grado/Título',
          storagePathField: 'GRADO_ACADEMICO_STORAGE_PATH',
          filenameField: 'GRADO_ACADEMICO_FILENAME',
          tieneArchivoField: 'GRADO_ACADEMICO_TIENE_ARCHIVO',
          targetTable: 'DOCENTES',
          targetPk: 'ID_DOCENTE',
          metaFields: ['GRADO_ACADEMICO_STORAGE_PATH', 'GRADO_ACADEMICO_FILENAME', 'GRADO_ACADEMICO_CONTENT_TYPE', 'GRADO_ACADEMICO_TAMAÑO_BYTES'],
          getUrl: getDocenteFileUrl,
        };
      case DOCENTE_ARCHIVO_TIPOS.CONSTANCIA_SUNEDU_DRE:
        return {
          label: 'Constancia SUNEDU/DRE',
          storagePathField: 'CONSTANCIA_SUNEDU_DRE_STORAGE_PATH',
          filenameField: 'CONSTANCIA_SUNEDU_DRE_FILENAME',
          tieneArchivoField: 'CONSTANCIA_SUNEDU_DRE_TIENE_ARCHIVO',
          targetTable: 'DOCENTES',
          targetPk: 'ID_DOCENTE',
          metaFields: ['CONSTANCIA_SUNEDU_DRE_STORAGE_PATH', 'CONSTANCIA_SUNEDU_DRE_FILENAME', 'CONSTANCIA_SUNEDU_DRE_CONTENT_TYPE', 'CONSTANCIA_SUNEDU_DRE_TAMAÑO_BYTES'],
          getUrl: getDocenteFileUrl,
        };
      default:
        return null;
    }
  }, [tipoArchivo]);

  useEffect(() => {
    if (!open || !docente || !config) {
      setUrl(null);
      setError(null);
      setLoading(false);
      setFechaVencimiento('');
      setGradoAcademico('');
      setGradoDescripcion('');
      return;
    }

    // Inicializar campos editables según tipo
    setFechaVencimiento(docente.DNI_FECHA_VENCIMIENTO || '');
    setGradoAcademico(docente.GRADO_ACADEMICO || '');
    setGradoDescripcion(docente.GRADO_ACADEMICO_DESCRIPCION || '');

    const storagePath = docente[config.storagePathField];
    if (!storagePath) {
      setUrl(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setUrl(null);

    config.getUrl(storagePath)
      .then((signedUrl) => {
        if (!cancelled) {
          setUrl(signedUrl);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'No se pudo obtener el archivo');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, docente, config]);

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
      const idUsuario = docente?.ID_USUARIO;
      const idDocente = docente?.ID_DOCENTE;
      if (!idUsuario) throw new Error('No se pudo identificar al usuario');

      let uploadResult;
      let updateId;
      let updateTable;

      if (tipoArchivo === 'dni') {
        // DNI se sube con uploadDocenteFile usando tipo 'dni' y se actualiza USUARIOS
        uploadResult = await uploadDocenteFile(idUsuario, file, 'dni');
        updateId = idUsuario;
        updateTable = 'USUARIOS';
      } else {
        // Archivos de docente se suben con tipo específico y se actualiza DOCENTES
        uploadResult = await uploadDocenteFile(idUsuario, file, tipoArchivo);
        updateId = idDocente;
        updateTable = 'DOCENTES';
      }

      // Construir payload de metadata
      const metaPayload = {};
      const fieldMap = {
        dni: {
          path: 'DNI_STORAGE_PATH', filename: 'DNI_FILENAME',
          contentType: 'DNI_CONTENT_TYPE', size: 'DNI_TAMAÑO_BYTES'
        },
        [DOCENTE_ARCHIVO_TIPOS.GRADO_ACADEMICO]: {
          path: 'GRADO_ACADEMICO_STORAGE_PATH', filename: 'GRADO_ACADEMICO_FILENAME',
          contentType: 'GRADO_ACADEMICO_CONTENT_TYPE', size: 'GRADO_ACADEMICO_TAMAÑO_BYTES'
        },
        [DOCENTE_ARCHIVO_TIPOS.CONSTANCIA_SUNEDU_DRE]: {
          path: 'CONSTANCIA_SUNEDU_DRE_STORAGE_PATH', filename: 'CONSTANCIA_SUNEDU_DRE_FILENAME',
          contentType: 'CONSTANCIA_SUNEDU_DRE_CONTENT_TYPE', size: 'CONSTANCIA_SUNEDU_DRE_TAMAÑO_BYTES'
        },
      };
      const fm = fieldMap[tipoArchivo];
      metaPayload[fm.path] = uploadResult.path;
      metaPayload[fm.filename] = uploadResult.filename;
      metaPayload[fm.contentType] = uploadResult.contentType;
      metaPayload[fm.size] = uploadResult.size;

      const pkField = tipoArchivo === 'dni' ? 'ID_USUARIO' : 'ID_DOCENTE';
      await db.update(updateTable, updateId, metaPayload, pkField);

      cacheService.invalidateAll();

      // Recargar la URL firmada con el nuevo path
      const newUrl = await config.getUrl(uploadResult.path);
      setUrl(newUrl);

      // Notificar a la tabla para refrescar
      if (onUpdated) onUpdated();
    } catch (err) {
      setUploadError(err.message || 'Error al reemplazar el archivo');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }, [docente, tipoArchivo, config, onUpdated]);

  // Guardar fecha de vencimiento del DNI (actualiza USUARIOS)
  const handleGuardarFecha = useCallback(async () => {
    const idUsuario = docente?.ID_USUARIO;
    if (!idUsuario) return;
    setSavingCampo(true);
    try {
      await db.update('USUARIOS', idUsuario, {
        DNI_FECHA_VENCIMIENTO: fechaVencimiento || null
      }, 'ID_USUARIO');
      cacheService.invalidateAll();
      if (onUpdated) onUpdated();
    } catch (err) {
      console.error('[DocenteArchivoViewerModal] Error guardando fecha:', err);
    } finally {
      setSavingCampo(false);
    }
  }, [docente, fechaVencimiento, onUpdated]);

  // Guardar grado académico o título profesional (actualiza DOCENTES)
  const handleGuardarTexto = useCallback(async (campo, valor) => {
    const idDocente = docente?.ID_DOCENTE;
    if (!idDocente) return;
    setSavingCampo(true);
    try {
      await db.update('DOCENTES', idDocente, {
        [campo]: valor || null
      }, 'ID_DOCENTE');
      cacheService.invalidateAll();
      if (onUpdated) onUpdated();
    } catch (err) {
      console.error('[DocenteArchivoViewerModal] Error guardando texto:', err);
    } finally {
      setSavingCampo(false);
    }
  }, [docente, onUpdated]);

  if (!config) return null;

  const docenteName = docente?.NOMBRE_COMPLETO || 'Docente';
  const tieneArchivo = docente?.[config.tieneArchivoField];
  const filename = docente?.[config.filenameField];
  const estado = docente?.[config.estadoField];

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={`${config.label} — ${docenteName}`}
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
            {tieneArchivo ? (
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

            {filename && tieneArchivo && (
              <span className="text-xs text-gray-500 truncate max-w-xs" title={filename}>
                {filename}
              </span>
            )}

            {estado && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                estado === 'Vigente' ? 'bg-green-100 text-green-700'
                  : estado === 'Vencido' ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {estado === 'Vigente' && (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {estado === 'Vencido' && (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {estado}
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
                {tieneArchivo ? 'Reemplazar' : 'Subir PDF'}
              </>
            )}
          </button>
        </div>

        {/* Panel de edición según tipo de archivo */}
        {tipoArchivo === 'dni' && (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-medium text-gray-600 mb-2">Vencimiento del DNI</p>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <input
                  type="date"
                  value={fechaVencimiento || ''}
                  onChange={(e) => setFechaVencimiento(e.target.value)}
                  disabled={savingCampo}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={handleGuardarFecha}
                disabled={savingCampo}
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {savingCampo ? 'Guardando...' : 'Guardar fecha'}
              </button>
            </div>
          </div>
        )}

        {tipoArchivo === DOCENTE_ARCHIVO_TIPOS.GRADO_ACADEMICO && (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Grado/Título</p>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <select
                    value={gradoAcademico || ''}
                    onChange={(e) => setGradoAcademico(e.target.value)}
                    disabled={savingCampo}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="">Sin grado</option>
                    <option value="BACHILLER">Bachiller</option>
                    <option value="TITULO_PROFESIONAL">Título Profesional</option>
                    <option value="MAGISTER">Magíster</option>
                    <option value="DOCTOR">Doctor</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => handleGuardarTexto('GRADO_ACADEMICO', gradoAcademico)}
                  disabled={savingCampo}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {savingCampo ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Descripción (especialidad)</p>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <input
                    type="text"
                    value={gradoDescripcion || ''}
                    onChange={(e) => setGradoDescripcion(e.target.value)}
                    disabled={savingCampo}
                    placeholder="Ej: en Educación, en Ingeniería"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleGuardarTexto('GRADO_ACADEMICO_DESCRIPCION', gradoDescripcion)}
                  disabled={savingCampo}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {savingCampo ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}

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
            <p className="text-sm text-gray-500 mb-4">Este docente no tiene archivo de {config.label.toLowerCase()} subido.</p>
            <p className="text-xs text-gray-400">Usa el botón "Subir PDF" para agregar uno.</p>
          </div>
        )}

        {!loading && !error && url && (
          <div className="rounded-lg overflow-hidden border border-gray-200">
            <iframe
              src={url}
              title={`${config.label} — ${docenteName}`}
              className="w-full h-[75vh]"
              style={{ border: 'none' }}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}

export default DocenteArchivoViewerModal;
