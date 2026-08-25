import React from 'react';

export function Header({ docente, onVolver }) {
  const nombreCompleto = `${docente.APELLIDO_PATERNO || ''} ${docente.APELLIDO_MATERNO || ''}, ${docente.NOMBRES || ''}`.trim();
  const iniciales = `${docente.NOMBRES?.[0] || ''}${docente.APELLIDO_PATERNO?.[0] || ''}`.toUpperCase();

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button
          onClick={onVolver}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-gray-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Docentes
        </button>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
        <span className="text-sm font-semibold text-gray-800">{nombreCompleto}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-50 flex items-center justify-center text-blue-600 font-bold text-2xl shadow-sm">
          {iniciales || '?'}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{nombreCompleto}</h2>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-gray-500">DNI: {docente.DNI || '—'}</span>
            <span className="text-gray-300">·</span>
            <span className="text-sm text-gray-500">{docente.PLAZAS_COUNT} {docente.PLAZAS_COUNT === 1 ? 'curso' : 'cursos'} asignados</span>
          </div>
        </div>
      </div>
    </div>
  );
}
