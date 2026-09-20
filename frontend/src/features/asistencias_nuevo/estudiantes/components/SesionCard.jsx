import React from 'react';
import { ventanaSesion, sesionHabilitada } from '../utils/sesionHabilitada';

const DIAS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function parseFecha(fecha) {
  if (!fecha) return null;
  const d = new Date(`${fecha}T00:00:00`);
  return isNaN(d) ? null : d;
}

const fmtHora = (t) => (t ? t.slice(0, 5) : '—');

function EstadoBadge({ sesion }) {
  if (sesion.ASISTIO === true) {
    return <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Asistió</span>;
  }
  if (sesion.ASISTIO === false) {
    return <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-50 text-red-600">No asistió</span>;
  }
  const estilos = {
    programado: 'bg-slate-100 text-slate-500',
    realizado: 'bg-emerald-50 text-emerald-700',
    cancelado: 'bg-red-50 text-red-600',
    reprogramado: 'bg-amber-50 text-amber-600',
  };
  const estado = sesion.ESTADO || 'programado';
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${estilos[estado] || estilos.programado}`}>
      {estado}
    </span>
  );
}

function DisponibilidadBadge({ sesion, ahora }) {
  const v = ventanaSesion(sesion);
  if (!v) return null;
  const fmt = (d) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (ahora < v.desde) {
    return (
      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 whitespace-nowrap">
        Disponible {fmt(v.desde)}
      </span>
    );
  }
  return (
    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 whitespace-nowrap">
      Fuera de horario
    </span>
  );
}

export function SesionCard({ sesion, onClick, restringirHorario = false, ahora = new Date() }) {
  const fecha = parseFecha(sesion.FECHA);
  const habilitada = !restringirHorario || sesionHabilitada(sesion, ahora);

  return (
    <button
      onClick={() => habilitada && onClick?.(sesion)}
      disabled={!habilitada}
      className={`text-left bg-white border border-gray-100 rounded-2xl overflow-hidden flex w-full transition-all duration-200 ${
        habilitada
          ? 'hover:border-[#25346A] hover:shadow-lg hover:-translate-y-0.5'
          : 'opacity-60 cursor-not-allowed'
      }`}
    >
      {/* Bloque de fecha */}
      <div className="w-16 flex-shrink-0 bg-gradient-to-b from-[#25346A] to-[#1a2545] flex flex-col items-center justify-center py-4 text-white">
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
          {fecha ? DIAS[fecha.getDay()] : '—'}
        </span>
        <span className="text-2xl font-black leading-none my-0.5">
          {fecha ? String(fecha.getDate()).padStart(2, '0') : '—'}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
          {fecha ? `${MESES[fecha.getMonth()]} ${fecha.getFullYear()}` : ''}
        </span>
      </div>

      {/* Info de la sesión */}
      <div className="p-4 flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1.5 flex-wrap">
          <span className="text-sm font-bold text-gray-800 truncate min-w-0">
            {sesion.NOMBRE_CURSO || 'Sin curso'}
          </span>
          <span className="flex items-center gap-1 flex-shrink-0 flex-wrap justify-end">
            {!habilitada && <DisponibilidadBadge sesion={sesion} ahora={ahora} />}
            <EstadoBadge sesion={sesion} />
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center gap-1 text-xs text-gray-400">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            {fmtHora(sesion.HORA_INICIO)} – {fmtHora(sesion.HORA_FIN)}
            {sesion.DURACION_TOTAL_MINUTOS ? ` · ${sesion.DURACION_TOTAL_MINUTOS} min` : ''}
          </span>
          {sesion.DOCENTE_ASIGNADO && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-400">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              {sesion.DOCENTE_ASIGNADO}
            </span>
          )}
          {sesion.TEMA && (
            <span className="text-xs text-gray-500 italic truncate">{sesion.TEMA}</span>
          )}
        </div>
      </div>
    </button>
  );
}
