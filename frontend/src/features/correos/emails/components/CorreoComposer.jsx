import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@/shared/context/AuthContext';
import { createDraft, updateEmail, saveMassDraft } from '../services/emailsService';
import { useComposerData } from '@/shared/hooks/correos/useComposerData';
import { useAdjuntos } from '@/shared/hooks/correos/useAdjuntos';
import { useRecipients } from '@/shared/hooks/correos/useRecipients';
import { PRIORITY_OPTIONS, DEFAULT_PRIORITY } from '@/shared/constants/correos/priorities';
import { MASIVO_VIEWS } from '@/shared/constants/correos/composer';
import { hasCuerpoContent } from '@/shared/utils/emailUtils';
import CorreoEditor from '@/shared/components/correos/editor/CorreoEditor';
import RecipientInput from '@/shared/components/correos/RecipientInput';

let nextAdjId = 1000;

const parseAdjuntos = (value) => {
  if (!value) return [];
  try {
    const arr = Array.isArray(value) ? value : JSON.parse(value);
    return arr.map((a, i) => ({
      id: nextAdjId++,
      filename: a.filename || 'archivo',
      contentType: a.contentType || '',
      path: a.path || null,
      size: a.size || null,
      url: a.url || null,
    }));
  } catch {
    return [];
  }
};

const parseRecipients = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr.map(email => ({ email, label: email, type: 'email' }));
};

const CorreoComposer = ({ onBack, onSuccess, editMode = false, editData = null }) => {
  const { user } = useAuthContext();

  const {
    cuenta, setCuenta,
    cuentas,
    loadingData, error: dataError,
    personalizado, setPersonalizado,
    remitente,
  } = useComposerData(true, editMode);

  const {
    para, setPara, cc, setCc, bcc, setBcc,
    destinatariosEmails, clearRecipients,
  } = useRecipients(remitente);

  const { adjuntos, setAdjuntos, fileInputRef, handleFiles, removeAdjunto, clearAdjuntos, isUploading } = useAdjuntos();

  const [asunto, setAsunto] = useState('');
  const [cuerpo, setCuerpo] = useState('');
  const [prioridad, setPrioridad] = useState(DEFAULT_PRIORITY);
  const [crearPorDestinatario, setCrearPorDestinatario] = useState(false);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [selectedView, setSelectedView] = useState('');

  // ── Modo edición: cargar datos del correo cuando se abre ──────────────────
  useEffect(() => {
    if (!editMode || !editData) return;
    setCuenta(editData.ID_CUENTA_SMTP ? String(editData.ID_CUENTA_SMTP) : '');
    setPersonalizado(!!editData.PERSONALIZADO);
    setCrearPorDestinatario(!!editData.PERSONALIZADO);
    setPara(parseRecipients(editData.DESTINATARIOS));
    setCc(parseRecipients(editData.CC));
    setBcc(parseRecipients(editData.BCC));
    setShowCc((editData.CC?.length || 0) > 0 || (editData.BCC?.length || 0) > 0);
    setShowBcc((editData.BCC?.length || 0) > 0);
    setAsunto(editData.ASUNTO === 'Sin Asunto' ? '' : (editData.ASUNTO || ''));
    setCuerpo(editData.CUERPO_HTML || '');
    setPrioridad(editData.PRIORIDAD || DEFAULT_PRIORITY);
    setAdjuntos(parseAdjuntos(editData.ADJUNTOS));
    setSelectedView('');
  }, [editMode, editData]);

  const esMasivo = personalizado;
  const viewConfig = MASIVO_VIEWS.find(v => v.view === selectedView);

  const handlePersonalizadoChange = (newValue) => {
    const wasPersonalizado = personalizado;
    const willBePersonalizado = newValue;

    if (wasPersonalizado && !willBePersonalizado && para.length > 0) {
      const ok = window.confirm('Al desactivar el modo personalizado, los destinatarios se conservarán pero ya no estarán anclados a un view. ¿Continuar?');
      if (!ok) return;
      setSelectedView('');
    }
    if (!wasPersonalizado && willBePersonalizado && para.length > 0) {
      const ok = window.confirm('Al activar el modo personalizado, se eliminarán los destinatarios que no pertenezcan al view. ¿Continuar?');
      if (!ok) return;
      clearRecipients();
      setCuerpo('');
      setSelectedView('');
    }
    setPersonalizado(newValue);
    setCrearPorDestinatario(newValue);
    setDirty(true);
  };

  const handleBack = () => {
    if (dirty && !window.confirm('Hay cambios sin guardar. ¿Deseas volver y descartarlos?')) return;
    onBack?.();
  };

  const handleViewChange = (newView) => {
    if (para.length > 0) {
      const ok = window.confirm('Al cambiar de view, se eliminarán los destinatarios actuales y se limpiará el contenido. ¿Continuar?');
      if (!ok) return;
      clearRecipients();
    }
    setAsunto('');
    setCuerpo('');
    setSelectedView(newView);
    setDirty(true);
  };

  const handleFileSelect = async (eOrFiles) => {
    const files = eOrFiles?.target ? eOrFiles.target.files : eOrFiles;
    if (!files?.length) return;
    try {
      await handleFiles(files);
      setDirty(true);
    } catch (err) {
      setError('Error leyendo adjuntos');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const userId = user?.id_usuario || user?.ID_USUARIO;

  const validate = () => {
    if (!userId) return 'Debe iniciar sesión para enviar o guardar correos.';
    if (personalizado && !selectedView && !editMode) return 'Seleccione un view de destinatarios.';
    if (!para.length) return 'Ingrese al menos un destinatario.';
    if (!hasCuerpoContent(cuerpo)) return 'El cuerpo del correo es obligatorio.';
    if (!cuenta) return 'Seleccione una cuenta SMTP de envío.';
    if (isUploading()) return 'Espere a que terminen de cargar los adjuntos.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const adjuntosListos = adjuntos.filter(a => !a.loading);
      const idCuenta = cuenta ? Number(cuenta) : null;
      const creadoPor = user?.DNI || user?.EMAIL || 'sistema';
      let generatedIds = [];

      if (editMode && editData) {
        // Modo edición: actualizar correo existente.
        const result = await updateEmail(editData.ID_CORREO, {
          destinatarios: destinatariosEmails(para),
          cc: destinatariosEmails(cc),
          bcc: destinatariosEmails(bcc),
          asunto: asunto.trim(),
          cuerpoHtml: cuerpo,
          adjuntos: adjuntosListos,
          prioridad,
          idCuenta,
          remitente,
        });
        generatedIds = [result?.[0]?.ID_CORREO].filter(Boolean);
      } else if (crearPorDestinatario) {
        // Generación individual; con merge fields únicamente en modo personalizado.
        const recipients = para.map(p => ({
          id: p.id,
          email: p.email,
          label: p.label,
          rowData: p.rowData || {},
        }));
        const result = await saveMassDraft({
          personalizado,
          viewName: personalizado ? viewConfig?.view : null,
          idField: personalizado ? viewConfig?.idField : null,
          recipients,
          cc: destinatariosEmails(cc),
          bcc: destinatariosEmails(bcc),
          asunto: asunto.trim(),
          cuerpoHtml: cuerpo,
          adjuntos: adjuntosListos,
          prioridad,
          idCuenta,
          creadoPor,
          idCreador: userId,
          remitente,
        });
        generatedIds = (result || []).map(r => r.idCorreo).filter(Boolean);
      } else {
        const result = await createDraft({
          destinatarios: destinatariosEmails(para),
          cc: destinatariosEmails(cc),
          bcc: destinatariosEmails(bcc),
          asunto: asunto.trim(),
          cuerpoHtml: cuerpo,
          adjuntos: adjuntosListos,
          prioridad,
          idCuenta,
          creadoPor,
          idCreador: userId,
          personalizado: false,
          remitente,
        });
        generatedIds = [result?.[0]?.ID_CORREO].filter(Boolean);
      }

      setPersonalizado(false);
      setCrearPorDestinatario(false);
      setCuenta('');
      setSelectedView('');
      clearRecipients();
      setAsunto('');
      setCuerpo('');
      clearAdjuntos();
      setPrioridad(DEFAULT_PRIORITY);
      setDirty(false);
      onSuccess?.({ ids: generatedIds });
    } catch (err) {
      setError(err.message || 'Error guardando el correo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full px-8 py-8 pb-12 bg-slate-50/40">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="rounded-2xl border border-slate-200/80 bg-slate-50/95 px-5 py-4 shadow-sm backdrop-blur">
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={handleBack}
              disabled={loading}
              className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
              aria-label="Volver a correos"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Centro de mensajes</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                {editMode ? 'Editar correo' : 'Redactar correo'}
              </h1>
              <p className="mt-1 text-sm text-slate-500">Configura el envío, selecciona destinatarios y prepara el contenido.</p>
              {loading && (
                <div className="mt-3 flex items-center gap-2 text-sm text-[#25346A]">
                  <span className="inline-block w-4 h-4 border-2 border-[#25346A] border-t-transparent rounded-full animate-spin" />
                  Generando correos, por favor espera...
                </div>
              )}
            </div>
          </div>
        </header>

        <form id="composer-form" onSubmit={handleSubmit} onChangeCapture={() => setDirty(true)} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loadingData ? (
          <div className="p-8 text-center">
            <div className="inline-block w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-3" />
            <p className="text-gray-500 text-sm">Cargando...</p>
          </div>
        ) : (
          <>
            {(error || dataError) && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg">
                {error || dataError}
              </div>
            )}

            <div className="p-6 space-y-8">
              <section className="space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Configuración de envío</h2>
                  <p className="mt-1 text-sm text-slate-500">Define cómo se generará el correo y desde qué cuenta será enviado.</p>
                </div>
                <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-5 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Modo de envío</label>
                  <div className="flex items-center gap-3 px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50">
                    <button
                      type="button"
                      onClick={() => handlePersonalizadoChange(false)}
                      aria-pressed={!personalizado}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        !personalizado
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      Normal
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePersonalizadoChange(true)}
                      aria-pressed={personalizado}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        personalizado
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      Personalizado
                    </button>
                  </div>
                  <p className="mt-1.5 text-xs text-gray-400">
                    {personalizado
                      ? 'Crea un correo separado por cada destinatario con merge fields'
                      : 'Envía un solo correo a todos los destinatarios'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Generación</label>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={crearPorDestinatario}
                    onClick={() => {
                      if (personalizado) return;
                      setCrearPorDestinatario(value => !value);
                      setDirty(true);
                    }}
                    disabled={personalizado || editMode}
                    className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-left disabled:cursor-not-allowed"
                  >
                    <span>
                      <span className="block text-sm font-medium text-slate-700">Un correo por destinatario</span>
                      <span className="block text-xs text-slate-400">{personalizado ? 'Obligatorio en modo personalizado' : 'Opcional para correo normal'}</span>
                    </span>
                    <span className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${crearPorDestinatario ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${crearPorDestinatario ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </span>
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Cuenta SMTP *</label>
                  <select
                    value={cuenta}
                    onChange={(e) => setCuenta(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                    required
                  >
                    <option value="">Seleccione una cuenta</option>
                    {cuentas.map(c => (
                      <option key={c.ID_CUENTA} value={String(c.ID_CUENTA)}>
                        {c.NOMBRE_CUENTA} ({c.SMTP_USER}){c.ES_CUENTA_DEFAULT ? ' ★' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Prioridad</label>
                  <select
                    value={prioridad}
                    onChange={(e) => setPrioridad(e.target.value)}
                    disabled={!cuenta}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white disabled:bg-gray-100 disabled:text-gray-500"
                  >
                    {PRIORITY_OPTIONS.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>

                </div>
              </section>

              <section className="space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Correo</h2>
                  <p className="mt-1 text-sm text-slate-500">Define los destinatarios y prepara el contenido del mensaje.</p>
                </div>

              {esMasivo && !editMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">View de destinatarios *</label>
                  <select
                    value={selectedView}
                    onChange={(e) => handleViewChange(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="">Seleccione un view...</option>
                    {MASIVO_VIEWS.map(v => (
                      <option key={v.view} value={v.view}>{v.label}</option>
                    ))}
                  </select>
                </div>
              )}

              <fieldset
                disabled={!cuenta || (esMasivo && !selectedView && !editMode)}
                className={`border-0 p-0 m-0 space-y-6 ${!cuenta || (esMasivo && !selectedView && !editMode) ? 'opacity-60' : ''}`}
              >
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-200">
                <div className="px-5 py-2">
                  <RecipientInput
                    value={para}
                    onChange={(value) => { setPara(value); setDirty(true); }}
                    single={false}
                    label="Para"
                    placeholder="correo@ejemplo.com"
                    viewConfig={esMasivo ? viewConfig : undefined}
                  />
                  <div className="space-y-1">
                    {!showCc && (
                      <button
                        type="button"
                        onClick={() => { setShowCc(true); setDirty(true); }}
                        className="my-2 ml-20 text-xs font-semibold text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                      >
                        Añadir CC
                      </button>
                    )}
                    {showCc && (
                      <>
                        <RecipientInput
                          value={cc}
                          onChange={(value) => { setCc(value); setDirty(true); }}
                          emailOnly
                          label="CC"
                          placeholder="correo@ejemplo.com"
                        />
                        {!showBcc && (
                          <button
                            type="button"
                            onClick={() => { setShowBcc(true); setDirty(true); }}
                            className="my-2 ml-20 block text-xs font-semibold text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                          >
                            Añadir BCC
                          </button>
                        )}
                      </>
                    )}
                    {showBcc && (
                      <RecipientInput
                        value={bcc}
                        onChange={(value) => { setBcc(value); setDirty(true); }}
                        emailOnly
                        label="BCC"
                        placeholder="correo@ejemplo.com"
                      />
                    )}
                  </div>
                  <div className="flex items-start gap-4 py-3 focus-within:border-blue-500 transition-colors">
                    <label className="w-16 pt-1.5 text-sm font-medium text-slate-700 flex-shrink-0">Asunto</label>
                    <input
                      type="text"
                      value={asunto}
                      onChange={(e) => setAsunto(e.target.value)}
                      placeholder="Agregar un asunto"
                      className="flex-1 min-w-[80px] bg-transparent outline-none text-sm py-1 placeholder:text-slate-400"
                    />
                  </div>
                </div>
                <CorreoEditor
                  value={cuerpo}
                  onChange={(html) => { setCuerpo(html); setDirty(true); }}
                  onFiles={handleFileSelect}
                  adjuntos={adjuntos}
                  onRemoveAdjunto={(id) => { removeAdjunto(id); setDirty(true); }}
                  fileInputRef={fileInputRef}
                  mergeFields={esMasivo ? viewConfig?.mergeFields || [] : []}
                  mergeMenuLabel={esMasivo ? `Campos de ${viewConfig?.label || 'view'}` : null}
                />
                </div>
              </fieldset>
              </section>
            </div>
          </>
        )}

        <footer className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 border-t border-slate-200 bg-slate-50/60 px-6 py-4">
          <button
            type="button"
            onClick={handleBack}
            disabled={loading}
            className="w-full sm:w-auto px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-100 disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="composer-form"
            disabled={loading}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#25346A] text-white rounded-xl text-sm font-medium hover:bg-[#1c2753] disabled:opacity-50 transition-colors shadow-sm"
          >
            {loading ? 'Generando...' : 'Generar correos'}
          </button>
        </footer>
        </form>
      </div>
    </div>
  );
};

export default CorreoComposer;
