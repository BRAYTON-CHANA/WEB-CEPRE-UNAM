import React, { useState, useEffect, useRef } from 'react';
import Layout from '@/shared/components/layout/Layout';
import logo from '@/../../public/logo.jpg';
import { db } from '@/shared/api';

const ESTADO_CONFIG = {
  'En clase': { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500',  label: 'En clase',       rowBg: 'bg-green-50/40' },
  'En break': { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500', label: 'En break',       rowBg: 'bg-yellow-50/40' },
  'Próxima':  { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500',   label: 'Próxima',        rowBg: '' },
  'Sin más clases': { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400', label: 'Sin más clases', rowBg: '' },
};

function timeStrToDate(timeStr, referenceDate) {
  if (!timeStr) return null;
  const [h, m, s] = timeStr.split(':').map(Number);
  const d = new Date(referenceDate);
  d.setHours(h, m, s || 0, 0);
  return d;
}

function horaFinBreakActual(horaInicioStr, idsBloques, ahora, fechaStr) {
  if (!horaInicioStr || !idsBloques || !Array.isArray(idsBloques)) return null;
  const ref = fechaStr ? new Date(fechaStr + 'T00:00:00') : new Date();
  const horaIni = timeStrToDate(horaInicioStr, ref);
  if (!horaIni) return null;
  const segundosTranscurridos = (ahora - horaIni) / 1000;
  let acum = 0;
  for (const bloque of idsBloques) {
    const dur = (bloque.duracion ?? 0) * 60;
    if (segundosTranscurridos >= acum && segundosTranscurridos < acum + dur) {
      if (bloque.tipo === 'break') {
        const finBreak = new Date(horaIni.getTime() + (acum + dur) * 1000);
        return finBreak;
      }
      return null;
    }
    acum += dur;
  }
  return null;
}

function calcularSegsRestantes(row, ahora) {
  const estado = row.ESTADO_ACTUAL;
  if (!estado || estado === 'Sin más clases') return null;

  const fechaStr = row.FECHA;
  const ref = fechaStr ? new Date(fechaStr + 'T00:00:00') : new Date();

  if (estado === 'En clase') {
    const horaFin = timeStrToDate(row.HORA_FIN, ref);
    if (!horaFin) return null;
    return Math.max(0, Math.floor((horaFin - ahora) / 1000));
  }

  if (estado === 'En break') {
    const bloques = row.IDS_BLOQUES;
    const finBreak = horaFinBreakActual(row.HORA_INICIO, bloques, ahora, fechaStr);
    if (!finBreak) return null;
    return Math.max(0, Math.floor((finBreak - ahora) / 1000));
  }

  if (estado === 'Próxima') {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaSesion = new Date(fechaStr + 'T00:00:00');
    const diffDias = Math.round((fechaSesion - hoy) / (1000 * 60 * 60 * 24));
    if (diffDias > 0) return null;
    const horaIni = timeStrToDate(row.HORA_INICIO, ref);
    if (!horaIni) return null;
    return Math.max(0, Math.floor((horaIni - ahora) / 1000));
  }

  return null;
}

function formatSegs(segs) {
  if (segs === null || segs === undefined) return null;
  const h = Math.floor(segs / 3600);
  const m = Math.floor((segs % 3600) / 60);
  const s = segs % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}

function EstadoBadge({ estado }) {
  const cfg = ESTADO_CONFIG[estado] || ESTADO_CONFIG['Sin más clases'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function TiempoCell({ row, ahora }) {
  const estado = row.ESTADO_ACTUAL;

  if (estado === 'En clase' || estado === 'En break') {
    const segs = calcularSegsRestantes(row, ahora);
    const txt = formatSegs(segs);
    const colorClass = estado === 'En clase' ? 'text-green-700' : 'text-yellow-700';
    const label = estado === 'En clase' ? 'restantes' : 'hasta clase';
    if (!txt) return <span className="text-gray-400">—</span>;
    return (
      <span className={`font-mono font-semibold ${colorClass}`}>
        {txt} <span className="font-normal text-xs opacity-70">{label}</span>
      </span>
    );
  }

  if (estado === 'Próxima') {
    const dias = row.DIAS_PARA_SIGUIENTE;
    if (dias === null || dias === undefined) return <span className="text-gray-400">—</span>;
    if (dias > 0) {
      if (dias === 1) return <span className="text-blue-700 font-medium">Mañana</span>;
      return <span className="text-blue-600">En {dias} día{dias !== 1 ? 's' : ''}</span>;
    }
    const segs = calcularSegsRestantes(row, ahora);
    const txt = formatSegs(segs);
    if (!txt) return <span className="text-blue-700 font-medium">Hoy</span>;
    return (
      <span className="font-mono font-semibold text-blue-700">
        {txt} <span className="font-normal text-xs opacity-70">para iniciar</span>
      </span>
    );
  }

  return <span className="text-gray-400">—</span>;
}

function formatHora(time) {
  if (!time) return '—';
  return time.slice(0, 5);
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
        </td>
      ))}
    </tr>
  );
}

function Home() {
  const [sesiones, setSesiones] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [ahora, setAhora]       = useState(() => new Date());
  const intervalRef             = useRef(null);

  useEffect(() => {
    async function cargarSesiones() {
      try {
        setLoading(true);
        setError(null);
        const data = await db.select('VW_SESION_ACTUAL_POR_GRUPO');
        setSesiones(data || []);
      } catch (err) {
        console.error('Error cargando sesiones:', err);
        setError(err.message || 'Error al cargar las sesiones');
      } finally {
        setLoading(false);
      }
    }
    cargarSesiones();
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(() => setAhora(new Date()), 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const enClase   = sesiones.filter(s => s.ESTADO_ACTUAL === 'En clase').length;
  const enBreak   = sesiones.filter(s => s.ESTADO_ACTUAL === 'En break').length;
  const proximas  = sesiones.filter(s => s.ESTADO_ACTUAL === 'Próxima').length;
  const sinClases = sesiones.filter(s => s.ESTADO_ACTUAL === 'Sin más clases').length;

  return (
    <Layout>
      <div className="min-h-screen py-12">
        <div className="text-center max-w-4xl mx-auto px-4 mb-10">
          <div className="mb-6 animate-fadeIn">
            <img src={logo} alt="Logo" className="w-28 h-28 mx-auto object-contain" />
          </div>
          <h1 className="text-5xl font-bold text-gradient mb-4 animate-fadeIn">
            Sistema de Gestión de Horarios
          </h1>
          <p className="text-xl text-gray-600 animate-fadeIn">
            Aplicación para la creación y gestión de horarios académicos
          </p>
        </div>

        {/* Tarjetas resumen */}
        {!loading && !error && (
          <div className="max-w-6xl mx-auto px-4 mb-6 grid grid-cols-4 gap-4 animate-fadeIn">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-lg">▶</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">{enClase}</p>
                <p className="text-xs text-green-600 font-medium">En clase ahora</p>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-yellow-600 text-lg">☕</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-700">{enBreak}</p>
                <p className="text-xs text-yellow-600 font-medium">En break</p>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-lg">⏰</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">{proximas}</p>
                <p className="text-xs text-blue-600 font-medium">Próximas sesiones</p>
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-400 text-lg">✓</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-500">{sinClases}</p>
                <p className="text-xs text-gray-500 font-medium">Sin más clases</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabla principal */}
        <div className="max-w-6xl mx-auto px-4">
          <div className="card animate-fadeIn">
            <div className="card-header flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Sesiones Actuales por Grupo</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Sesión en curso o próxima sesión programada por grupo
                </p>
              </div>
              {!loading && (
                <span className="text-sm text-gray-400">{sesiones.length} grupos</span>
              )}
            </div>
            <div className="card-body">
              {error ? (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <span className="text-lg">⚠</span>
                  <div>
                    <p className="font-medium">Error al cargar los datos</p>
                    <p className="text-sm text-red-500">{error}</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Grupo</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sede</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Área</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Curso</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Horario</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Docente</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Countdown</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {loading
                        ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                        : sesiones.length === 0
                          ? (
                            <tr>
                              <td colSpan={8} className="px-4 py-10 text-center text-gray-400 text-sm">
                                No hay grupos registrados o sin sesiones programadas
                              </td>
                            </tr>
                          )
                          : sesiones.map((row, i) => {
                            const cfg = ESTADO_CONFIG[row.ESTADO_ACTUAL] || ESTADO_CONFIG['Sin más clases'];
                            return (
                              <tr
                                key={row.ID_GRUPO ?? i}
                                className={`hover:bg-gray-50 transition-colors ${cfg.rowBg}`}
                              >
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <EstadoBadge estado={row.ESTADO_ACTUAL} />
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <p className="text-sm font-semibold text-gray-900">{row.CODIGO_GRUPO ?? '—'}</p>
                                  <p className="text-xs text-gray-400">{row.NOMBRE_GRUPO ?? ''}</p>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                  {row.NOMBRE_SEDE ?? '—'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                  {row.NOMBRE_AREA ?? '—'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700 max-w-[180px]">
                                  <span className="line-clamp-2">{row.NOMBRE_CURSO ?? '—'}</span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                  {row.HORA_INICIO
                                    ? <span className="font-mono">{formatHora(row.HORA_INICIO)} – {formatHora(row.HORA_FIN)}</span>
                                    : <span className="text-gray-400">—</span>
                                  }
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                  {row.DOCENTE_NOMBRE ?? <span className="text-gray-400">Sin asignar</span>}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                  <TiempoCell row={row} ahora={ahora} />
                                </td>
                              </tr>
                            );
                          })
                      }
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Home;
