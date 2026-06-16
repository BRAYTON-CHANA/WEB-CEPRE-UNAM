import React from 'react';
import { DocenteCard } from './DocenteCard';

function SkeletonCard() {
  return (
    <div className="h-36 bg-white border border-gray-100 rounded-2xl animate-pulse overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-gray-200 to-gray-100 w-full" />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-100 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-100 rounded-lg w-3/4" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
          </div>
        </div>
        <div className="h-3 bg-gray-100 rounded w-1/3" />
      </div>
    </div>
  );
}

export function DocentesGrid({ docentes, loading, onSeleccionar }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (docentes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <p className="text-gray-400 font-medium text-sm">No hay docentes con cursos asignados en este período y sede</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {docentes.map(d => (
        <DocenteCard key={d.ID_DOCENTE} docente={d} onClick={onSeleccionar} />
      ))}
    </div>
  );
}
