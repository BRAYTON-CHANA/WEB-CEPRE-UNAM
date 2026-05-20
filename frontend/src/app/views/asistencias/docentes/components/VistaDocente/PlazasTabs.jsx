import React from 'react';

export function PlazasTabs({ plazas, plazaActiva, onChange }) {
  if (plazas.length === 0) return null;

  // Agrupar plazas por curso para mostrar tabs únicos
  const cursosUnicos = [...new Map(plazas.map(p => [p.ID_CURSO, p])).values()];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-2 shadow-sm flex gap-2 flex-wrap">
      {cursosUnicos.map(p => (
        <button
          key={p.ID_PLAZA_DOCENTE}
          onClick={() => onChange(p.ID_PLAZA_DOCENTE)}
          className={`relative flex flex-col items-start px-4 py-2.5 rounded-xl text-left transition-all ${
            plazaActiva === p.ID_PLAZA_DOCENTE
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <span className="text-sm font-semibold leading-tight">{p.NOMBRE_CURSO}</span>
          <span className={`text-xs mt-0.5 leading-tight ${
            plazaActiva === p.ID_PLAZA_DOCENTE ? 'text-blue-200' : 'text-gray-400'
          }`}>
            {p.CODIGO_CURSO || 'Sin código'}
          </span>
        </button>
      ))}
    </div>
  );
}
