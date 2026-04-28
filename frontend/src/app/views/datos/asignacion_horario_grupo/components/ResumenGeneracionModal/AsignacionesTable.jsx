import React from 'react';

/**
 * Tabla de asignaciones generadas
 */
const AsignacionesTable = ({ asignaciones }) => {
  if (!asignaciones || asignaciones.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        No hay asignaciones generadas
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Fecha</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Día</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Columna</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Bloque</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Curso</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Docente</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {asignaciones.map((a, i) => (
            <tr key={i} className="hover:bg-[#2D366F]/5">
              <td className="px-4 py-3 text-sm text-slate-800">{a.FECHA}</td>
              <td className="px-4 py-3 text-sm text-slate-700">{a._diaSemana}</td>
              <td className="px-4 py-3 text-sm text-slate-700 font-semibold">{a._columna}</td>
              <td className="px-4 py-3 text-sm text-slate-600">
                <span className="px-2 py-1 bg-[#57C7C2]/20 rounded text-xs font-mono text-[#2D366F]">#{a.ORDEN}</span>
                <span className="ml-2 text-xs text-slate-500">{a._bloqueLabel}</span>
              </td>
              <td className="px-4 py-3 text-sm text-slate-800 font-medium">{a._nombreCurso}</td>
              <td className="px-4 py-3 text-sm text-slate-600">{a._nombreDocente}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AsignacionesTable;
