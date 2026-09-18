import React from 'react';

export function PlazaCard({ plaza, onClick }) {
  const esVirtual = plaza.MODALIDAD === 'VIRTUAL';
  return (
    <button
      onClick={() => onClick(plaza)}
      className="text-left bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-[#25346A] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
    >
      <div className="h-1 w-full bg-gradient-to-r from-[#25346A] to-[#3d5296] opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <span className="text-base font-black text-gray-800 group-hover:text-[#25346A] transition-colors tracking-tight">
            {plaza.NOMBRE_CURSO || plaza.CODIGO_CURSO}
          </span>
          <div className="w-7 h-7 rounded-lg bg-gray-50 group-hover:bg-[#eef1f8] flex items-center justify-center transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 group-hover:text-[#5b6fae] transition-colors">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </div>
        {plaza.CODIGO_CURSO && (
          <p className="text-xs text-gray-500 mb-3">{plaza.CODIGO_CURSO}</p>
        )}
        <div className="flex flex-col gap-1.5">
          {plaza.NOMBRE_SEDE && (
            <span className={`inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-lg text-xs font-bold border ${
              esVirtual
                ? 'bg-violet-50 text-violet-700 border-violet-200'
                : 'bg-[#eef1f8] text-[#25346A] border-[#c9d3ea]'
            }`}>
              {esVirtual ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              )}
              {plaza.NOMBRE_SEDE}
            </span>
          )}
          {plaza.IDENTIFICADOR_DOCENTE && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-400">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <circle cx="8" cy="10" r="2"/>
                <line x1="13" y1="8" x2="18" y2="8"/>
                <line x1="13" y1="12" x2="18" y2="12"/>
                <path d="M5 16c.6-1.5 1.7-2 3-2s2.4.5 3 2"/>
                <line x1="13" y1="16" x2="18" y2="16"/>
              </svg>
              {plaza.IDENTIFICADOR_DOCENTE}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
