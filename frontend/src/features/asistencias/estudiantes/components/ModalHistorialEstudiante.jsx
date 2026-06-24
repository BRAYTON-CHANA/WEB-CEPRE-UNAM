import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { db } from '@/shared/api';
import { useSesionesEstudiante } from '../hooks/useSesionesEstudiante';
import FormConfirmModal from '@/shared/components/form/components/FormConfirmModal';
import { Modal } from '@/shared/components/modal';

function formatFecha(fechaStr) {
  if (!fechaStr) return '—';
  const [year, month, day] = fechaStr.split('-');
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${day} ${meses[parseInt(month, 10) - 1]} ${year}`;
}

function formatHora(horaStr) {
  if (!horaStr) return '—';
  const [h, m] = horaStr.split(':');
  return `${h}:${m}`;
}

const ESTADOS = [
  { value: null,         label: '—', fullLabel: 'Sin marcar',  cls: 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200' },
  { value: 'ASISTIO',    label: 'A', fullLabel: 'Asistió',     cls: 'bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200' },
  { value: 'TARDANZA',   label: 'T', fullLabel: 'Tardanza',    cls: 'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200' },
  { value: 'FALTA',      label: 'F', fullLabel: 'Falta',       cls: 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200' },
  { value: 'JUSTIFICADO', label: 'J', fullLabel: 'Justificado', cls: 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200' },
];

function StatFilterButton({ count, label, active, baseCls, activeCls, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
        active ? activeCls : baseCls
      } ${active ? 'shadow-sm' : 'hover:shadow-sm'}`}
    >
      {count} {label}
    </button>
  );
}

function EstadoSelect({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);
  const estadoActual = ESTADOS.find(e => e.value === value) || ESTADOS[0];

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  return (
    <div className="relative inline-block" ref={buttonRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-10 h-8 rounded-lg text-sm font-bold border flex items-center justify-center gap-0.5 transition-all hover:scale-105 active:scale-95 shadow-sm ${estadoActual.cls}`}
        title={estadoActual.fullLabel}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span>{estadoActual.label}</span>
        <svg
          className={`w-3 h-3 opacity-60 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute z-50 mt-1 bg-white rounded-xl shadow-2xl border border-gray-200 py-1.5 min-w-[150px] animate-in fade-in slide-in-from-top-1 duration-150 origin-top"
          role="listbox"
        >
          {ESTADOS.map((e) => (
            <button
              key={e.value ?? '__null__'}
              type="button"
              onClick={() => {
                onChange(e.value);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                value === e.value ? 'bg-gray-50 font-semibold' : ''
              }`}
              role="option"
              aria-selected={value === e.value}
            >
              <span className={`w-7 h-7 rounded-md text-xs font-bold border flex items-center justify-center shadow-sm ${e.cls}`}>
                {e.label}
              </span>
              <span className="text-gray-700 whitespace-nowrap">{e.fullLabel}</span>
              {value === e.value && (
                <svg className="w-4 h-4 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ModalHistorialEstudiante({ estudiante, idGrupo, nombreGrupo, onClose, onSuccess }) {
  const { sesiones, loading, error, refetch } = useSesionesEstudiante(
    estudiante?.ID_POSTULANTE,
    idGrupo
  );

  const [pending, setPending] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({ isOpen: false, type: '', title: '', message: '' });
  const [filtroEstado, setFiltroEstado] = useState(null); // null = todos

  const pendingCount = Object.keys(pending).length;

  const handleEstadoChange = useCallback((idAsistencia, nuevoEstado) => {
    setPending(prev => ({ ...prev, [idAsistencia]: nuevoEstado }));
  }, []);

  const getEstado = useCallback((row) => {
    return pending.hasOwnProperty(row.ID_ASISTENCIA)
      ? pending[row.ID_ASISTENCIA]
      : row.ESTADO_ASISTENCIA;
  }, [pending]);

  const statsLine = useMemo(() => {
    const all = sesiones.map(s => ({
      _estado: pending.hasOwnProperty(s.ID_ASISTENCIA) ? pending[s.ID_ASISTENCIA] : s.ESTADO_ASISTENCIA
    }));
    return {
      total: all.length,
      asistio: all.filter(s => s._estado === 'ASISTIO').length,
      tardanza: all.filter(s => s._estado === 'TARDANZA').length,
      falta: all.filter(s => s._estado === 'FALTA').length,
      justificado: all.filter(s => s._estado === 'JUSTIFICADO').length,
      sinMarcar: all.filter(s => !s._estado).length,
    };
  }, [sesiones, pending]);

  const sesionesFiltradas = useMemo(() => {
    if (filtroEstado === null) return sesiones;
    if (filtroEstado === 'SIN_MARCAR') {
      return sesiones.filter(s => !getEstado(s));
    }
    return sesiones.filter(s => getEstado(s) === filtroEstado);
  }, [sesiones, filtroEstado, getEstado]);

  const handleMarcarVaciosAsistio = useCallback(() => {
    const nuevos = {};
    sesiones.forEach(s => {
      const estadoActual = pending.hasOwnProperty(s.ID_ASISTENCIA)
        ? pending[s.ID_ASISTENCIA]
        : s.ESTADO_ASISTENCIA;
      if (!estadoActual) {
        nuevos[s.ID_ASISTENCIA] = 'ASISTIO';
      }
    });
    if (Object.keys(nuevos).length > 0) {
      setPending(prev => ({ ...prev, ...nuevos }));
    }
  }, [sesiones, pending]);

  const handleGuardar = () => {
    if (pendingCount === 0) return;
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    setConfirmOpen(false);
    setSaving(true);
    try {
      const updates = Object.entries(pending).map(([idAsistencia, estado]) => ({
        id: Number(idAsistencia),
        data: { ESTADO_ASISTENCIA: estado },
      }));
      await db.updateBatch('ASISTENCIAS_POSTULANTE', updates, 'ID_ASISTENCIA');
      setPending({});
      refetch();
      if (onSuccess) onSuccess();
      setNotification({
        isOpen: true,
        type: 'success',
        title: 'Asistencias guardadas',
        message: `Se actualizaron ${updates.length} registro${updates.length !== 1 ? 's' : ''} correctamente.`,
      });
    } catch (err) {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Error al guardar',
        message: err.message || 'Ocurrió un error al guardar las asistencias.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!estudiante) return null;

  const nombreCompleto = `${estudiante.APELLIDOS}, ${estudiante.NOMBRES}`;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 flex flex-col overflow-hidden"
          style={{ maxHeight: '90vh' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 shrink-0">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{nombreCompleto}</h2>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-sm text-gray-400 font-medium">{nombreGrupo}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="ml-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Stats bar */}
          {!loading && sesiones.length > 0 && (
            <div className="px-6 py-2.5 border-b border-gray-100 flex items-center gap-3 flex-wrap shrink-0 bg-gray-50">
              <button
                type="button"
                onClick={() => setFiltroEstado(null)}
                className={`text-xs font-semibold transition-all ${
                  filtroEstado === null
                    ? 'text-gray-700 underline decoration-2 underline-offset-4'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {statsLine.total} sesiones
              </button>
              <StatFilterButton
                count={statsLine.asistio}
                label="asistió"
                active={filtroEstado === 'ASISTIO'}
                baseCls="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                activeCls="ring-2 ring-emerald-400 bg-emerald-100"
                onClick={() => setFiltroEstado(prev => prev === 'ASISTIO' ? null : 'ASISTIO')}
              />
              <StatFilterButton
                count={statsLine.tardanza}
                label="tardanza"
                active={filtroEstado === 'TARDANZA'}
                baseCls="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                activeCls="ring-2 ring-amber-400 bg-amber-100"
                onClick={() => setFiltroEstado(prev => prev === 'TARDANZA' ? null : 'TARDANZA')}
              />
              <StatFilterButton
                count={statsLine.falta}
                label="faltas"
                active={filtroEstado === 'FALTA'}
                baseCls="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                activeCls="ring-2 ring-red-400 bg-red-100"
                onClick={() => setFiltroEstado(prev => prev === 'FALTA' ? null : 'FALTA')}
              />
              <StatFilterButton
                count={statsLine.justificado}
                label="justificados"
                active={filtroEstado === 'JUSTIFICADO'}
                baseCls="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                activeCls="ring-2 ring-blue-400 bg-blue-100"
                onClick={() => setFiltroEstado(prev => prev === 'JUSTIFICADO' ? null : 'JUSTIFICADO')}
              />
              <StatFilterButton
                count={statsLine.sinMarcar}
                label="sin marcar"
                active={filtroEstado === 'SIN_MARCAR'}
                baseCls="bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
                activeCls="ring-2 ring-gray-400 bg-gray-200"
                onClick={() => setFiltroEstado(prev => prev === 'SIN_MARCAR' ? null : 'SIN_MARCAR')}
              />
              {statsLine.total > 0 && (
                <>
                  <span className="text-gray-200">|</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                    (statsLine.asistio + statsLine.tardanza + statsLine.justificado) / statsLine.total >= 0.8
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : (statsLine.asistio + statsLine.tardanza + statsLine.justificado) / statsLine.total >= 0.6
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {Math.round(((statsLine.asistio + statsLine.tardanza + statsLine.justificado) / statsLine.total) * 100)}% asistencia
                  </span>
                </>
              )}
            </div>
          )}

          {/* Body */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
                <span className="ml-3 text-gray-500 text-sm">Cargando sesiones...</span>
              </div>
            ) : error ? (
              <div className="p-6 text-red-600 text-sm bg-red-50 m-4 rounded-xl border border-red-200">{error}</div>
            ) : sesiones.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-gray-400 text-sm font-medium">No hay sesiones registradas para este estudiante</p>
              </div>
            ) : sesionesFiltradas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-gray-400 text-sm font-medium">No hay sesiones con el filtro seleccionado</p>
                <button
                  type="button"
                  onClick={() => setFiltroEstado(null)}
                  className="mt-3 text-sm font-medium text-emerald-600 hover:text-emerald-700"
                >
                  Mostrar todas
                </button>
              </div>
            ) : (
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 z-10 bg-white">
                  <tr className="border-b-2 border-gray-100">
                    {['#', 'Fecha', 'Horario', 'Curso', 'Estado'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sesionesFiltradas.map((s, idx) => {
                    const estadoActual = getEstado(s);
                    const changed = pending.hasOwnProperty(s.ID_ASISTENCIA);
                    return (
                      <tr
                        key={s.ID_ASISTENCIA}
                        className={`border-b border-gray-50 transition-colors ${changed ? 'bg-emerald-50/40' : 'hover:bg-slate-50'}`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-xs font-mono text-gray-300 select-none">{String(idx + 1).padStart(2, '0')}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-medium text-gray-800 text-sm">{formatFecha(s.FECHA)}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-mono text-gray-500 text-sm">
                            {formatHora(s.HORA_INICIO)} – {formatHora(s.HORA_FIN)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap max-w-[180px]">
                          <span className="text-gray-700 text-sm block truncate">{s.NOMBRE_CURSO}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <EstadoSelect
                              value={estadoActual}
                              onChange={nuevoEstado => handleEstadoChange(s.ID_ASISTENCIA, nuevoEstado)}
                            />
                            {changed && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-flex" title="Modificado" />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 border-t border-gray-100 bg-white flex items-center justify-between gap-4 shrink-0">
            <div className="text-sm text-gray-500">
              {pendingCount > 0 ? (
                <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  {pendingCount} cambio{pendingCount !== 1 ? 's' : ''} pendiente{pendingCount !== 1 ? 's' : ''}
                </span>
              ) : (
                <span className="text-gray-400">Sin cambios pendientes</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {!loading && sesiones.length > 0 && statsLine.sinMarcar > 0 && (
                <button
                  onClick={handleMarcarVaciosAsistio}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Marcar vacíos como Asistió ({statsLine.sinMarcar})
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={handleGuardar}
                disabled={pendingCount === 0 || saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                  </svg>
                )}
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm modal */}
      <FormConfirmModal
        isOpen={confirmOpen}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
        config={{
          title: 'Confirmar cambios',
          message: `¿Guardar ${pendingCount} cambio${pendingCount !== 1 ? 's' : ''} de asistencia para ${estudiante.NOMBRES} ${estudiante.APELLIDOS}?`,
          confirmText: 'Sí, guardar',
          cancelText: 'Cancelar',
        }}
      />

      {/* Result notification */}
      <Modal
        isOpen={notification.isOpen}
        onClose={() => setNotification(n => ({ ...n, isOpen: false }))}
        title={notification.title}
        closeOnOutsideClick
        closeOnEscapeKey
      >
        <div className="text-center py-4 px-6">
          {notification.type === 'success' ? (
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
          <p className={`text-sm ${notification.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
            {notification.message}
          </p>
          <button
            onClick={() => setNotification(n => ({ ...n, isOpen: false }))}
            className={`mt-4 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              notification.type === 'success' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            Aceptar
          </button>
        </div>
      </Modal>
    </>
  );
}
