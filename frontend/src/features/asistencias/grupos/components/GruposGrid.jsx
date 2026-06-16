import React from 'react';
import { GrupoCard } from './GrupoCard';

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

export function GruposGrid({ grupos, loading, onSeleccionar }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (grupos.length === 0) {
    return (
      <p className="col-span-full text-center text-gray-400 py-16 text-sm">
        No hay grupos en este período
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {grupos.map(g => (
        <GrupoCard key={g.ID_GRUPO} grupo={g} onClick={onSeleccionar} />
      ))}
    </div>
  );
}
