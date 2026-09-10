import React, { useEffect, useMemo, useState } from 'react';
import { db } from '@/shared/api';
import { formatDate, formatList } from '@/shared/utils';
import { sendEmailById } from '../services/emailsService';
import ViewCorreoModal from './ViewCorreoModal';

const NEEDED_FIELDS = [
  'ID_CORREO',
  'ASUNTO',
  'ESTADO',
  'PRIORIDAD',
  'DESTINATARIOS',
  'CC',
  'BCC',
  'CUERPO_HTML',
  'ADJUNTOS',
  'ID_CUENTA_SMTP',
  'CUENTA_SMTP_NOMBRE',
  'REMITENTE',
  'TIPO',
  'PERSONALIZADO',
  'CREADO_POR',
  'CREADOR_NOMBRE',
  'CREADO_EN',
];

const getFilters = (ids) => {
  if (ids && ids.length > 0) {
    return [{ field: 'ID_CORREO', op: 'in', value: ids }];
  }
  return [{ field: 'ESTADO', op: 'in', value: ['pendiente', 'fallido'] }];
};

const statusBadge = (estado) => {
  const map = {
    pendiente: 'bg-amber-100 text-amber-700',
    fallido: 'bg-red-100 text-red-700',
    enviado: 'bg-green-100 text-green-700',
    cancelado: 'bg-slate-100 text-slate-600',
  };
  return map[estado] || 'bg-slate-100 text-slate-600';
};

const statusLabel = (estado) => estado.charAt(0).toUpperCase() + estado.slice(1);

const FieldRow = ({ label, value, children }) => (
  <div className="grid grid-cols-[80px_1fr] gap-x-4 items-start text-sm">
    <span className="text-slate-400 font-medium">{label}</span>
    <div className="text-slate-800 break-words min-w-0">
      {value || children || '-'}
    </div>
  </div>
);

const PendientesView = ({ ids, onBack, onEdit, refreshTrigger }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewEmail, setViewEmail] = useState(null);

  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [prioridadFilter, setPrioridadFilter] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = getFilters(ids);
      const data = await db.select('VW_CORREOS', filters, NEEDED_FIELDS);
      setRecords(data || []);
    } catch (err) {
      setError(err.message || 'Error cargando correos pendientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [ids?.join?.(','), refreshTrigger]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((row) => {
      if (estadoFilter && row.ESTADO !== estadoFilter) return false;
      if (prioridadFilter && row.PRIORIDAD !== prioridadFilter) return false;
      if (!q) return true;
      const haystack = [
        row.ASUNTO,
        formatList(row.DESTINATARIOS),
        formatList(row.CC),
        formatList(row.BCC),
        row.CUENTA_SMTP_NOMBRE,
        row.CREADOR_NOMBRE || row.CREADO_POR,
      ].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [records, search, estadoFilter, prioridadFilter]);

  const handleSend = async (row) => {
    const ok = window.confirm(`¿Enviar el correo "${row.ASUNTO || '(sin asunto)'}" ahora?`);
    if (!ok) return;
    try {
      await sendEmailById(row.ID_CORREO);
      await load();
    } catch (err) {
      alert(`Error al enviar: ${err.message}`);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setEstadoFilter('');
    setPrioridadFilter('');
  };

  const hasFilters = search || estadoFilter || prioridadFilter;

  return (
    <div className="px-8 py-8 pb-12 space-y-6 min-h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Centro de mensajes</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            {ids && ids.length > 0 ? 'Correos generados' : 'Correos pendientes'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {ids && ids.length > 0
              ? 'Revisa, edita y envía los correos generados.'
              : 'Todos los correos con estado pendiente o fallido.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          Volver
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Filtros</h2>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-medium text-slate-500 hover:text-[#25346A]"
            >
              Limpiar
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por asunto, destinatario o creador..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#43B3C1] focus:border-[#43B3C1] outline-none"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <select
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#43B3C1] focus:border-[#43B3C1] outline-none"
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="fallido">Fallido</option>
            <option value="cancelado">Cancelado</option>
          </select>
          <select
            value={prioridadFilter}
            onChange={(e) => setPrioridadFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#43B3C1] focus:border-[#43B3C1] outline-none"
          >
            <option value="">Todas las prioridades</option>
            <option value="alta">Alta</option>
            <option value="normal">Normal</option>
            <option value="baja">Baja</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
          <div className="inline-block w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-3" />
          <p className="text-gray-500 text-sm">Cargando...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 rounded-xl border border-red-100 p-6">
          <p className="text-red-700 text-sm"><strong>Error:</strong> {error}</p>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center text-sm text-gray-500">
          {records.length === 0 ? 'No hay correos pendientes.' : 'No se encontraron correos con esos filtros.'}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5">
        {!loading && filtered.map((row) => (
          <div
            key={row.ID_CORREO}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-0 overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Header de correo */}
            <div className="bg-slate-50/60 border-b border-slate-200 px-5 py-4 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-[#25346A] break-words">{row.ASUNTO || '(sin asunto)'}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {row.CREADO_EN ? `Creado el ${formatDate(row.CREADO_EN)}` : ''}
                </p>
              </div>
              <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusBadge(row.ESTADO)}`}>
                {statusLabel(row.ESTADO)}
              </span>
            </div>

            {/* Datos del correo */}
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <FieldRow label="De:" value={row.REMITENTE} />
                <FieldRow label="Para:" value={formatList(row.DESTINATARIOS)} />
                {!!row.CC?.length && <FieldRow label="CC:" value={formatList(row.CC)} />}
                {!!row.BCC?.length && <FieldRow label="BCC:" value={formatList(row.BCC)} />}
                <FieldRow label="Cuenta:" value={row.CUENTA_SMTP_NOMBRE} />
                <FieldRow label="Prioridad:">
                  <span className="capitalize font-medium text-slate-700">{row.PRIORIDAD || '-'}</span>
                </FieldRow>
                <FieldRow label="Creado por:" value={row.CREADOR_NOMBRE || row.CREADO_POR} />
              </div>

              {/* Cuerpo */}
              <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
                <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Vista previa del cuerpo
                </div>
                <div
                  className="rich-text p-4 text-sm max-h-72 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: row.CUERPO_HTML || '' }}
                />
              </div>

              {/* Acciones */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setViewEmail(row)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Ver completo
                </button>
                <button
                  type="button"
                  onClick={() => onEdit?.(row)}
                  className="px-3.5 py-2 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100"
                >
                  Editar
                </button>
                {row.ESTADO !== 'enviado' && (
                  <button
                    type="button"
                    onClick={() => handleSend(row)}
                    className="px-3.5 py-2 text-xs font-medium text-white bg-[#25346A] rounded-lg hover:bg-[#1c2753]"
                  >
                    Enviar
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <ViewCorreoModal email={viewEmail} onClose={() => setViewEmail(null)} />
    </div>
  );
};

export default PendientesView;
