import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { db } from '@/shared/api';
import { useAsistenciasPorDia } from '../hooks/useAsistenciasPorDia';
import FormConfirmModal from '@/features/form/components/FormConfirmModal';
import { Modal } from '@/features/modal';

const ESTADOS = [
  { value: null,         label: '—',  fullLabel: 'Sin marcar',  cls: 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200' },
  { value: 'ASISTIO',    label: 'A',  fullLabel: 'Asistió',     cls: 'bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200' },
  { value: 'TARDANZA',   label: 'T',  fullLabel: 'Tardanza',    cls: 'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200' },
  { value: 'FALTA',      label: 'F',  fullLabel: 'Falta',       cls: 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200' },
  { value: 'JUSTIFICADO', label: 'J',  fullLabel: 'Justificado', cls: 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200' },
];

function formatHora(horaStr) {
  if (!horaStr) return '—';
  const [h, m] = horaStr.split(':');
  return `${h}:${m}`;
}

function abreviarCurso(nombre) {
  if (!nombre) return '—';
  if (nombre.length <= 12) return nombre;
  return nombre.substring(0, 10) + '…';
}

function EstadoSelectCompacto({ value, onChange }) {
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

export function ModalAsistenciaCompacta({ fecha, grupo, onClose, onSuccess }) {
  const { 
    estudiantes, 
    sesiones, 
    asistencias,
    loading, 
    error, 
    refetch,
    getAsistencia,
    updateAsistencia,
  } = useAsistenciasPorDia(fecha, grupo?.idGrupo);

  const [pending, setPending] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({ isOpen: false, type: '', title: '', message: '' });

  const pendingCount = Object.keys(pending).length;

  const handleEstadoChange = useCallback((idPostulante, idSesion, nuevoEstado, idAsistencia) => {
    const key = `${idPostulante}_${idSesion}`;
    setPending(prev => ({ ...prev, [key]: { idPostulante, idSesion, estado: nuevoEstado, idAsistencia } }));
    updateAsistencia(idPostulante, idSesion, nuevoEstado, idAsistencia);
  }, [updateAsistencia]);

  const getEstado = useCallback((idPostulante, idSesion) => {
    const key = `${idPostulante}_${idSesion}`;
    if (pending.hasOwnProperty(key)) {
      return pending[key].estado;
    }
    const asistencia = getAsistencia(idPostulante, idSesion);
    return asistencia?.ESTADO_ASISTENCIA || null;
  }, [pending, getAsistencia]);

  const getIdAsistencia = useCallback((idPostulante, idSesion) => {
    const asistencia = getAsistencia(idPostulante, idSesion);
    return asistencia?.ID_ASISTENCIA || null;
  }, [getAsistencia]);

  // Marcar todos los vacíos como ASISTIO
  const handleMarcarVaciosAsistio = useCallback(() => {
    const nuevos = {};
    estudiantes.forEach(est => {
      sesiones.forEach(ses => {
        const estadoActual = getEstado(est.ID_POSTULANTE, ses.ID_SESION);
        if (!estadoActual) {
          const key = `${est.ID_POSTULANTE}_${ses.ID_SESION}`;
          const idAsistencia = getIdAsistencia(est.ID_POSTULANTE, ses.ID_SESION);
          nuevos[key] = { idPostulante: est.ID_POSTULANTE, idSesion: ses.ID_SESION, estado: 'ASISTIO', idAsistencia };
        }
      });
    });
    if (Object.keys(nuevos).length > 0) {
      setPending(prev => ({ ...prev, ...nuevos }));
      Object.entries(nuevos).forEach(([key, val]) => {
        updateAsistencia(val.idPostulante, val.idSesion, val.estado, val.idAsistencia);
      });
    }
  }, [estudiantes, sesiones, getEstado, getIdAsistencia, updateAsistencia]);

  const handleGuardar = () => {
    if (pendingCount === 0) return;
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    setConfirmOpen(false);
    setSaving(true);
    try {
      const updates = [];
      const creates = [];

      Object.values(pending).forEach(({ idPostulante, idSesion, estado, idAsistencia }) => {
        if (idAsistencia) {
          // Actualizar existente
          updates.push({
            id: idAsistencia,
            data: { ESTADO_ASISTENCIA: estado },
          });
        } else {
          // Crear nueva asistencia
          creates.push({
            ID_POSTULANTE: idPostulante,
            ID_SESION: idSesion,
            ESTADO_ASISTENCIA: estado,
          });
        }
      });

      // Ejecutar updates
      if (updates.length > 0) {
        await db.updateBatch('ASISTENCIAS_POSTULANTE', updates, 'ID_ASISTENCIA');
      }

      // Ejecutar inserts
      if (creates.length > 0) {
        for (const create of creates) {
          await db.insert('ASISTENCIAS_POSTULANTE', create);
        }
      }

      setPending({});
      refetch();
      if (onSuccess) onSuccess();
      setNotification({
        isOpen: true,
        type: 'success',
        title: 'Asistencias guardadas',
        message: `Se actualizaron ${updates.length + creates.length} registro${(updates.length + creates.length) !== 1 ? 's' : ''} correctamente.`,
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

  // Stats
  const stats = useMemo(() => {
    let total = 0;
    let asistio = 0;
    let tardanza = 0;
    let falta = 0;
    let justificado = 0;
    let sinMarcar = 0;

    estudiantes.forEach(est => {
      sesiones.forEach(ses => {
        total++;
        const estado = getEstado(est.ID_POSTULANTE, ses.ID_SESION);
        if (estado === 'ASISTIO') asistio++;
        else if (estado === 'TARDANZA') tardanza++;
        else if (estado === 'FALTA') falta++;
        else if (estado === 'JUSTIFICADO') justificado++;
        else sinMarcar++;
      });
    });

    return { total, asistio, tardanza, falta, justificado, sinMarcar };
  }, [estudiantes, sesiones, getEstado]);

  if (!fecha || !grupo) return null;

  const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const fechaObj = new Date(fecha + 'T00:00:00');
  const fechaFormateada = `${diasSemana[fechaObj.getDay()]}, ${fechaObj.getDate()} de ${meses[fechaObj.getMonth()]} de ${fechaObj.getFullYear()}`;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] mx-4 flex flex-col overflow-hidden"
          style={{ maxHeight: '90vh' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 shrink-0">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Asistencia Compacta - {grupo.nombreGrupo}</h2>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-sm text-gray-500 font-medium">{fechaFormateada}</span>
                <span className="text-gray-300">·</span>
                <span className="text-sm text-gray-500">{estudiantes.length} estudiantes</span>
                <span className="text-gray-300">·</span>
                <span className="text-sm text-gray-500">{sesiones.length} cursos</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="ml-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Stats bar */}
          {!loading && estudiantes.length > 0 && sesiones.length > 0 && (
            <div className="px-6 py-2.5 border-b border-gray-100 flex items-center gap-3 flex-wrap shrink-0 bg-gray-50">
              <span className="text-xs font-semibold text-gray-500">{stats.total} celdas</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                {stats.asistio} A
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                {stats.tardanza} T
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                {stats.falta} F
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                {stats.justificado} J
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                {stats.sinMarcar} —
              </span>
            </div>
          )}

          {/* Body */}
          <div className="overflow-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                <span className="ml-3 text-gray-500 text-sm">Cargando datos...</span>
              </div>
            ) : error ? (
              <div className="p-6 text-red-600 text-sm bg-red-50 m-4 rounded-xl border border-red-200">{error}</div>
            ) : estudiantes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                </svg>
                <p className="text-gray-400 text-sm font-medium">No hay estudiantes registrados para este grupo</p>
              </div>
            ) : sesiones.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <p className="text-gray-400 text-sm font-medium">No hay sesiones programadas para este día</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="sticky top-0 z-10 bg-white">
                    <tr className="border-b-2 border-gray-100">
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap bg-white sticky left-0 z-20 border-r border-gray-200">
                        #
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap bg-white sticky left-[40px] z-20 border-r border-gray-200">
                        Estudiante
                      </th>
                      {sesiones.map(sesion => (
                        <th key={sesion.ID_SESION} className="px-2 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap bg-gray-50 min-w-[80px]">
                          <div className="text-gray-500 text-[10px]">{formatHora(sesion.HORA_INICIO)}</div>
                          <div className="text-gray-700 truncate max-w-[100px]" title={sesion.NOMBRE_CURSO}>
                            {abreviarCurso(sesion.NOMBRE_CURSO)}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {estudiantes.map((est, idx) => (
                      <tr key={est.ID_POSTULANTE} className="border-b border-gray-50 hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2 whitespace-nowrap bg-white sticky left-0 z-10 border-r border-gray-200">
                          <span className="text-xs font-mono text-gray-300 select-none">{String(idx + 1).padStart(2, '0')}</span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap bg-white sticky left-[40px] z-10 border-r border-gray-200">
                          <div className="font-medium text-gray-800 text-xs">{est.APELLIDOS}</div>
                          <div className="text-gray-500 text-[10px]">{est.NOMBRES}</div>
                        </td>
                        {sesiones.map(sesion => {
                          const key = `${est.ID_POSTULANTE}_${sesion.ID_SESION}`;
                          const changed = pending.hasOwnProperty(key);
                          const estado = getEstado(est.ID_POSTULANTE, sesion.ID_SESION);
                          const idAsistencia = getIdAsistencia(est.ID_POSTULANTE, sesion.ID_SESION);
                          return (
                            <td key={sesion.ID_SESION} className={`px-2 py-2 text-center ${changed ? 'bg-blue-50/60' : ''}`}>
                              <EstadoSelectCompacto
                                value={estado}
                                onChange={nuevoEstado => handleEstadoChange(est.ID_POSTULANTE, sesion.ID_SESION, nuevoEstado, idAsistencia)}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 border-t border-gray-100 bg-white flex items-center justify-between gap-4 shrink-0">
            <div className="text-sm text-gray-500">
              {pendingCount > 0 ? (
                <span className="inline-flex items-center gap-1.5 font-medium text-blue-600">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  {pendingCount} cambio{pendingCount !== 1 ? 's' : ''} pendiente{pendingCount !== 1 ? 's' : ''}
                </span>
              ) : (
                <span className="text-gray-400">Sin cambios pendientes</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {!loading && estudiantes.length > 0 && sesiones.length > 0 && stats.sinMarcar > 0 && (
                <button
                  onClick={handleMarcarVaciosAsistio}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Marcar todo como Asistió ({stats.sinMarcar})
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
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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

          {/* Leyenda */}
          <div className="px-6 py-2 border-t border-gray-100 bg-gray-50 flex items-center gap-4 text-xs text-gray-500 shrink-0">
            <span className="font-medium">Leyenda:</span>
            {ESTADOS.map(e => (
              <span key={e.value ?? '__null__'} className="inline-flex items-center gap-1">
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold border ${e.cls}`}>
                  {e.label}
                </span>
                <span>
                  {e.value === null ? 'Sin marcar' :
                   e.value === 'ASISTIO' ? 'Asistió' :
                   e.value === 'TARDANZA' ? 'Tardanza' :
                   e.value === 'FALTA' ? 'Falta' : 'Justificado'}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Modal confirmación */}
      <FormConfirmModal
        isOpen={confirmOpen}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
        config={{
          title: 'Confirmar cambios',
          message: `¿Guardar ${pendingCount} cambio${pendingCount !== 1 ? 's' : ''} de asistencia?`,
          confirmText: 'Sí, guardar',
          cancelText: 'Cancelar',
        }}
      />

      {/* Modal notificación */}
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
