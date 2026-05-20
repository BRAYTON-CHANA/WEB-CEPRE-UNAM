import React from 'react';

export function CursoTabs({ cursos, cursoActivo, onChange }) {
  if (cursos.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-2 shadow-sm flex gap-2 flex-wrap">
      {cursos.map(c => (
        <button
          key={c.ID_CURSO}
          onClick={() => onChange(c.ID_CURSO)}
          className={`relative flex flex-col items-start px-4 py-2.5 rounded-xl text-left transition-all ${
            cursoActivo === c.ID_CURSO
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <span className="text-sm font-semibold leading-tight">{c.NOMBRE_CURSO}</span>
          <span className={`text-xs mt-0.5 leading-tight ${
            cursoActivo === c.ID_CURSO ? 'text-blue-200' : 'text-gray-400'
          }`}>
            {c.NOMBRE_AREA}
          </span>
        </button>
      ))}
    </div>
  );
}
