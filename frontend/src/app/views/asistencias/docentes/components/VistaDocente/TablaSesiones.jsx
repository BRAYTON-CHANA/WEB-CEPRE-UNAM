import React from 'react';
import { formatFecha, formatHora } from '../../../grupos/utils';
import { AsistenciaBadge } from '../../../grupos/components/vista-grupo/AsistenciaBadge';
import { SuplenteBadge } from '../../../grupos/components/vista-grupo/SuplenteBadge';

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

export function TablaSesiones({ sesiones, onMarcar, nombreCurso }) {
  if (!sesiones.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mb-3">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <p className="text-gray-400 text-sm font-medium">
          {nombreCurso ? `Sin sesiones registradas para ${nombreCurso}` : 'Sin sesiones registradas'}
        </p>
      </div>
    );
  }

  const headers = ['#', 'Fecha', 'Horario', 'Estado', 'Docente programado', '¿Asistió?', 'Docente asistió', 'Entrada', 'Salida', 'Motivo', 'Observaciones', 'Acción'];

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-100">
            {headers.map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap bg-white">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sesiones.map((s, idx) => (
            <tr key={s.ID_SESION} className="border-b border-gray-50 hover:bg-slate-50 transition-colors group">
              <td className="px-4 py-3.5 whitespace-nowrap">
                <span className="text-xs font-mono text-gray-300 select-none">{String(idx + 1).padStart(2, '0')}</span>
              </td>
              <td className="px-4 py-3.5 whitespace-nowrap">
                <span className="font-medium text-gray-800 text-sm">{formatFecha(s.FECHA)}</span>
              </td>
              <td className="px-4 py-3.5 whitespace-nowrap">
                <span className="font-mono text-gray-600 text-sm tracking-tight">
                  {formatHora(s.HORA_INICIO)}<span className="text-gray-300 mx-1">–</span>{formatHora(s.HORA_FIN)}
                </span>
              </td>
              <td className="px-4 py-3.5 whitespace-nowrap">
                <EstadoSesionBadge estado={s.ESTADO} />
              </td>
              <td className="px-4 py-3.5 whitespace-nowrap">
                <span className="text-gray-700 text-sm">
                  {s.DOCENTE_PROGRAMADO_NOMBRE ?? <span className="text-gray-300 italic">Sin asignar</span>}
                </span>
              </td>
              <td className="px-4 py-3.5 whitespace-nowrap">
                <AsistenciaBadge asistio={s.ASISTIO} />
              </td>
              <td className="px-4 py-3.5 whitespace-nowrap">
                {s.DOCENTE_ASISTIO_NOMBRE ? (
                  <span className="text-gray-700 text-sm">
                    {s.DOCENTE_ASISTIO_NOMBRE}
                    <SuplenteBadge esSuplente={s.ES_SUPLENTE} />
                  </span>
                ) : s.NOMBRE_SUPLENTE_EXTERNO ? (
                  <span className="text-amber-700 text-sm">
                    {s.NOMBRE_SUPLENTE_EXTERNO}
                    <SuplenteBadge esSuplente />
                  </span>
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </td>
              <td className="px-4 py-3.5 whitespace-nowrap">
                <span className="font-mono text-gray-500 text-sm">{formatHora(s.HORA_ENTRADA_REAL)}</span>
              </td>
              <td className="px-4 py-3.5 whitespace-nowrap">
                <span className="font-mono text-gray-500 text-sm">{formatHora(s.HORA_SALIDA_REAL)}</span>
              </td>
              <td className="px-4 py-3.5 whitespace-nowrap">
                {s.MOTIVO_FALTA ? (
                  <span className="capitalize text-red-600 text-sm font-medium">{s.MOTIVO_FALTA}</span>
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </td>
              <td className="px-4 py-3.5 max-w-[180px]">
                <span className="text-gray-400 text-sm truncate block" title={s.OBSERVACIONES ?? ''}>
                  {s.OBSERVACIONES ?? '—'}
                </span>
              </td>
              <td className="px-4 py-3.5 whitespace-nowrap">
                <button
                  onClick={() => onMarcar(s)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 hover:border-blue-200 transition-all"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
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
