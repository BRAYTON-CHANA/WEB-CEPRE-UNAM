import React from 'react';

function StatPill({ label, value, color }) {
  const colors = {
    gray: 'bg-gray-100 text-gray-600',
    emerald: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    red: 'bg-red-50 text-red-700 border border-red-200',
    amber: 'bg-amber-50 text-amber-600 border border-amber-200',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${colors[color] || colors.gray}`}>
      <span className="text-base font-bold">{value}</span>
      {label}
    </span>
  );
}

export function StatsBar({ sesiones }) {
  const totalAsistio = sesiones.filter(s => s.ASISTIO === true).length;
  const totalFalto = sesiones.filter(s => s.ASISTIO === false).length;
  const sinMarcar = sesiones.filter(s => s.ASISTIO === null || s.ASISTIO === undefined).length;
  const porcentaje = sesiones.length > 0 ? Math.round((totalAsistio / sesiones.length) * 100) : 0;

  return (
    <div className="px-6 py-3.5 border-b border-gray-100 flex items-center gap-3 flex-wrap">
      <StatPill label="sesiones" value={sesiones.length} color="gray" />
      <StatPill label="asistidas" value={totalAsistio} color="emerald" />
      <StatPill label="faltas" value={totalFalto} color="red" />
      <StatPill label="sin marcar" value={sinMarcar} color="amber" />
      {sesiones.length > 0 && (
        <div className="ml-auto flex items-center gap-2">
          <div className="h-1.5 w-28 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all"
              style={{ width: `${porcentaje}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-gray-500">{porcentaje}% asistencia</span>
        </div>
      )}
    </div>
  );
}
