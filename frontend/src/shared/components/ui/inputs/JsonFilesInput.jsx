import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { db } from '@/shared/api';
import { validateFile, formatFileSize } from '../../../constants/fileConstants';

/**
 * JsonFilesInput
 *
 * Input genérico para gestionar un mega-JSON de archivos agrupados por clasificación.
 * Reutilizable en diferentes features (postulaciones, proyectos, etc.).
 *
 * Estructura emitida via onChange(name, value):
 * {
 *   contextLabel: "CONTRATADO",   // etiqueta del contexto (ej: condición laboral)
 *   grupos: {
 *     "CV": {
 *       requisitos: [{ id, nombre, plantilla: {rutaPlantilla, filename}|null, archivo: null|{path,filename,contentType,size,subidoEn,file?} }],
 *       extras:      [{ id, nombre, archivo: null|{...} }]
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
 *  - Todo editable excepto `plantilla` (inmutable).
 *  - Botón "Descargar plantilla" si plantilla.rutaPlantilla existe (via getDownloadUrl).
 */

const DEFAULT_LABELS = {
  predefinido: 'Predefinido',
  extra: 'Extra',
  plantilla: 'Plantilla',
  subir: 'Subir archivo',
  reemplazar: 'Reemplazar',
  quitar: 'Quitar',
  ver: 'Ver',
  añadirExtra: 'Añadir extra',
  añadirGrupo: 'Añadir grupo',
  eliminarGrupo: 'Eliminar grupo',
  sinTrigger: 'Seleccione un elemento para cargar los documentos.',
  contextBadgePrefix: '',
  cargando: 'Cargando documentos...',
  sinAdjuntos: 'Sin adjuntos.',
  sinPredefinidos: 'No hay documentos configurados para este contexto.',
  confirmarReset: 'Cambiar el elemento reemplazará los documentos cargados. ¿Desea continuar?',
  grupoExistente: 'Ya existe un grupo con ese nombre',
  grupoConPredefinidos: 'No se puede eliminar un grupo con predefinidos',
  errorDescarga: 'No se pudo generar el enlace del archivo',
  nombreExtra: 'Nombre del documento extra:',
  nombreGrupo: 'Nombre de la nueva clasificación:',
  confirmarEliminarGrupo: (nombre) => `¿Eliminar el grupo "${nombre}" y todos sus documentos?`,
};

const JsonFilesInput = ({
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
        if (!grupos[groupKey]) grupos[groupKey] = { requisitos: [], extras: [] };
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
      console.error('[JsonFilesInput] Error cargando vía sourceConfig:', err);
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
      console.error('[JsonFilesInput] Error cargando vía loadPredefined:', err);
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

    // Confirmar reset si ya hay archivos
    const hasContent = adjuntos && adjuntos.grupos && Object.values(adjuntos.grupos).some(g =>
      (g.requisitos || []).some(r => r.archivo) || (g.extras || []).some(e => e.archivo)
    );
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

  // ====== Acciones sobre requisitos (archivo) ======
  const handleArchivoRequisito = (clasificacion, itemId, file) => {
    updateGrupos(grupos => {
      const g = { ...grupos[clasificacion] };
      g.requisitos = g.requisitos.map(r =>
        r.id === itemId
          ? { ...r, archivo: { file, filename: file.name, contentType: file.type, size: file.size, subidoEn: new Date().toISOString() } }
          : r
      );
      return { ...grupos, [clasificacion]: g };
    });
  };

  const removeArchivoRequisito = (clasificacion, itemId) => {
    updateGrupos(grupos => {
      const g = { ...grupos[clasificacion] };
      g.requisitos = g.requisitos.map(r => r.id === itemId ? { ...r, archivo: null } : r);
      return { ...grupos, [clasificacion]: g };
    });
  };

  // ====== Acciones sobre extras ======
  const addExtra = (clasificacion) => {
    const nombre = window.prompt(L.nombreExtra);
    if (!nombre || !nombre.trim()) return;
    updateGrupos(grupos => {
      const g = { ...grupos[clasificacion] };
      g.extras = [...(g.extras || []), { id: `extra-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, nombre: nombre.trim(), archivo: null }];
      return { ...grupos, [clasificacion]: g };
    });
  };

  const handleArchivoExtra = (clasificacion, extraId, file) => {
    updateGrupos(grupos => {
      const g = { ...grupos[clasificacion] };
      g.extras = (g.extras || []).map(e =>
        e.id === extraId
          ? { ...e, archivo: { file, filename: file.name, contentType: file.type, size: file.size, subidoEn: new Date().toISOString() } }
          : e
      );
      return { ...grupos, [clasificacion]: g };
    });
  };

  const removeExtra = (clasificacion, extraId) => {
    updateGrupos(grupos => {
      const g = { ...grupos[clasificacion] };
      g.extras = (g.extras || []).filter(e => e.id !== extraId);
      return { ...grupos, [clasificacion]: g };
    });
  };

  const renameExtra = (clasificacion, extraId) => {
    const extra = adjuntos.grupos[clasificacion]?.extras?.find(e => e.id === extraId);
    if (!extra) return;
    const nuevo = window.prompt('Nuevo nombre:', extra.nombre);
    if (!nuevo || !nuevo.trim()) return;
    updateGrupos(grupos => {
      const g = { ...grupos[clasificacion] };
      g.extras = (g.extras || []).map(e => e.id === extraId ? { ...e, nombre: nuevo.trim() } : e);
      return { ...grupos, [clasificacion]: g };
    });
  };

  const removeArchivoExtra = (clasificacion, extraId) => {
    updateGrupos(grupos => {
      const g = { ...grupos[clasificacion] };
      g.extras = (g.extras || []).map(e => e.id === extraId ? { ...e, archivo: null } : e);
      return { ...grupos, [clasificacion]: g };
    });
  };

  // ====== Acciones sobre grupos ======
  const addGrupo = () => {
    const nombre = window.prompt(L.nombreGrupo);
    if (!nombre || !nombre.trim()) return;
    const key = nombre.trim();
    if (adjuntos.grupos[key]) {
      window.alert(L.grupoExistente);
      return;
    }
    updateGrupos(grupos => ({ ...grupos, [key]: { requisitos: [], extras: [] } }));
  };

  const removeGrupo = (clasificacion) => {
    const g = adjuntos.grupos[clasificacion];
    if (mode === 'create' && (g.requisitos || []).length > 0) {
      window.alert(L.grupoConPredefinidos);
      return;
    }
    if (!window.confirm(L.confirmarEliminarGrupo(clasificacion))) return;
    updateGrupos(grupos => {
      const next = { ...grupos };
      delete next[clasificacion];
      return next;
    });
  };

  // ====== Descargar plantilla / ver archivo ======
  const handleDownload = async (path) => {
    if (!path) return;
    if (!getDownloadUrl) {
      console.error('[JsonFilesInput] getDownloadUrl no configurado');
      return;
    }
    setDownloadingPath(path);
    try {
      const url = await getDownloadUrl(path);
      window.open(url, '_blank');
    } catch (err) {
      console.error('[JsonFilesInput] Error descargando:', err);
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

  const renderArchivoSlot = ({ archivo, onPick, onRemove, onVer }) => {
    if (archivo) {
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded text-xs text-green-700">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            {archivo.filename}
            <span className="text-green-500">· {formatFileSize(archivo.size)}</span>
          </span>
          {onVer && archivo.path && (
            <button type="button" onClick={onVer} className="text-blue-600 hover:text-blue-800 text-xs underline">{L.ver}</button>
          )}
          <button type="button" onClick={onPick} className="text-blue-600 hover:text-blue-800 text-xs underline">{L.reemplazar}</button>
          <button type="button" onClick={onRemove} className="text-red-600 hover:text-red-800 text-xs underline">{L.quitar}</button>
        </div>
      );
    }
    return (
      <label className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700 hover:bg-blue-100 cursor-pointer transition-colors">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
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
          <div className="inline-block w-5 h-5 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-2" />
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
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded-full text-xs font-medium text-indigo-700">
            {L.contextBadgePrefix}{contextLabel}
          </span>
        </div>
      )}

      {/* Grupos */}
      <div className="space-y-4">
        {gruposOrden.map(([clasificacion, grupo]) => {
          const esPredefinido = mode === 'create' && (grupo.requisitos || []).length > 0;
          return (
            <div key={clasificacion} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Header del grupo */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                <h4 className="text-sm font-semibold text-gray-800">{clasificacion}</h4>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => addExtra(clasificacion)}
                    disabled={disabled}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-50 text-green-700 rounded border border-green-200 hover:bg-green-100 disabled:opacity-40 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    {L.añadirExtra}
                  </button>
                  {(!esPredefinido || mode === 'edit') && (
                    <button
                      type="button"
                      onClick={() => removeGrupo(clasificacion)}
                      disabled={disabled}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-red-50 text-red-700 rounded border border-red-200 hover:bg-red-100 disabled:opacity-40 transition-colors"
                      title={L.eliminarGrupo}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.993-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" /></svg>
                      {L.eliminarGrupo}
                    </button>
                  )}
                </div>
              </div>

              {/* Requisitos predefinidos */}
              {(grupo.requisitos || []).length > 0 && (
                <div className="divide-y divide-gray-100">
                  {grupo.requisitos.map((req) => (
                    <div key={req.id} className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-gray-50/50">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-900">{req.nombre}</span>
                          <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded font-medium">{L.predefinido}</span>
                          {req.plantilla && (
                            <button
                              type="button"
                              onClick={() => handleDownload(req.plantilla.rutaPlantilla)}
                              disabled={downloadingPath === req.plantilla.rutaPlantilla}
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-amber-50 text-amber-700 rounded border border-amber-200 hover:bg-amber-100 disabled:opacity-50 transition-colors"
                              title={L.plantilla}
                            >
                              {downloadingPath === req.plantilla.rutaPlantilla ? (
                                <><div className="w-3 h-3 border border-amber-300 border-t-amber-600 rounded-full animate-spin" /> Generando...</>
                              ) : (
                                <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> {L.plantilla}</>
                              )}
                            </button>
                          )}
                        </div>
                        <div className="mt-1.5">
                          {renderArchivoSlot({
                            archivo: req.archivo,
                            onPick: (f) => handleArchivoRequisito(clasificacion, req.id, f),
                            onRemove: () => removeArchivoRequisito(clasificacion, req.id),
                            onVer: req.archivo?.path ? () => handleDownload(req.archivo.path) : null
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Extras */}
              {(grupo.extras || []).length > 0 && (
                <div className="divide-y divide-gray-100 border-t border-gray-100">
                  {grupo.extras.map((ext) => (
                    <div key={ext.id} className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-gray-50/50">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {mode === 'edit' ? (
                            <input
                              type="text"
                              value={ext.nombre}
                              onChange={(e) => {
                                const v = e.target.value;
                                updateGrupos(grupos => {
                                  const g = { ...grupos[clasificacion] };
                                  g.extras = (g.extras || []).map(x => x.id === ext.id ? { ...x, nombre: v } : x);
                                  return { ...grupos, [clasificacion]: g };
                                });
                              }}
                              className="text-sm font-medium text-gray-900 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none"
                            />
                          ) : (
                            <span className="text-sm font-medium text-gray-900">{ext.nombre}</span>
                          )}
                          <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 text-[10px] rounded font-medium">{L.extra}</span>
                        </div>
                        <div className="mt-1.5">
                          {renderArchivoSlot({
                            archivo: ext.archivo,
                            onPick: (f) => handleArchivoExtra(clasificacion, ext.id, f),
                            onRemove: () => removeArchivoExtra(clasificacion, ext.id),
                            onVer: ext.archivo?.path ? () => handleDownload(ext.archivo.path) : null
                          })}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {mode === 'edit' && (
                          <button type="button" onClick={() => renameExtra(clasificacion, ext.id)} className="text-gray-400 hover:text-blue-600" title="Renombrar">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                        )}
                        <button type="button" onClick={() => removeExtra(clasificacion, ext.id)} className="text-gray-400 hover:text-red-600" title="Eliminar extra">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.993-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty state del grupo */}
              {(grupo.requisitos || []).length === 0 && (grupo.extras || []).length === 0 && (
                <div className="px-4 py-3 text-xs text-gray-400 italic">Grupo vacío. Añade un extra.</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Añadir clasificación */}
      <div className="mt-3">
        <button
          type="button"
          onClick={addGrupo}
          disabled={disabled}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          {L.añadirGrupo}
        </button>
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

export default JsonFilesInput;
