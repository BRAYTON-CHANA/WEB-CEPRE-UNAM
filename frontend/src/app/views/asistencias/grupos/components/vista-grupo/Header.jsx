import React from 'react';

export function Header({ grupo, onVolver }) {
  return (
    <div className="flex items-center gap-2 mb-6 flex-wrap">
      <button
        onClick={onVolver}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-gray-700 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Grupos
      </button>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
      <span className="text-sm font-semibold text-gray-800">{grupo.CODIGO_GRUPO}</span>
      <div className="ml-2 flex items-center gap-2">
        {grupo.NOMBRE_SEDE && (
          <span className="text-xs bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full font-medium">
            {grupo.NOMBRE_SEDE}
          </span>
        )}
        {grupo.NOMBRE_TURNO && (
          <span className="text-xs bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full font-medium">
            {grupo.NOMBRE_TURNO}
          </span>
        )}
      </div>
    </div>
  );
}
