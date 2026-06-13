import React from 'react';

function PorcentajeBadge({ pct }) {
  if (pct === null || pct === undefined) {
    return <span className="text-xs text-gray-300 italic">—</span>;
  }
  const cls =
    pct >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
    pct >= 60 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                'bg-red-50 text-red-700 border-red-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${cls}`}>
      {pct}%
    </span>
  );
}

export function TablaEstudiantes({ estudiantes, loading, onVerAsistencia }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
        <span className="ml-3 text-gray-500 text-sm">Cargando estudiantes...</span>
      </div>
    );
  }

  if (estudiantes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <p className="text-gray-400 font-medium text-sm">No hay estudiantes registrados en este grupo</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-100">
            {['#', 'Apellidos y Nombres', 'Carrera', 'Total', 'Asistió', 'Tardanza', 'Falta', 'Justificado', 'Sin marcar', '% Asistencia', 'Acción'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap bg-white">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {estudiantes.map((est, idx) => (
            <tr key={est.ID_POSTULANTE} className="border-b border-gray-50 hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3.5 whitespace-nowrap">
                <span className="text-xs font-mono text-gray-300 select-none">{String(idx + 1).padStart(2, '0')}</span>
              </td>
              <td className="px-4 py-3.5 whitespace-nowrap">
                <span className="font-semibold text-gray-800">{est.APELLIDOS}, {est.NOMBRES}</span>
              </td>
              <td className="px-4 py-3.5 whitespace-nowrap">
                <span className="text-gray-500 text-sm">{est.NOMBRE_CARRERA ?? <span className="text-gray-300 italic">—</span>}</span>
              </td>
              <td className="px-4 py-3.5 whitespace-nowrap text-center">
                <span className="text-xs font-mono text-gray-500">{est.totalSesiones}</span>
              </td>
              <td className="px-4 py-3.5 whitespace-nowrap text-center">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {est.asistio}
                </span>
              </td>
              <td className="px-4 py-3.5 whitespace-nowrap text-center">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  {est.tardanza}
                </span>
              </td>
              <td className="px-4 py-3.5 whitespace-nowrap text-center">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                  {est.falta}
                </span>
              </td>
              <td className="px-4 py-3.5 whitespace-nowrap text-center">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  {est.justificado}
                </span>
              </td>
              <td className="px-4 py-3.5 whitespace-nowrap text-center">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                  {est.sinMarcar}
                </span>
              </td>
              <td className="px-4 py-3.5 whitespace-nowrap text-center">
                <PorcentajeBadge pct={est.porcentaje} />
              </td>
              <td className="px-4 py-3.5 whitespace-nowrap">
                <button
                  onClick={() => onVerAsistencia(est)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 hover:border-emerald-200 transition-all"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Ver asistencia
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
