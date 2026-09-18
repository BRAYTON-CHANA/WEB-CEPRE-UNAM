import React from 'react';

const MonitorIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
    <line x1="8" y1="21" x2="16" y2="21"/>
    <line x1="12" y1="17" x2="12" y2="21"/>
  </svg>
);

const PinIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

export function GrupoCard({ grupo, plazas, onClick }) {
  const plazasInfo = plazas || [];
  return (
    <button
      onClick={() => onClick?.(grupo)}
      className="text-left bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-[#25346A] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
    >
      <div className="h-1 w-full bg-gradient-to-r from-[#25346A] to-[#3d5296] opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <span className="text-xl font-black text-gray-800 group-hover:text-[#25346A] transition-colors tracking-tight">
            {grupo.CODIGO_GRUPO}
          </span>
          <div className="w-7 h-7 rounded-lg bg-gray-50 group-hover:bg-[#eef1f8] flex items-center justify-center transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 group-hover:text-[#5b6fae] transition-colors">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </div>
        <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">{grupo.NOMBRE_GRUPO}</p>
        <div className="flex flex-col gap-1.5">
          {grupo.NOMBRE_SEDE && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-400">
              {grupo.ID_SEDE == null ? (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              ) : (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              )}
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

        {/* Plaza(s) que dictan en este grupo (docente) */}
        {plazasInfo.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-2">
            {plazasInfo.map(p => {
              const esVirtual = p.MODALIDAD === 'VIRTUAL';
              return (
                <div key={p.ID_PLAZA_DOCENTE} className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-[#25346A] leading-snug">
                    {p.NOMBRE_CURSO || p.CODIGO_CURSO}
                  </span>
                  {p.IDENTIFICADOR_DOCENTE && (
                    <span className="text-[10px] text-gray-400 leading-none">
                      Plaza {p.IDENTIFICADOR_DOCENTE}
                    </span>
                  )}
                  {p.NOMBRE_SEDE && (
                    <span className={`inline-flex items-center gap-1.5 self-start px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                      esVirtual
                        ? 'bg-violet-50 text-violet-700 border-violet-200'
                        : 'bg-[#eef1f8] text-[#25346A] border-[#c9d3ea]'
                    }`}>
                      {esVirtual ? <MonitorIcon /> : <PinIcon />}
                      {p.NOMBRE_SEDE}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </button>
  );
}
