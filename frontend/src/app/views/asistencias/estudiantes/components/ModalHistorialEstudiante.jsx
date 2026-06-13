import React, { useState, useCallback, useMemo } from 'react';
import { db } from '@/shared/api';
import { useSesionesEstudiante } from '../hooks/useSesionesEstudiante';
import FormConfirmModal from '@/features/form/components/FormConfirmModal';
import { Modal } from '@/features/modal';

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
  { value: null,         label: 'Sin marcar', cls: 'bg-gray-50 text-gray-400 border-gray-200' },
  { value: 'ASISTIO',    label: 'Asistió',    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'TARDANZA',   label: 'Tardanza',   cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'FALTA',      label: 'Falta',      cls: 'bg-red-50 text-red-700 border-red-200' },
  { value: 'JUSTIFICADO', label: 'Justificado', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
];

function EstadoSelect({ value, onChange }) {
  return (
    <select
      value={value ?? ''}
      onChange={e => onChange(e.target.value === '' ? null : e.target.value)}
      className="text-xs font-medium rounded-full border px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer bg-white"
    >
      {ESTADOS.map(e => (
        <option key={e.value ?? '__null__'} value={e.value ?? ''}>
          {e.label}
        </option>
      ))}
    </select>
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
                {estudiante.NOMBRE_CARRERA && (
                  <>
                    <span className="text-sm text-gray-400">{estudiante.NOMBRE_CARRERA}</span>
                    <span className="text-gray-300">·</span>
                  </>
                )}
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
              <span className="text-xs font-semibold text-gray-500">{statsLine.total} sesiones</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                {statsLine.asistio} asistió
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                {statsLine.tardanza} tardanza
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                {statsLine.falta} faltas
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                {statsLine.justificado} justificados
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                {statsLine.sinMarcar} sin marcar
              </span>
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
                  {sesiones.map((s, idx) => {
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
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-gray-700 text-sm">{s.NOMBRE_CURSO}</span>
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
