import React from 'react';

export function GrupoCard({ grupo, onClick }) {
  return (
    <button
      onClick={() => onClick(grupo)}
      className="text-left bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-blue-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
    >
      <div className="h-1 w-full bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <span className="text-xl font-black text-gray-800 group-hover:text-blue-700 transition-colors tracking-tight">
            {grupo.CODIGO_GRUPO}
          </span>
          <div className="w-7 h-7 rounded-lg bg-gray-50 group-hover:bg-blue-50 flex items-center justify-center transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 group-hover:text-blue-400 transition-colors">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </div>
        <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">{grupo.NOMBRE_GRUPO}</p>
        <div className="flex flex-col gap-1.5">
          {grupo.NOMBRE_SEDE && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-400">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {grupo.NOMBRE_SEDE}
            </span>
          )}
          {grupo.NOMBRE_TURNO && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-400">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              {grupo.NOMBRE_TURNO}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
