import React, { useEffect, useState } from 'react';
import { db } from '@/shared/api';
import Modal from '@/shared/components/modal/views/Modal';
import { useAdjuntos } from '@/shared/hooks/correos/useAdjuntos';
import { hasCuerpoContent } from '@/shared/utils/emailUtils';
import RecipientInput from '@/shared/components/correos/RecipientInput';
import CorreoEditor from '@/shared/components/correos/editor/CorreoEditor';
import { updateEmail } from '../services/emailsService';

const PRIORITY_OPTIONS = [
  { value: 'alta', label: 'Alta' },
  { value: 'normal', label: 'Normal' },
  { value: 'baja', label: 'Baja' },
];

const parseEmailList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
    return [parsed].filter(Boolean);
  } catch {
    return [];
  }
};

const getAdjuntos = (value) => {
  if (!value) return [];
  try {
    return Array.isArray(value) ? value : JSON.parse(value);
  } catch {
    return [];
  }
};

const normalizeAdjuntos = (value) =>
  getAdjuntos(value).map((a, i) => ({ ...a, id: a.id ?? `att-${Date.now()}-${i}` }));

const toRecipients = (emails) =>
  parseEmailList(emails).map((email, idx) =>
    typeof email === 'string'
      ? { id: `${email}-${idx}`, email, label: email, type: 'email' }
      : email
  );

const toEmails = (recipients) =>
  (recipients || []).map((r) => r.email).filter(Boolean);

const decodeHtmlEntities = (html) => {
  if (typeof html !== 'string') return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return doc.body.innerHTML;
};

const EditPendienteModal = ({ email, isOpen, onClose, onSuccess }) => {
  const [cuentas, setCuentas] = useState([]);
  const [loadingCuentas, setLoadingCuentas] = useState(false);
  const [cuenta, setCuenta] = useState('');
  const [prioridad, setPrioridad] = useState('normal');
  const [para, setPara] = useState([]);
  const [cc, setCc] = useState([]);
  const [bcc, setBcc] = useState([]);
  const [asunto, setAsunto] = useState('');
  const [cuerpo, setCuerpo] = useState(() => decodeHtmlEntities(email?.CUERPO_HTML) || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const { adjuntos, setAdjuntos, fileInputRef, handleFiles, removeAdjunto } = useAdjuntos();

  // Cargar cuentas SMTP igual que el composer
  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    setLoadingCuentas(true);
    (async () => {
      try {
        const res = await db.select('CUENTAS_SMTP', { ACTIVO: true });
        if (mounted) setCuentas(res || []);
      } catch (err) {
        if (mounted) setError(err.message || 'Error cargando cuentas SMTP');
      } finally {
        if (mounted) setLoadingCuentas(false);
      }
    })();
    return () => { mounted = false; };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && email) {
      const decoded = decodeHtmlEntities(email.CUERPO_HTML);
      setCuenta(String(email.ID_CUENTA_SMTP ?? ''));
      setPrioridad(email.PRIORIDAD || 'normal');
      setPara(toRecipients(email.DESTINATARIOS));
      setCc(toRecipients(email.CC));
      setBcc(toRecipients(email.BCC));
      setAsunto(email.ASUNTO || '');
      setCuerpo(decoded || '');
      setAdjuntos(normalizeAdjuntos(email.ADJUNTOS));
      setError(null);
    }
  }, [isOpen, email, setAdjuntos]);

  const handleSave = async () => {
    if (!email?.ID_CORREO) return;
    if (!hasCuerpoContent(cuerpo)) {
      setError('El cuerpo del correo es obligatorio.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateEmail(email.ID_CORREO, {
        destinatarios: toEmails(para),
        cc: toEmails(cc),
        bcc: toEmails(bcc),
        asunto: asunto.trim(),
        cuerpoHtml: cuerpo,
        adjuntos: adjuntos.map(({ id, ...rest }) => rest),
        prioridad,
        idCuenta: cuenta ? Number(cuenta) : null,
        remitente: email.REMITENTE || null,
      });
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(err.message || 'Error guardando el correo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar correo pendiente"
      size="2xl"
      bodyClassName="space-y-4 overflow-y-auto max-h-[80vh]"
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-[#25346A] rounded-lg hover:bg-[#1c2753] disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      }
    >
      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Cuenta SMTP</label>
            <select
              value={cuenta}
              onChange={(e) => setCuenta(e.target.value)}
              disabled={loadingCuentas}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
            >
              <option value="">Seleccione una cuenta</option>
              {cuentas.map((c) => (
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
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
            >
              {PRIORITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-200">
        <div className="px-5 py-2 space-y-1">
          <RecipientInput
            value={para}
            onChange={setPara}
            emailOnly
            single={false}
            label="Para"
            placeholder="correo@ejemplo.com"
          />
          <RecipientInput
            value={cc}
            onChange={setCc}
            emailOnly
            single={false}
            label="CC"
            placeholder="correo@ejemplo.com"
          />
          <RecipientInput
            value={bcc}
            onChange={setBcc}
            emailOnly
            single={false}
            label="BCC"
            placeholder="correo@ejemplo.com"
          />
        </div>

        <div className="flex items-start gap-4 py-3 px-5 focus-within:border-blue-500 transition-colors">
          <label className="w-16 pt-1.5 text-sm font-medium text-slate-700 flex-shrink-0">Asunto</label>
          <input
            type="text"
            value={asunto}
            onChange={(e) => setAsunto(e.target.value)}
            placeholder="Agregar un asunto"
            className="flex-1 min-w-[80px] bg-transparent outline-none text-sm py-1 placeholder:text-slate-400"
          />
        </div>

        <CorreoEditor
          value={cuerpo}
          onChange={setCuerpo}
          onFiles={handleFiles}
          adjuntos={adjuntos}
          onRemoveAdjunto={removeAdjunto}
          fileInputRef={fileInputRef}
          mergeFields={[]}
          mergeMenuLabel={null}
          placeholder="Escribe el contenido del correo…"
        />
      </div>
    </Modal>
  );
};

export default EditPendienteModal;
