import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { db } from '@/shared/api';
import { useAuthContext } from '@/shared/context/AuthContext';
import { usePostulantesSesion } from '../hooks/usePostulantesSesion';
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

// JUSTIFICADO no se puede marcar aquí (solo lectura si ya viene de otro lado)
const ESTADOS = [
  { value: null,          label: '—', fullLabel: 'Sin marcar',  cls: 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200' },
  { value: 'ASISTIO',     label: 'A', fullLabel: 'Asistió',     cls: 'bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200' },
  { value: 'TARDANZA',    label: 'T', fullLabel: 'Tardanza',    cls: 'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200' },
  { value: 'FALTA',       label: 'F', fullLabel: 'Falta',       cls: 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200' },
  { value: 'JUSTIFICADO', label: 'J', fullLabel: 'Justificado', cls: 'bg-blue-100 text-blue-700 border-blue-300', soloLectura: true },
];

function EstadoSelect({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPos, setMenuPos] = useState(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const estadoActual = ESTADOS.find(e => e.value === value) || ESTADOS[0];
  const opciones = ESTADOS.filter(e => !e.soloLectura);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const menuHeight = opciones.length * 40 + 12;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < menuHeight + 8 && rect.top > menuHeight;
    setMenuPos({
      top: openUp ? rect.top - menuHeight - 4 : rect.bottom + 4,
      left: Math.min(rect.left, window.innerWidth - 170),
      openUp,
    });
  }, [opciones.length]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        buttonRef.current && !buttonRef.current.contains(e.target) &&
        (!menuRef.current || !menuRef.current.contains(e.target))
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      updatePosition();
      document.addEventListener('keydown', handleEscape);
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        document.removeEventListener('keydown', handleEscape);
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen, updatePosition]);

  return (
    <div className="relative inline-block" ref={buttonRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-11 px-3 sm:h-8 sm:w-10 sm:px-0 rounded-lg text-sm font-bold border flex items-center justify-center gap-1.5 sm:gap-0.5 transition-all active:scale-95 shadow-sm ${estadoActual.cls}`}
        title={estadoActual.fullLabel}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {/* Móvil: label completo; desktop: solo letra */}
        <span className="sm:hidden">{estadoActual.fullLabel}</span>
        <span className="hidden sm:inline">{estadoActual.label}</span>
        <svg
          className={`w-3 h-3 opacity-60 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && menuPos && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[60] bg-white rounded-xl shadow-2xl border border-gray-200 py-1.5 min-w-[150px] animate-in fade-in duration-150"
          style={{
            top: menuPos.top,
            left: menuPos.left,
            transformOrigin: menuPos.openUp ? 'bottom' : 'top',
          }}
          role="listbox"
        >
          {opciones.map((e) => (
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
        </div>,
        document.body
      )}
    </div>
  );
}

export function ModalAsistenciaSesion({ sesion, idDocente, onClose, onSuccess }) {
  const { postulantes, loading, error, refetch } = usePostulantesSesion(sesion?.ID_SESION);
  const { user } = useAuthContext();
  const idUsuario = user?.ID_USUARIO ?? user?.id_usuario ?? null;

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

  const handleMarcarTodosAsistio = useCallback(() => {
    const nuevos = {};
    postulantes.forEach(p => {
      nuevos[p.ID_ASISTENCIA] = 'ASISTIO';
    });
    if (Object.keys(nuevos).length > 0) {
      setPending(prev => ({ ...prev, ...nuevos }));
    }
  }, [postulantes]);

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

      // Marcar la sesión: docente que asistió + hora real + auditoría.
      // Si falla no bloquea — la asistencia de estudiantes ya quedó guardada.
      try {
        // Docente logueado (prop) o, para admin, el docente de la plaza del curso
        let idDocenteAsistio = idDocente ?? null;
        if (!idDocenteAsistio && sesion.ID_GRUPO_CURSO) {
          const gc = await db.select('GRUPO_CURSO', { ID_GRUPO_CURSO: sesion.ID_GRUPO_CURSO });
          const idPlaza = gc?.[0]?.ID_PLAZA_DOCENTE;
          if (idPlaza) {
            const pl = await db.select('VW_PLAZA_DOCENTE', { ID_PLAZA_DOCENTE: idPlaza });
            idDocenteAsistio = pl?.[0]?.ID_DOCENTE ?? null;
          }
        }

        const sesionPayload = {
          MARCADO_POR: idUsuario,
          FECHA_MARCADO: new Date().toISOString(),
        };
        if (idDocenteAsistio) {
          sesionPayload.ID_DOCENTE_ASISTIO = idDocenteAsistio;
          sesionPayload.ASISTIO = true;
        }
        // Hora real de entrada: solo la primera vez (se preserva la original)
        if (!sesion.HORA_ENTRADA_REAL) {
          const ahora = new Date();
          sesionPayload.HORA_ENTRADA_REAL =
            `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
        }
        await db.update('SESIONES_AGRUPADAS', sesion.ID_SESION, sesionPayload, 'ID_SESION');
      } catch (errSesion) {
        console.error('[ModalAsistenciaSesion] Error marcando sesión:', errSesion);
      }

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

  const statsLine = useMemo(() => {
    const all = postulantes.map(p => ({
      ...p,
      _estado: pending.hasOwnProperty(p.ID_ASISTENCIA) ? pending[p.ID_ASISTENCIA] : p.ESTADO_ASISTENCIA
    }));
    const asistio     = all.filter(p => p._estado === 'ASISTIO').length;
    const tardanza    = all.filter(p => p._estado === 'TARDANZA').length;
    const falta       = all.filter(p => p._estado === 'FALTA').length;
    const justificado = all.filter(p => p._estado === 'JUSTIFICADO').length;
    const sinMarcar   = all.filter(p => !p._estado).length;
    return { total: all.length, asistio, tardanza, falta, justificado, sinMarcar };
  }, [postulantes, pending]);

  if (!sesion) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center"
        style={{ background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        <div
          className="bg-white shadow-2xl w-full h-full sm:h-auto sm:rounded-2xl sm:max-w-5xl sm:mx-4 sm:max-h-[90vh] flex flex-col overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-100 shrink-0">
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">Asistencia de Estudiantes</h2>
              <div className="flex items-center gap-2 sm:gap-3 mt-1 flex-wrap">
                <span className="text-xs sm:text-sm text-gray-500 font-medium">{sesion.NOMBRE_CURSO}</span>
                <span className="text-gray-300">·</span>
                <span className="text-xs sm:text-sm text-gray-500">{formatFecha(sesion.FECHA)}</span>
                <span className="text-gray-300">·</span>
                <span className="font-mono text-xs sm:text-sm text-gray-500">
                  {formatHora(sesion.HORA_INICIO)} – {formatHora(sesion.HORA_FIN)}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="ml-4 p-2.5 sm:p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Stats bar — scroll horizontal en móvil */}
          {!loading && postulantes.length > 0 && (
            <div className="px-4 sm:px-6 py-2.5 border-b border-gray-100 flex items-center gap-2 sm:gap-3 sm:flex-wrap shrink-0 bg-gray-50 overflow-x-auto whitespace-nowrap">
              <span className="text-xs font-semibold text-gray-500 shrink-0">{statsLine.total} estudiantes</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                {statsLine.asistio} asistieron
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                {statsLine.tardanza} tardanza
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200 shrink-0">
                {statsLine.falta} faltas
              </span>
              {statsLine.justificado > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                  {statsLine.justificado} justificados
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 shrink-0">
                {statsLine.sinMarcar} sin marcar
              </span>
            </div>
          )}

          {/* Body */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#25346A]" />
                <span className="ml-3 text-gray-500 text-sm">Cargando estudiantes...</span>
              </div>
            ) : error ? (
              <div className="p-6 text-red-600 text-sm bg-red-50 m-4 rounded-xl border border-red-200">{error}</div>
            ) : postulantes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                </svg>
                <p className="text-gray-400 text-sm font-medium">No hay estudiantes registrados para esta sesión</p>
              </div>
            ) : (
              <>
                {/* Móvil: lista de tarjetas */}
                <div className="sm:hidden divide-y divide-gray-50">
                  {postulantes.map((p) => {
                    const estadoActual = getEstado(p);
                    const changed = pending.hasOwnProperty(p.ID_ASISTENCIA);
                    return (
                      <div
                        key={p.ID_ASISTENCIA}
                        className={`px-4 py-3 flex items-center gap-3 transition-colors ${changed ? 'bg-[#eef1f8]' : ''}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800 text-sm leading-snug">
                              {p.NOMBRE_COMPLETO}
                            </span>
                            {changed && (
                              <span className="inline-flex w-1.5 h-1.5 rounded-full bg-[#5b6fae] flex-shrink-0" title="Modificado" />
                            )}
                          </div>
                          <span className="font-mono text-[11px] text-gray-400">{p.DNI || '—'}</span>
                        </div>
                        <EstadoSelect
                          value={estadoActual}
                          onChange={nuevoEstado => handleEstadoChange(p.ID_ASISTENCIA, nuevoEstado)}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Desktop: tabla */}
                <table className="hidden sm:table w-full text-sm border-collapse">
                  <thead className="sticky top-0 z-10 bg-white">
                    <tr className="border-b-2 border-gray-100">
                      {['#', 'DNI', 'Apellidos y Nombres', 'Estado'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {postulantes.map((p, idx) => {
                      const estadoActual = getEstado(p);
                      const changed = pending.hasOwnProperty(p.ID_ASISTENCIA);
                      return (
                        <tr
                          key={p.ID_ASISTENCIA}
                          className={`border-b border-gray-50 transition-colors ${changed ? 'bg-[#eef1f8]' : 'hover:bg-slate-50'}`}
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-xs font-mono text-gray-300 select-none">{String(idx + 1).padStart(2, '0')}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="font-mono text-xs text-gray-500">{p.DNI || '—'}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap max-w-[220px]">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-800 truncate">
                                {p.NOMBRE_COMPLETO}
                              </span>
                              {changed && (
                                <span className="inline-flex w-1.5 h-1.5 rounded-full bg-[#5b6fae] flex-shrink-0" title="Modificado" />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <EstadoSelect
                              value={estadoActual}
                              onChange={nuevoEstado => handleEstadoChange(p.ID_ASISTENCIA, nuevoEstado)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            )}
          </div>

          {/* Footer sticky — móvil: pendientes arriba, Guardar full-width, secundarios abajo */}
          <div className="px-4 pt-3 sm:px-6 sm:py-3.5 border-t border-gray-100 bg-white shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
              <div className="text-xs sm:text-sm text-gray-500">
                {pendingCount > 0 ? (
                  <span className="inline-flex items-center gap-1.5 font-medium text-[#25346A]">
                    <span className="w-2 h-2 rounded-full bg-[#5b6fae]" />
                    {pendingCount} cambio{pendingCount !== 1 ? 's' : ''} pendiente{pendingCount !== 1 ? 's' : ''}
                  </span>
                ) : (
                  <span className="text-gray-400">Sin cambios pendientes</span>
                )}
              </div>
              {/* col-reverse en móvil: Guardar (último en DOM) queda arriba */}
              <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-2 sm:gap-3">
                <div className="flex gap-2 sm:contents">
                  {!loading && postulantes.length > 0 && (
                    <button
                      onClick={handleMarcarTodosAsistio}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span className="sm:hidden">Todos asistió</span>
                      <span className="hidden sm:inline">Marcar todos como Asistió</span>
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
                <button
                  onClick={handleGuardar}
                  disabled={pendingCount === 0 || saving}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-2 rounded-lg text-sm font-semibold text-white bg-[#25346A] hover:bg-[#1a2545] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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

      {/* Modal notificación resultado */}
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
