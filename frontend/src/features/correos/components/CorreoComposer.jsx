import React, { useState } from 'react';
import Modal from '@/shared/components/modal/views/Modal';
import { useAuthContext } from '@/shared/context/AuthContext';
import { createDraft, sendAndSave, saveMassDraft } from '@/features/correos/services/correosService';
import { useComposerData } from '@/features/correos/hooks/useComposerData';
import { useAdjuntos } from '@/features/correos/hooks/useAdjuntos';
import { useRecipients } from '@/features/correos/hooks/useRecipients';
import { PRIORITY_OPTIONS, DEFAULT_PRIORITY } from '@/features/correos/constants/priorities';
import { MASIVO_VIEWS } from '@/features/correos/constants/composer';
import HtmlEditor from './HtmlEditor/HtmlEditor';
import RecipientInput from './RecipientInput';

const CorreoComposer = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuthContext();

  const {
    tipo, setTipo,
    cuenta, setCuenta,
    tipos, cuentas,
    loadingData, error: dataError,
    esMultiUsuario,
    remitente,
  } = useComposerData(isOpen);

  const {
    para, setPara, cc, setCc, bcc, setBcc,
    destinatariosEmails, userIds, clearRecipients,
  } = useRecipients(remitente);

  const { adjuntos, fileInputRef, handleFiles, removeAdjunto, clearAdjuntos, isUploading } = useAdjuntos();

  const [asunto, setAsunto] = useState('');
  const [cuerpo, setCuerpo] = useState('');
  const [prioridad, setPrioridad] = useState(DEFAULT_PRIORITY);
  const [fechaProgramada, setFechaProgramada] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedView, setSelectedView] = useState('');

  const esMasivo = tipo === 'personalizado_masivo';
  const viewConfig = MASIVO_VIEWS.find(v => v.view === selectedView);
  const mergeFields = viewConfig?.mergeFields || [];

  const handleTipoChange = (newTipo) => {
    const wasMasivo = tipo === 'personalizado_masivo';
    const willBeMasivo = newTipo === 'personalizado_masivo';

    if (wasMasivo && !willBeMasivo && para.length > 0) {
      const ok = window.confirm('Al cambiar a notificación, los destinatarios del view se conservarán pero ya no estarán anclados. ¿Continuar?');
      if (!ok) return;
      setSelectedView('');
    }
    if (!wasMasivo && willBeMasivo && para.length > 0) {
      const ok = window.confirm('Al cambiar a personalizado masivo, se eliminarán los destinatarios que no pertenezcan al view. ¿Continuar?');
      if (!ok) return;
      clearRecipients();
      setCuerpo('');
      setSelectedView('');
    }
    if (wasMasivo && willBeMasivo) {
      // Cambio de view potencial: limpiar destinatarios y cuerpo.
      clearRecipients();
      setCuerpo('');
      setSelectedView('');
    }
    setTipo(newTipo);
  };

  const handleViewChange = (newView) => {
    if (para.length > 0) {
      const ok = window.confirm('Al cambiar de view, se eliminarán los destinatarios actuales. ¿Continuar?');
      if (!ok) return;
      clearRecipients();
    }
    setSelectedView(newView);
  };

  const handleFileSelect = async (eOrFiles) => {
    const files = eOrFiles?.target ? eOrFiles.target.files : eOrFiles;
    if (!files?.length) return;
    try {
      await handleFiles(files);
    } catch (err) {
      setError('Error leyendo adjuntos');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const validate = () => {
    if (!tipo) return 'Seleccione un tipo de correo.';
    if (!para.length) return 'Ingrese al menos un destinatario.';
    if (!asunto.trim()) return 'El asunto es obligatorio.';
    if (!cuerpo.trim()) return 'El cuerpo del correo es obligatorio.';
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

      if (esMasivo) {
        // Modo masivo: un correo por destinatario con merge fields.
        const recipients = para.map(p => ({
          id: p.id,
          email: p.email,
          label: p.label,
          rowData: p.rowData || {},
        }));
        await saveMassDraft({
          tipo,
          viewName: viewConfig?.view,
          idField: viewConfig?.idField,
          recipients,
          cc: destinatariosEmails(cc),
          bcc: destinatariosEmails(bcc),
          asunto: asunto.trim(),
          cuerpoHtml: cuerpo,
          adjuntos: adjuntosListos,
          prioridad,
          fechaProgramada: fechaProgramada ? new Date(fechaProgramada).toISOString() : null,
          idCuenta,
          creadoPor,
          remitente,
        });
      } else {
        await createDraft({
          tipo,
          idUsuarios: userIds(para),
          destinatarios: destinatariosEmails(para),
          cc: destinatariosEmails(cc),
          bcc: destinatariosEmails(bcc),
          asunto: asunto.trim(),
          cuerpoHtml: cuerpo,
          adjuntos: adjuntosListos,
          prioridad,
          fechaProgramada: fechaProgramada ? new Date(fechaProgramada).toISOString() : null,
          idCuenta,
          creadoPor,
          remitente,
        });
      }

      setTipo('');
      setCuenta('');
      setSelectedView('');
      clearRecipients();
      setAsunto('');
      setCuerpo('');
      clearAdjuntos();
      setPrioridad(DEFAULT_PRIORITY);
      setFechaProgramada('');
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Error guardando el correo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendNow = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const adjuntosListos = adjuntos.filter(a => !a.loading);
      await sendAndSave({
        tipo,
        idUsuarios: userIds(para),
        destinatarios: destinatariosEmails(para),
        cc: destinatariosEmails(cc),
        bcc: destinatariosEmails(bcc),
        asunto: asunto.trim(),
        cuerpoHtml: cuerpo,
        adjuntos: adjuntosListos,
        prioridad,
        fechaProgramada: fechaProgramada ? new Date(fechaProgramada).toISOString() : null,
        idCuenta: cuenta ? Number(cuenta) : null,
        creadoPor: user?.DNI || user?.EMAIL || 'sistema',
        remitente,
      });

      setTipo('');
      setCuenta('');
      clearRecipients();
      setAsunto('');
      setCuerpo('');
      clearAdjuntos();
      setPrioridad(DEFAULT_PRIORITY);
      setFechaProgramada('');
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Error enviando el correo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Redactar Correo"
      size="xl"
      customSize="w-[95vw] max-w-7xl"
      shadow="2xl"
      border="2xl"
      closeOnOutsideClick={false}
      bodyClassName="p-0 bg-white"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="composer-form"
            disabled={loading}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Guardando...' : 'Guardar borrador'}
          </button>
          {tipo === 'notificacion' && (
            <button
              type="button"
              onClick={handleSendNow}
              disabled={loading}
              className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Enviando...' : 'Guardar y enviar ahora'}
            </button>
          )}
        </div>
      }
    >
      <form id="composer-form" onSubmit={handleSubmit} className="h-full">
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

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de correo *</label>
                  <select
                    value={tipo}
                    onChange={(e) => handleTipoChange(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                    required
                  >
                    <option value="">Seleccione...</option>
                    {tipos.map(t => (
                      <option key={t.NOMBRE_TIPO} value={t.NOMBRE_TIPO}>
                        {t.NOMBRE_TIPO} {t.DESCRIPCION ? `- ${t.DESCRIPCION}` : ''}
                      </option>
                    ))}
                  </select>
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
                        {c.NOMBRE_CUENTA} ({c.SMTP_USER})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Prioridad</label>
                  <select
                    value={prioridad}
                    onChange={(e) => setPrioridad(e.target.value)}
                    disabled={!tipo || !cuenta}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white disabled:bg-gray-100 disabled:text-gray-500"
                  >
                    {PRIORITY_OPTIONS.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Programado</label>
                  <input
                    type="datetime-local"
                    value={fechaProgramada}
                    onChange={(e) => setFechaProgramada(e.target.value)}
                    disabled={!tipo || !cuenta}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>
              </div>

              {esMasivo && (
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
                disabled={!tipo || !cuenta || (esMasivo && !selectedView)}
                className={`border-0 p-0 m-0 space-y-6 ${!tipo || !cuenta || (esMasivo && !selectedView) ? 'opacity-60' : ''}`}
              >
                <div className="space-y-0">
                  <RecipientInput
                    value={para}
                    onChange={setPara}
                    single={!esMultiUsuario && !esMasivo}
                    label="Para"
                    placeholder="correo@ejemplo.com"
                    viewConfig={esMasivo ? viewConfig : undefined}
                  />
                  <RecipientInput
                    value={cc}
                    onChange={setCc}
                    emailOnly
                    label="CC"
                    placeholder="correo@ejemplo.com"
                  />
                  <RecipientInput
                    value={bcc}
                    onChange={setBcc}
                    emailOnly
                    label="BCC"
                    placeholder="correo@ejemplo.com"
                  />
                  <div className="flex items-start gap-4 py-2 border-b border-gray-300 focus-within:border-blue-500 transition-colors">
                    <label className="w-16 pt-1.5 text-sm font-medium text-gray-700 flex-shrink-0">Asunto</label>
                    <input
                      type="text"
                      value={asunto}
                      onChange={(e) => setAsunto(e.target.value)}
                      placeholder="Agregar un asunto"
                      required
                      className="flex-1 min-w-[80px] bg-transparent outline-none text-sm py-1 placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <HtmlEditor
                  value={cuerpo}
                  onChange={setCuerpo}
                  disabled={!tipo || !cuenta || (esMasivo && !selectedView)}
                  label="Cuerpo"
                  required
                  placeholder="Escriba el contenido del correo..."
                  adjuntos={adjuntos}
                  onFilesSelected={handleFileSelect}
                  removeAdjunto={removeAdjunto}
                  fileInputRef={fileInputRef}
                  mergeFields={mergeFields}
                />
              </fieldset>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
};

export default CorreoComposer;
