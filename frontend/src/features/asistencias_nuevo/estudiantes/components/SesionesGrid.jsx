import React from 'react';
import { SesionCard } from './SesionCard';

function SkeletonCard() {
  return (
    <div className="h-28 bg-white border border-gray-100 rounded-2xl animate-pulse overflow-hidden flex">
      <div className="w-16 bg-gray-100" />
      <div className="p-4 space-y-3 flex-1">
        <div className="h-4 bg-gray-100 rounded-lg w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-1/3" />
      </div>
    </div>
  );
}

export function SesionesGrid({ sesiones, loading, onSeleccionar, emptyMessage = 'Este grupo no tiene sesiones programadas', restringirHorario = false, ahora = new Date() }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (sesiones.length === 0) {
    return (
      <p className="col-span-full text-center text-gray-400 py-16 text-sm">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {sesiones.map(s => (
        <SesionCard
          key={s.ID_SESION}
          sesion={s}
          onClick={onSeleccionar}
          restringirHorario={restringirHorario}
          ahora={ahora}
        />
      ))}
    </div>
  );
}
