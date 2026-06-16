import React from 'react';

export function GruposGrid({ grupos, grupoActivo, onChange }) {
  if (grupos.length === 0) return null;

  return (
    <div className="border-b border-gray-100 bg-gray-50/50 p-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider mr-2">Grupos:</span>
        {grupos.map(g => (
          <button
            key={g.ID_GRUPO}
            onClick={() => onChange(g.ID_GRUPO)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              grupoActivo === g.ID_GRUPO
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            {g.CODIGO_GRUPO}
          </button>
        ))}
      </div>
    </div>
  );
}
