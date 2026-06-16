import React from 'react';

export function SedeTabs({ sedes, sedeActiva, onChange, totalPorSede }) {
  return (
    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1.5 shadow-sm overflow-x-auto">
      {sedes.map(sede => (
        <button
          key={sede.ID_SEDE}
          onClick={() => onChange(sede.ID_SEDE)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            sedeActiva === sede.ID_SEDE
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          {sede.NOMBRE_SEDE || `Sede ${sede.ID_SEDE}`}
          <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
            sedeActiva === sede.ID_SEDE ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
          }`}>
            {totalPorSede[sede.ID_SEDE] || 0}
          </span>
        </button>
      ))}
    </div>
  );
}
