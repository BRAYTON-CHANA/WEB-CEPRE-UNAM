import React from 'react';
import { PlazaCard } from './PlazaCard';

function SkeletonCard() {
  return (
    <div className="h-32 bg-white border border-gray-100 rounded-2xl animate-pulse overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-gray-200 to-gray-100 w-full" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-100 rounded-lg w-2/3" />
        <div className="h-3.5 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
      </div>
    </div>
  );
}

export function PlazasGrid({ plazas, loading, onSeleccionar }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (plazas.length === 0) {
    return (
      <p className="col-span-full text-center text-gray-400 py-16 text-sm">
        No tienes plazas asignadas en este período
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {plazas.map(p => (
        <PlazaCard key={p.ID_PLAZA_DOCENTE} plaza={p} onClick={onSeleccionar} />
      ))}
    </div>
  );
}
