import React from 'react';

/**
 * Resumen de horas académicas generadas
 */
const HorasAcademicasSummary = ({ asignaciones }) => {
  const stats = React.useMemo(() => {
    if (!asignaciones || asignaciones.length === 0) return null;

    const map = new Map();
    for (const a of asignaciones) {
      const key = a.ID_GRUPO_PLAN_CURSO;
      const existing = map.get(key);
      if (existing) {
        existing.totalMinutos += a._duracion || 0;
        existing.totalBloques += 1;
      } else {
        map.set(key, {
          ID_GRUPO_PLAN_CURSO: key,
          nombreCurso: a._nombreCurso,
          codigoCompartido: a._codigoCompartido,
          nombreDocente: a._nombreDocente,
          totalMinutos: a._duracion || 0,
          totalBloques: 1
        });
      }
    }
    const resumenPorCurso = Array.from(map.values()).map(r => ({
      ...r,
      horasAcademicas: r.totalMinutos / 50
    }));

    const totalMinutos = resumenPorCurso.reduce((acc, r) => acc + r.totalMinutos, 0);

    return {
      totalAsignaciones: asignaciones.length,
      totalMinutos,
      horasAcademicas: totalMinutos / 50,
      resumenPorCurso
    };
  }, [asignaciones]);

  if (!stats) return null;

  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-[#2D366F]/10 to-[#57C7C2]/10 rounded-xl border border-[#2D366F]/20">
      <h3 className="text-sm font-bold text-[#2D366F] mb-3 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Resumen por curso (1 hora académica = 50 min)
      </h3>
      
      {/* Totales generales */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="text-2xl font-bold text-[#2D366F]">{stats.totalAsignaciones}</div>
          <div className="text-xs text-[#2D366F]/70">Asignaciones</div>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="text-2xl font-bold text-[#57C7C2]">{stats.totalMinutos}</div>
          <div className="text-xs text-[#57C7C2]/70">Minutos Totales</div>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="text-2xl font-bold text-[#57C7C2]">{stats.horasAcademicas.toFixed(2)}</div>
          <div className="text-xs text-[#57C7C2]/70">Horas Académicas</div>
        </div>
      </div>

      {/* Tabla por curso */}
      <div className="overflow-x-auto rounded-lg border border-[#2D366F]/20 bg-white">
        <table className="min-w-full divide-y divide-[#2D366F]/10">
          <thead className="bg-[#2D366F]/10">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-bold text-[#2D366F] uppercase tracking-wider">Curso</th>
              <th className="px-4 py-2 text-left text-xs font-bold text-[#2D366F] uppercase tracking-wider">Docente</th>
              <th className="px-4 py-2 text-right text-xs font-bold text-[#2D366F] uppercase tracking-wider">Bloques</th>
              <th className="px-4 py-2 text-right text-xs font-bold text-[#2D366F] uppercase tracking-wider">Total min</th>
              <th className="px-4 py-2 text-right text-xs font-bold text-[#2D366F] uppercase tracking-wider">Horas acad.</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#2D366F]/10">
            {stats.resumenPorCurso.map((r, i) => (
              <tr key={i} className="hover:bg-[#2D366F]/5 transition-colors">
                <td className="px-4 py-2.5 text-sm text-slate-800">
                  {r.codigoCompartido && (
                    <span className="font-mono text-xs text-[#57C7C2] mr-1">{r.codigoCompartido}</span>
                  )}
                  <span className="font-semibold">{r.nombreCurso}</span>
                </td>
                <td className="px-4 py-2.5 text-sm text-slate-600 italic">{r.nombreDocente || '—'}</td>
                <td className="px-4 py-2.5 text-sm text-slate-700 text-right font-mono">{r.totalBloques}</td>
                <td className="px-4 py-2.5 text-sm text-slate-700 text-right font-mono">{r.totalMinutos}</td>
                <td className="px-4 py-2.5 text-sm text-[#57C7C2] text-right font-bold font-mono">
                  {r.horasAcademicas.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-[#2D366F]/10 border-t-2 border-[#2D366F]/20">
            <tr>
              <td className="px-4 py-2.5 text-sm font-bold text-[#2D366F]" colSpan={2}>Total</td>
              <td className="px-4 py-2.5 text-sm text-[#2D366F] text-right font-mono font-bold">
                {stats.resumenPorCurso.reduce((s, r) => s + r.totalBloques, 0)}
              </td>
              <td className="px-4 py-2.5 text-sm text-[#2D366F] text-right font-mono font-bold">
                {stats.totalMinutos}
              </td>
              <td className="px-4 py-2.5 text-sm text-[#2D366F] text-right font-mono font-bold">
                {stats.horasAcademicas.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default HorasAcademicasSummary;
