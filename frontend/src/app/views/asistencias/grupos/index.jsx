import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Layout from '@/shared/components/layout/Layout';
import { db } from '@/shared/api';
import { Link } from 'react-router-dom';

function formatFecha(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-PE', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

function formatHora(t) {
  if (!t) return '—';
  return t.slice(0, 5);
}

function AsistenciaBadge({ asistio }) {
  if (asistio === true)
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        Asistió
      </span>
    );
  if (asistio === false)
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        Falta
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-400 border border-gray-200">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
      Sin marcar
    </span>
  );
}

function SuplenteBadge({ esSuplente }) {
  if (!esSuplente) return null;
  return (
    <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
      Suplente
    </span>
  );
}

function EstadoSesionBadge({ estado }) {
  const cfg = {
    programado:   { cls: 'bg-sky-50 text-sky-700 border-sky-200' },
    realizado:    { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    cancelado:    { cls: 'bg-red-50 text-red-700 border-red-200' },
    reprogramado: { cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  }[estado] || { cls: 'bg-gray-50 text-gray-500 border-gray-200' };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize border ${cfg.cls}`}>
      {estado ?? '—'}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="h-32 bg-white border border-gray-100 rounded-2xl animate-pulse overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-gray-200 to-gray-100 w-full" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-100 rounded-lg w-2/3" />
        <div className="h-3.5 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
      </div>
    </div>
  );
}

function ModalMarcarAsistencia({ sesion, onClose }) {
  if (!sesion) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Marcar Asistencia</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {formatFecha(sesion.FECHA)} · {formatHora(sesion.HORA_INICIO)} – {formatHora(sesion.HORA_FIN)}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="px-6 py-12 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
          </div>
          <p className="text-gray-700 font-medium text-base mb-1">Formulario de asistencia</p>
          <p className="text-gray-400 text-sm max-w-xs">Aquí se cargará el formulario para marcar la asistencia del docente en esta sesión.</p>
          <div className="mt-6 w-full h-px bg-gray-100" />
          <p className="mt-4 text-xs text-gray-300 font-mono">Sesión ID: {sesion.ID_SESION}</p>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors">Cancelar</button>
          <button className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors">Guardar</button>
        </div>
      </div>
    </div>
  );
}

function TablaSesiones({ sesiones, onMarcar }) {
  if (!sesiones.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mb-3">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </div>
        <p className="text-gray-400 text-sm font-medium">Sin sesiones registradas para este curso</p>
      </div>
    );
  }

  const headers = ['#', 'Fecha', 'Horario', 'Duración', 'Estado', 'Docente programado', '¿Asistió?', 'Docente asistió', 'Entrada real', 'Motivo', 'Observaciones', 'Acción'];

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-100">
            {headers.map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap bg-white">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sesiones.map((s, idx) => (
            <tr key={s.ID_SESION} className="border-b border-gray-50 hover:bg-slate-50 transition-colors group">
              <td className="px-4 py-3.5 whitespace-nowrap"><span className="text-xs font-mono text-gray-300 select-none">{String(idx + 1).padStart(2, '0')}</span></td>
              <td className="px-4 py-3.5 whitespace-nowrap"><span className="font-medium text-gray-800 text-sm">{formatFecha(s.FECHA)}</span></td>
              <td className="px-4 py-3.5 whitespace-nowrap"><span className="font-mono text-gray-600 text-sm tracking-tight">{formatHora(s.HORA_INICIO)}<span className="text-gray-300 mx-1">–</span>{formatHora(s.HORA_FIN)}</span></td>
              <td className="px-4 py-3.5 whitespace-nowrap"><span className="text-gray-500 text-sm">{s.DURACION_TOTAL_MINUTOS ? `${s.DURACION_TOTAL_MINUTOS} min` : '—'}</span></td>
              <td className="px-4 py-3.5 whitespace-nowrap"><EstadoSesionBadge estado={s.ESTADO} /></td>
              <td className="px-4 py-3.5 whitespace-nowrap"><span className="text-gray-700 text-sm">{s.DOCENTE_PROGRAMADO_NOMBRE ?? <span className="text-gray-300 italic">Sin asignar</span>}</span></td>
              <td className="px-4 py-3.5 whitespace-nowrap"><AsistenciaBadge asistio={s.ASISTIO} /></td>
              <td className="px-4 py-3.5 whitespace-nowrap">
                {s.DOCENTE_ASISTIO_NOMBRE
                  ? <span className="text-gray-700 text-sm">{s.DOCENTE_ASISTIO_NOMBRE}<SuplenteBadge esSuplente={s.ES_SUPLENTE} /></span>
                  : s.NOMBRE_SUPLENTE_EXTERNO
                    ? <span className="text-amber-700 text-sm">{s.NOMBRE_SUPLENTE_EXTERNO}<SuplenteBadge esSuplente /></span>
                    : <span className="text-gray-300">—</span>
                }
              </td>
              <td className="px-4 py-3.5 whitespace-nowrap"><span className="font-mono text-gray-500 text-sm">{formatHora(s.HORA_ENTRADA_REAL)}</span></td>
              <td className="px-4 py-3.5 whitespace-nowrap">
                {s.MOTIVO_FALTA ? <span className="capitalize text-red-600 text-sm font-medium">{s.MOTIVO_FALTA}</span> : <span className="text-gray-300">—</span>}
              </td>
              <td className="px-4 py-3.5 max-w-[180px]"><span className="text-gray-400 text-sm truncate block" title={s.OBSERVACIONES ?? ''}>{s.OBSERVACIONES ?? '—'}</span></td>
              <td className="px-4 py-3.5 whitespace-nowrap">
                <button
                  onClick={() => onMarcar(s)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 hover:border-blue-200 transition-all"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Marcar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatPill({ label, value, color }) {
  const colors = {
    gray:    'bg-gray-100 text-gray-600',
    emerald: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    red:     'bg-red-50 text-red-700 border border-red-200',
    amber:   'bg-amber-50 text-amber-600 border border-amber-200',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${colors[color] || colors.gray}`}>
      <span className="text-base font-bold">{value}</span>
      {label}
    </span>
  );
}

function VistaGrupo({ grupo, onVolver }) {
  const [sesiones, setSesiones]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [cursoActivo, setCursoActivo] = useState(null);
  const [sesionModal, setSesionModal] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    db.select('VW_SESIONES_COMPLETA', { ID_GRUPO: grupo.ID_GRUPO })
      .then(data => {
        setSesiones(data || []);
        const cursos = [...new Map((data || []).map(s => [s.ID_CURSO, s])).values()];
        if (cursos.length) setCursoActivo(cursos[0].ID_CURSO);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [grupo.ID_GRUPO]);

  const cursos = useMemo(() => {
    const map = new Map();
    sesiones.forEach(s => {
      if (!map.has(s.ID_CURSO)) map.set(s.ID_CURSO, { ID_CURSO: s.ID_CURSO, NOMBRE_CURSO: s.NOMBRE_CURSO, CODIGO_CURSO: s.CODIGO_CURSO, NOMBRE_AREA: s.NOMBRE_AREA });
    });
    return [...map.values()];
  }, [sesiones]);

  const sesionesDelCurso = useMemo(
    () => sesiones.filter(s => s.ID_CURSO === cursoActivo).sort((a, b) => new Date(a.FECHA) - new Date(b.FECHA)),
    [sesiones, cursoActivo]
  );

  const totalAsistio = sesionesDelCurso.filter(s => s.ASISTIO === true).length;
  const totalFalto   = sesionesDelCurso.filter(s => s.ASISTIO === false).length;
  const sinMarcar    = sesionesDelCurso.filter(s => s.ASISTIO === null || s.ASISTIO === undefined).length;
  const handleMarcar = useCallback((s) => setSesionModal(s), []);

  return (
    <>
      <ModalMarcarAsistencia sesion={sesionModal} onClose={() => setSesionModal(null)} />
      <div>
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <button onClick={onVolver} className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-gray-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Grupos
          </button>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          <span className="text-sm font-semibold text-gray-800">{grupo.CODIGO_GRUPO}</span>
          <div className="ml-2 flex items-center gap-2">
            {grupo.NOMBRE_SEDE && <span className="text-xs bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full font-medium">{grupo.NOMBRE_SEDE}</span>}
            {grupo.NOMBRE_TURNO && <span className="text-xs bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full font-medium">{grupo.NOMBRE_TURNO}</span>}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{grupo.NOMBRE_GRUPO}</h2>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({length: 4}).map((_,i) => (
              <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
            ))}
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        ) : cursos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
            </div>
            <p className="text-gray-400 font-medium text-sm">Este grupo no tiene sesiones registradas</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="bg-white border border-gray-200 rounded-2xl p-2 shadow-sm flex gap-2 flex-wrap">
              {cursos.map(c => (
                <button
                  key={c.ID_CURSO}
                  onClick={() => setCursoActivo(c.ID_CURSO)}
                  className={`relative flex flex-col items-start px-4 py-2.5 rounded-xl text-left transition-all ${
                    cursoActivo === c.ID_CURSO ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className="text-sm font-semibold leading-tight">{c.NOMBRE_CURSO}</span>
                  <span className={`text-xs mt-0.5 leading-tight ${cursoActivo === c.ID_CURSO ? 'text-blue-200' : 'text-gray-400'}`}>{c.NOMBRE_AREA}</span>
                </button>
              ))}
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-3.5 border-b border-gray-100 flex items-center gap-3 flex-wrap">
                <StatPill label="sesiones" value={sesionesDelCurso.length} color="gray" />
                <StatPill label="asistidas" value={totalAsistio} color="emerald" />
                <StatPill label="faltas" value={totalFalto} color="red" />
                <StatPill label="sin marcar" value={sinMarcar} color="amber" />
                {sesionesDelCurso.length > 0 && (
                  <div className="ml-auto flex items-center gap-2">
                    <div className="h-1.5 w-28 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all" style={{ width: `${Math.round((totalAsistio / sesionesDelCurso.length) * 100)}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-gray-500">{Math.round((totalAsistio / sesionesDelCurso.length) * 100)}% asistencia</span>
                  </div>
                )}
              </div>
              <TablaSesiones sesiones={sesionesDelCurso} onMarcar={handleMarcar} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function AsistenciasGrupos() {
  const [periodos, setPeriodos]               = useState([]);
  const [periodoActivo, setPeriodoActivo]     = useState(null);
  const [grupos, setGrupos]                   = useState([]);
  const [loadingPeriodos, setLoadingPeriodos] = useState(true);
  const [loadingGrupos, setLoadingGrupos]     = useState(false);
  const [errorGrupos, setErrorGrupos]         = useState(null);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);

  useEffect(() => {
    db.select('PERIODOS', { ACTIVO: true })
      .then(data => {
        setPeriodos(data || []);
        if (data && data.length) setPeriodoActivo(data[0].ID_PERIODO);
      })
      .catch(() => {})
      .finally(() => setLoadingPeriodos(false));
  }, []);

  useEffect(() => {
    if (!periodoActivo) return;
    setLoadingGrupos(true);
    setErrorGrupos(null);
    setGrupoSeleccionado(null);
    db.select('GRUPOS', { ID_PERIODO: periodoActivo, ACTIVO: true })
      .then(data => setGrupos(data || []))
      .catch(err => setErrorGrupos(err.message))
      .finally(() => setLoadingGrupos(false));
  }, [periodoActivo]);

  const periodoNombre = periodos.find(p => p.ID_PERIODO === periodoActivo)?.NOMBRE_PERIODO ?? '';

  return (
    <Layout>
      <div className="min-h-screen py-10" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
        <div className="max-w-screen-2xl mx-auto px-6">

          <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link to="/asistencias" className="text-xs font-semibold text-blue-400 hover:text-blue-600 uppercase tracking-widest transition-colors">Asistencias</Link>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest">Grupos</span>
              </div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">Asistencias por Grupo</h1>
              <p className="text-gray-400 mt-1 text-sm">Control de asistencia de docentes por sesión y grupo</p>
            </div>

            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">Período</label>
              {loadingPeriodos ? (
                <div className="h-5 w-36 bg-gray-100 rounded animate-pulse" />
              ) : (
                <select
                  value={periodoActivo ?? ''}
                  onChange={e => setPeriodoActivo(Number(e.target.value))}
                  className="text-sm font-medium text-gray-800 bg-transparent focus:outline-none cursor-pointer"
                >
                  {periodos.map(p => (
                    <option key={p.ID_PERIODO} value={p.ID_PERIODO}>{p.NOMBRE_PERIODO}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {grupoSeleccionado ? (
            <VistaGrupo grupo={grupoSeleccionado} onVolver={() => setGrupoSeleccionado(null)} />
          ) : (
            <div>
              {periodoNombre && (
                <p className="text-sm text-gray-500 mb-5">
                  <span className="font-semibold text-gray-700">{periodoNombre}</span>
                  <span className="mx-2 text-gray-300">·</span>
                  Selecciona un grupo para ver sus asistencias
                </p>
              )}
              {errorGrupos ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{errorGrupos}</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {loadingGrupos
                    ? Array.from({length: 10}).map((_,i) => <SkeletonCard key={i} />)
                    : grupos.length === 0
                      ? <p className="col-span-full text-center text-gray-400 py-16 text-sm">No hay grupos en este período</p>
                      : grupos.map(g => (
                        <button
                          key={g.ID_GRUPO}
                          onClick={() => setGrupoSeleccionado(g)}
                          className="text-left bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-blue-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
                        >
                          <div className="h-1 w-full bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <span className="text-xl font-black text-gray-800 group-hover:text-blue-700 transition-colors tracking-tight">{g.CODIGO_GRUPO}</span>
                              <div className="w-7 h-7 rounded-lg bg-gray-50 group-hover:bg-blue-50 flex items-center justify-center transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 group-hover:text-blue-400 transition-colors"><polyline points="9 18 15 12 9 6"/></svg>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">{g.NOMBRE_GRUPO}</p>
                            <div className="flex flex-col gap-1.5">
                              {g.NOMBRE_SEDE && (
                                <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                  {g.NOMBRE_SEDE}
                                </span>
                              )}
                              {g.NOMBRE_TURNO && (
                                <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                  {g.NOMBRE_TURNO}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      ))
                  }
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default AsistenciasGrupos;
