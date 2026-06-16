import React from 'react';

export function GruposTabs({ grupos, grupoActivo, onSeleccionar }) {
  if (!grupos || grupos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay grupos con clases en esta fecha
      </div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
      {grupos.map((grupo) => {
        const activo = grupo.idGrupo === grupoActivo;
        return (
          <button
            key={grupo.idGrupo}
            onClick={() => onSeleccionar(grupo.idGrupo)}
            className={`
              flex-shrink-0 px-4 py-3 rounded-lg text-sm font-medium transition-all
              ${activo 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }
            `}
          >
            <div className="text-left">
              <div className="font-semibold">{grupo.codigoGrupo}</div>
              <div className={`text-xs ${activo ? 'text-blue-100' : 'text-gray-500'}`}>
                {grupo.nombreArea}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
