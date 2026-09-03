import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { db } from '@/shared/api';
import { validateFile, formatFileSize } from '../../../constants/fileConstants';

/**
 * PredefinedFilesInput
 *
 * Input genérico para subir archivos contra una lista predefinida de requisitos,
 * agrupados por clasificación, con plantillas opcionales.
 * Reutilizable en diferentes features (postulaciones, proyectos, etc.).
 *
 * Estructura emitida via onChange(name, value):
 * {
 *   contextLabel: "CONTRATADO",   // etiqueta del contexto (ej: condición laboral)
 *   grupos: {
 *     "CV": {
 *       requisitos: [{ id, nombre, plantilla: {rutaPlantilla, filename}|null, archivo: null|{path,filename,contentType,size,subidoEn,file?} }]
 *     },
 *     ...
 *   }
 * }
 *
 * Carga de predefinidos (hybrid):
 *  - loadPredefined(formData) async fn → { contextLabel, grupos } | null
 *  - sourceConfig declarativo → input hace queries a DB
 *
 * Modo "create":
 *  - Carga predefinidos desde loadPredefined o sourceConfig al cambiar triggerField.
 *  - Predefinidos no removibles, no renombrables.
 *  - Botón "Descargar plantilla" si plantilla existe (via getDownloadUrl prop).
 *
 * Modo "edit":
 *  - No consulta DB. Renderiza el JSON existente (snapshot).
 *  - Botón "Descargar plantilla" si plantilla.rutaPlantilla existe (via getDownloadUrl).
 */

const DEFAULT_LABELS = {
  predefinido: 'Predefinido',
  plantilla: 'Plantilla',
  subir: 'Subir archivo',
  reemplazar: 'Reemplazar',
  quitar: 'Quitar',
  ver: 'Ver',
  sinTrigger: 'Seleccione un elemento para cargar los documentos.',
  contextBadgePrefix: '',
  cargando: 'Cargando documentos...',
  sinAdjuntos: 'Sin adjuntos.',
  sinPredefinidos: 'No hay documentos configurados para este contexto.',
  confirmarReset: 'Cambiar el elemento reemplazará los documentos cargados. ¿Desea continuar?',
  errorDescarga: 'No se pudo generar el enlace del archivo',
};

const PredefinedFilesInput = ({
  name,
  value,
  onChange,
  label,
  required = false,
  disabled = false,
  error = '',
  touched = false,
  // Modo
  mode = 'create',
  // Archivos
  accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.png,.jpg,.jpeg',
  maxSize = 10 * 1024 * 1024,
  // Carga de predefinidos (hybrid)
  loadPredefined = null,   // async (formData) => { contextLabel, grupos } | null
  sourceConfig = null,     // { triggerField, contextResolver, query, contextLabel }
  triggerField: triggerFieldProp = null,  // prop directa (ej: 'ID_DOCENTE')
  // Download URL (para plantilla + ver archivo)
  getDownloadUrl = null,   // async (path) => string
  // Labels override
  labels: labelsOverride = {},
  // formData inyectado por FormField
  formData = {}
}) => {
  const L = { ...DEFAULT_LABELS, ...labelsOverride };

  const [adjuntos, setAdjuntos] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [contextLabel, setContextLabel] = useState(null);
  const [downloadingPath, setDownloadingPath] = useState(null);

  // Cache interno para sourceConfig (por contextLabel)
  const sourceCacheRef = useRef({});
  const lastTriggerValueRef = useRef(null);

  // Determinar triggerField: prop directa o desde sourceConfig
  const triggerField = triggerFieldProp || sourceConfig?.triggerField || null;
  const triggerValue = triggerField ? formData?.[triggerField] : null;

  // Parsear value inicial (modo edit o si ya hay valor)
  useEffect(() => {
    if (mode === 'edit') {
      let parsed = null;
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        parsed = value;
      } else if (typeof value === 'string' && value.trim() && value.trim() !== '{}') {
        try { parsed = JSON.parse(value); } catch { parsed = null; }
      }
      setAdjuntos(parsed);
      setContextLabel(parsed?.contextLabel || null);
      return;
    }

    // modo create: si ya hay value (re-render), respetarlo
    if (value && typeof value === 'object' && !Array.isArray(value) && value.grupos) {
      setAdjuntos(value);
      setContextLabel(value.contextLabel || null);
    }
  }, [value, mode]);

  // Notificar cambios al form
  const notify = useCallback((next) => {
    setAdjuntos(next);
    if (onChange) onChange(name, next);
  }, [name, onChange]);

  // ====== Resolver templates {CAMPO} en filters ======
  const resolveFilters = useCallback((filters, context) => {
    if (!filters) return {};
    const resolved = {};
    for (const [key, val] of Object.entries(filters)) {
      if (typeof val === 'string' && val.includes('{')) {
        resolved[key] = val.replace(/\{(\w+)\}/g, (_, fieldName) => context[fieldName] ?? '');
      } else {
        resolved[key] = val;
      }
    }
    return resolved;
  }, []);

  // ====== Cargar predefinidos vía sourceConfig ======
  const cargarViaSourceConfig = useCallback(async (trigValue) => {
    if (!sourceConfig) return;
    setLoading(true);
    setLoadError(null);
    try {
      const { contextResolver, query } = sourceConfig;

      // 1. Resolver contexto (ej: CONDICION_LABORAL desde DOCENTES)
      const ctxRecord = await db.getById(contextResolver.table, trigValue, contextResolver.idField);
      const outputField = contextResolver.outputField;
      const ctxValue = ctxRecord?.[outputField];
      if (!ctxValue) throw new Error(`No se pudo resolver ${outputField} desde ${contextResolver.table}`);

      // 2. Resolver filters con el contexto
      const context = { [outputField]: ctxValue };
      const resolvedFilters = resolveFilters(query.filters, context);

      // 3. Query (con cache por ctxValue)
      let items = sourceCacheRef.current[`${query.table}:${ctxValue}`];
      if (!items) {
        items = await db.select(query.table, resolvedFilters);
        sourceCacheRef.current[`${query.table}:${ctxValue}`] = items;
      }

      // 4. Agrupar por groupField
      const grupos = {};
      for (const item of items) {
        const groupKey = item[query.groupField];
        if (!grupos[groupKey]) grupos[groupKey] = { requisitos: [] };
        const templatePath = query.templatePathField ? item[query.templatePathField] : null;
        grupos[groupKey].requisitos.push({
          id: item[query.idField],
          nombre: item[query.nameField],
          plantilla: templatePath
            ? {
                rutaPlantilla: templatePath,
                filename: query.templateFilenameField ? (item[query.templateFilenameField] || templatePath.split('/').pop()) : templatePath.split('/').pop()
              }
            : null,
          archivo: null
        });
      }

      const ctxLabel = sourceConfig.contextLabel || ctxValue;
      notify({ contextLabel: ctxLabel, grupos });
    } catch (err) {
      console.error('[PredefinedFilesInput] Error cargando vía sourceConfig:', err);
      setLoadError(err.message || 'Error al cargar documentos');
      setAdjuntos(null);
      setContextLabel(null);
      if (onChange) onChange(name, null);
    } finally {
      setLoading(false);
    }
  }, [sourceConfig, resolveFilters, notify, onChange, name]);

  // ====== Cargar predefinidos vía loadPredefined ======
  const cargarViaLoadPredefined = useCallback(async (formDataSnap) => {
    if (!loadPredefined) return;
    setLoading(true);
    setLoadError(null);
    try {
      const result = await loadPredefined(formDataSnap);
      if (!result) {
        setAdjuntos(null);
        setContextLabel(null);
        if (onChange) onChange(name, null);
        return;
      }
      setContextLabel(result.contextLabel || null);
      notify(result);
    } catch (err) {
      console.error('[PredefinedFilesInput] Error cargando vía loadPredefined:', err);
      setLoadError(err.message || 'Error al cargar documentos');
      setAdjuntos(null);
      setContextLabel(null);
      if (onChange) onChange(name, null);
    } finally {
      setLoading(false);
    }
  }, [loadPredefined, notify, onChange, name]);

  // ====== Modo CREATE: disparar carga SOLO cuando triggerField cambia ======
  useEffect(() => {
    if (mode !== 'create') return;
    if (!triggerField) return; // sin triggerField, no hay nada que vigilar

    const currentTriggerValue = formData?.[triggerField];

    // Sin valor en triggerField: limpiar
    if (!currentTriggerValue) {
      if (lastTriggerValueRef.current !== null) {
        lastTriggerValueRef.current = null;
        setAdjuntos(null);
        setContextLabel(null);
        if (onChange) onChange(name, null);
      }
      return;
    }

    // Mismo valor: no hacer nada (evita reset al cambiar otros campos o al subir archivos)
    if (lastTriggerValueRef.current === currentTriggerValue) return;

    // Confirmar reset si ya hay archivos (un archivo por clasificación)
    const hasContent = adjuntos && adjuntos.grupos && Object.values(adjuntos.grupos).some(g => g.archivo);
    if (hasContent && lastTriggerValueRef.current !== null) {
      if (!window.confirm(L.confirmarReset)) {
        lastTriggerValueRef.current = currentTriggerValue;
        return;
      }
    }

    lastTriggerValueRef.current = currentTriggerValue;

    // Disparar carga según configuración
    if (loadPredefined) {
      cargarViaLoadPredefined(formData);  // pasa formData completo al loader
    } else if (sourceConfig) {
      cargarViaSourceConfig(currentTriggerValue);
    }
  }, [formData?.[triggerField], mode, loadPredefined, sourceConfig, triggerField]); // eslint-disable-line react-hooks/exhaustive-deps

  // ====== Helpers de actualización del estado ======
  const updateGrupos = useCallback((updater) => {
    if (!adjuntos) return;
    const nextGrupos = updater(adjuntos.grupos);
    notify({ ...adjuntos, grupos: nextGrupos });
  }, [adjuntos, notify]);

  // ====== Acciones sobre archivo por clasificación ======
  const handleArchivoClasificacion = (clasificacion, file) => {
    updateGrupos(grupos => {
      const g = { ...grupos[clasificacion] };
      g.archivo = { file, filename: file.name, contentType: file.type, size: file.size, subidoEn: new Date().toISOString() };
      return { ...grupos, [clasificacion]: g };
    });
  };

  const removeArchivoClasificacion = (clasificacion) => {
    updateGrupos(grupos => {
      const g = { ...grupos[clasificacion] };
      g.archivo = null;
      return { ...grupos, [clasificacion]: g };
    });
  };

  // ====== Descargar plantilla / ver archivo ======
  const handleDownload = async (path) => {
    if (!path) return;
    if (!getDownloadUrl) {
      console.error('[PredefinedFilesInput] getDownloadUrl no configurado');
      return;
    }
    setDownloadingPath(path);
    try {
      const url = await getDownloadUrl(path);
      window.open(url, '_blank');
    } catch (err) {
      console.error('[PredefinedFilesInput] Error descargando:', err);
      window.alert(L.errorDescarga);
    } finally {
      setDownloadingPath(null);
    }
  };

  // ====== Validación de archivo ======
  const validar = (file) => {
    const extensions = accept.split(',').map(s => s.trim());
    const result = validateFile(file, { extensions, maxFileSize: maxSize });
    if (!result.isValid) {
      window.alert(`${file.name}: ${result.errors.join(', ')}`);
      return false;
    }
    return true;
  };

  // ====== Render helpers ======
  const gruposOrden = useMemo(() => {
    if (!adjuntos?.grupos) return [];
    return Object.entries(adjuntos.grupos);
  }, [adjuntos]);

  // Contador de obligatorios pendientes (por clasificación)
  const obligatoriosPendientes = useMemo(() => {
    if (!adjuntos?.grupos) return 0;
    let count = 0;
    for (const g of Object.values(adjuntos.grupos)) {
      if (g.obligatorio && !g.archivo) count++;
    }
    return count;
  }, [adjuntos]);

  const renderArchivoSlot = ({ archivo, onPick, onRemove, onVer }) => {
    if (archivo) {
      return (
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#2D366F]/8 border border-[#2D366F]/15 rounded-md text-xs text-[#2D366F] font-medium">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <span className="truncate max-w-[180px]">{archivo.filename}</span>
            <span className="text-gray-400 font-normal">· {formatFileSize(archivo.size)}</span>
          </span>
          <div className="flex items-center gap-1.5">
            {onVer && archivo.path && (
              <button
                type="button"
                onClick={onVer}
                title={L.ver}
                className="inline-flex items-center justify-center w-8 h-8 bg-[#2D366F] hover:bg-[#2D366F]/90 rounded-md text-white transition-all hover:shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              </button>
            )}
            <button
              type="button"
              onClick={onPick}
              title={L.reemplazar}
              className="inline-flex items-center justify-center w-8 h-8 bg-[#2D366F] hover:bg-[#2D366F]/90 rounded-md text-white transition-all hover:shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            </button>
            <button
              type="button"
              onClick={onRemove}
              title={L.quitar}
              className="inline-flex items-center justify-center w-8 h-8 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md text-red-700 transition-all hover:shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.993-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" /></svg>
            </button>
          </div>
        </div>
      );
    }
    return (
      <label className="inline-flex items-center gap-2 px-4 py-2 bg-[#2D366F] hover:bg-[#2D366F]/90 rounded-lg text-xs font-medium text-white cursor-pointer transition-all hover:shadow-md shadow-sm">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
        {L.subir}
        <input type="file" accept={accept} className="hidden" onChange={(e) => {
          const f = e.target.files?.[0];
          if (f && validar(f)) onPick(f);
          e.target.value = '';
        }} />
      </label>
    );
  };

  // ====== Render principal ======
  if (loading) {
    return (
      <div className="mb-4">
        {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>}
        <div className="border border-gray-200 rounded-lg p-6 text-center">
          <div className="inline-block w-5 h-5 border-2 border-gray-200 border-t-[#2D366F] rounded-full animate-spin mb-2" />
          <p className="text-sm text-gray-500">{L.cargando}</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mb-4">
        {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>}
        <div className="border border-red-200 bg-red-50 rounded-lg p-4 text-sm text-red-700">
          Error: {loadError}
        </div>
      </div>
    );
  }

  if (mode === 'create' && sourceConfig && triggerField && !triggerValue) {
    return (
      <div className="mb-4">
        {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>}
        <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center text-sm text-gray-500">
          {L.sinTrigger}
        </div>
      </div>
    );
  }

  if (!adjuntos || !adjuntos.grupos || gruposOrden.length === 0) {
    return (
      <div className="mb-4">
        {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>}
        <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center text-sm text-gray-500">
          {mode === 'edit' ? L.sinAdjuntos : L.sinPredefinidos}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Badge contexto */}
      {contextLabel && (
        <div className="mb-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#2D366F]/10 border border-[#2D366F]/20 rounded-full text-xs font-medium text-[#2D366F]">
            {L.contextBadgePrefix}{contextLabel}
          </span>
        </div>
      )}

      {/* Grupos */}
      <div className="space-y-4">
        {gruposOrden.map(([clasificacion, grupo]) => {
          return (
            <div key={clasificacion} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Header del grupo */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                <h4 className="text-sm font-semibold text-gray-800">{clasificacion}</h4>
                {grupo.obligatorio && (
                  grupo.archivo ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#57C7C2] text-white text-[10px] rounded font-medium">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      Obligatorio
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-50 text-red-700 text-[10px] rounded font-medium border border-red-200">
                      <span className="text-red-600 font-bold">*</span>
                      Obligatorio
                    </span>
                  )
                )}
              </div>

              {/* Documentos informativos (plantillas) */}
              {(grupo.documentos || []).length > 0 && (
                <div className="px-4 py-3 bg-gray-50/30 border-b border-gray-100">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">
                    Documentos de referencia
                  </p>
                  <div className="space-y-1.5">
                    {grupo.documentos.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between gap-2 py-1">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <div className="min-w-0">
                            <span className="text-sm text-gray-700 block truncate">{doc.nombre}</span>
                            {doc.descripcion && (
                              <span className="text-xs text-gray-400 block truncate">{doc.descripcion}</span>
                            )}
                          </div>
                        </div>
                        {doc.plantilla && (
                          <button
                            type="button"
                            onClick={() => handleDownload(doc.plantilla.rutaPlantilla)}
                            disabled={downloadingPath === doc.plantilla.rutaPlantilla}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-[#2D366F]/10 text-[#2D366F] rounded-md border border-[#2D366F]/20 hover:bg-[#2D366F]/20 hover:shadow-sm disabled:opacity-50 transition-all flex-shrink-0"
                            title="Ver plantilla"
                          >
                            {downloadingPath === doc.plantilla.rutaPlantilla ? (
                              <><div className="w-3.5 h-3.5 border border-[#2D366F]/40 border-t-[#2D366F] rounded-full animate-spin" /> Generando...</>
                            ) : (
                              <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> Ver plantilla</>
                            )}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload único por clasificación */}
              <div className="px-4 py-3 border-t border-gray-100">
                {renderArchivoSlot({
                  archivo: grupo.archivo,
                  onPick: (f) => handleArchivoClasificacion(clasificacion, f),
                  onRemove: () => removeArchivoClasificacion(clasificacion),
                  onVer: grupo.archivo?.path ? () => handleDownload(grupo.archivo.path) : null
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Contador obligatorios pendientes */}
      <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
        {obligatoriosPendientes > 0 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 border border-red-200 rounded-full text-xs font-medium text-red-700">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            {obligatoriosPendientes} documento{obligatoriosPendientes !== 1 ? 's' : ''} obligatorio{obligatoriosPendientes !== 1 ? 's' : ''} pendiente{obligatoriosPendientes !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Error de validación del formulario */}
      {error && touched && (
        <div className="mt-2 flex items-center text-sm text-red-600" role="alert">
          <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          {error}
        </div>
      )}
    </div>
  );
};

export default PredefinedFilesInput;
