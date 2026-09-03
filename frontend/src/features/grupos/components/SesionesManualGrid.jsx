import React from 'react';

const hexToRgba = (hex, alpha) => {
  if (!hex || !hex.startsWith('#')) return `rgba(100,100,100,${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const formatTime = (t) => {
  if (!t) return '';
  return String(t).slice(0, 5);
};

/**
 * SesionesManualGrid — grilla de bloques para un día específico.
 * Una sola columna de bloques (no matriz semanal).
 *
 * Props:
 *   bloquesDelDia    — array de bloques con info de ocupación
 *   selectedBloques  — Set de idSesionBloque seleccionados
 *   onBloqueToggle   — (idSesionBloque) => void
 *   selectionMode    — boolean (si está en modo selección)
 */
function SesionesManualGrid({ bloquesDelDia, selectedBloques, onBloqueToggle, selectionMode }) {
  if (!bloquesDelDia || bloquesDelDia.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400 text-sm">
        Selecciona un día para ver sus bloques
      </div>
    );
  }

  return (
    <div className="overflow-auto bg-white rounded-lg border border-gray-200">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="bg-[#2D366F] text-white px-3 py-2 text-xs font-bold uppercase tracking-wider whitespace-nowrap border border-[#2D366F] w-28">
              Bloque
            </th>
            <th className="bg-[#2D366F] text-white px-3 py-2 text-center border border-[#2D366F] min-w-[200px]">
              <div className="font-bold text-xs uppercase tracking-wider">Contenido</div>
            </th>
          </tr>
        </thead>
        <tbody>
          {bloquesDelDia.map((b, idx) => {
            const isSelected = selectedBloques.has(b.idSesionBloque);
            const canClick = selectionMode && b.seleccionable;

            return (
              <tr key={`b-${idx}`}>
                {/* Columna tiempo */}
                <td className="sticky left-0 z-10 bg-white p-3 text-xs border border-slate-200 border-r-2 border-slate-300 w-28 align-middle">
                  <div className="font-mono text-slate-500 leading-tight">
                    {formatTime(b.horaInicio)} – {formatTime(b.horaFin)}
                  </div>
                </td>

                {/* Break */}
                {b.tipo === 'break' ? (
                  <td className="border-b border-r border-slate-200 bg-gray-50 text-center py-2 min-w-[200px]">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-full px-3 py-1">
                      ☕ Break
                    </span>
                  </td>
                ) : b.ocupado ? (
                  /* Clase ocupada */
                  <td
                    className="p-0 border-b border-r border-slate-200 relative min-w-[200px] align-middle"
                    style={{ backgroundColor: hexToRgba(b.color || '#64748b', 0.20) }}
                  >
                    <div className="flex flex-col items-center justify-center h-full min-h-[72px] px-2 py-1.5 text-center">
                      <span className="text-xs font-semibold text-gray-900 leading-tight whitespace-normal break-words">
                        {b.curso}
                      </span>
                      <span className="text-[10px] text-gray-700 leading-tight mt-0.5 whitespace-normal break-words">
                        {b.docente || 'Sin docente'}
                      </span>
                      <span className="text-[10px] text-gray-500 leading-tight mt-1 font-mono">
                        {formatTime(b.horaInicio)} – {formatTime(b.horaFin)}
                      </span>
                    </div>
                  </td>
                ) : canClick ? (
                  /* Clase vacía seleccionable */
                  <td
                    onClick={() => onBloqueToggle(b.idSesionBloque)}
                    className={[
                      'p-0 border-b border-r border-slate-200 relative overflow-hidden min-w-[200px] cursor-pointer transition-colors',
                      isSelected ? 'bg-emerald-100 ring-2 ring-inset ring-emerald-400' : 'bg-blue-50 hover:bg-blue-100'
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-center h-full min-h-[72px]">
                      {isSelected ? (
                        <span className="text-emerald-600 text-xs font-medium">✓ Seleccionado</span>
                      ) : (
                        <span className="text-blue-400 text-xs">+ Disponible</span>
                      )}
                    </div>
                  </td>
                ) : (
                  /* Clase vacía no seleccionable */
                  <td className="p-0 border-b border-r border-slate-200 bg-white relative overflow-hidden min-w-[200px]">
                    <div className="min-h-[72px] w-full" />
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default SesionesManualGrid;
