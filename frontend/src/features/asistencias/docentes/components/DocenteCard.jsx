import React from 'react';

export function DocenteCard({ docente, onClick }) {
  const nombreCompleto = `${docente.APELLIDO_PATERNO || ''} ${docente.APELLIDO_MATERNO || ''}, ${docente.NOMBRES || ''}`.trim();
  const iniciales = `${docente.NOMBRES?.[0] || ''}${docente.APELLIDO_PATERNO?.[0] || ''}`.toUpperCase();

  return (
    <button
      onClick={() => onClick(docente)}
      className="text-left bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-blue-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
    >
      <div className="h-1 w-full bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg">
            {iniciales || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-bold text-gray-800 group-hover:text-blue-700 transition-colors block truncate">
              {nombreCompleto}
            </span>
            <span className="text-xs text-gray-400 block">DNI: {docente.DNI || '—'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
            {docente.PLAZAS_COUNT} {docente.PLAZAS_COUNT === 1 ? 'curso' : 'cursos'}
          </span>
          <div className="w-7 h-7 rounded-lg bg-gray-50 group-hover:bg-blue-50 flex items-center justify-center transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 group-hover:text-blue-400 transition-colors">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </div>
      </div>
    </button>
  );
}
