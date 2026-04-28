import React from 'react';
import { hexToRgba } from '../utils/colorHelpers';

const BlockPreview = ({ customBlocksWithTime, numCols, cursoAsignaciones, selectionMode, deleteMode, selectedBlocks, onToggleSelection, onDeleteBlock }) => {
  const isBlockSelected = (columna, bloque) => {
    const key = `${columna}-${bloque}`;
    return selectedBlocks.has(key);
  };
  const renderBlockCard = (block, idx, tieneCurso) => {
    const isBreak = block.type === 'break';
    return (
      <div
        key={idx}
        className={`
          w-full px-2 py-1 rounded border text-xs font-serif
          ${isBreak
            ? 'bg-gray-100 border-gray-300 text-gray-600 italic'
            : 'bg-[#57C7C2]/10 border-[#57C7C2]/30 text-[#2D366F]'}
        `}
      >
        <div className="font-medium truncate">
          {block.label}
          {!tieneCurso && !isBreak && ' (Libre)'}
        </div>
        <div className="text-[10px] opacity-75">{block.duration} min · {block.type}</div>
      </div>
    );
  };

  if (!customBlocksWithTime || customBlocksWithTime.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-500 italic bg-gray-50 rounded-lg border border-dashed border-gray-300">
        Sin bloques de horario disponibles para este grupo.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {/* Header con letras A, B, C */}
      <div
        className="grid mb-2"
        style={{ gridTemplateColumns: '100px repeat(auto-fit, minmax(140px, 1fr))' }}
      >
        <div className="border border-gray-200 p-2 bg-gray-50">
          <div className="text-xs font-bold text-gray-700 text-center font-serif">Hora</div>
        </div>
        {Array.from({ length: numCols }).map((_, ci) => {
          const letra = String.fromCharCode(65 + ci);
          return (
            <div key={ci} className="border border-[#57C7C2]/30 p-2 bg-gradient-to-br from-[#57C7C2]/10 to-white shadow-md">
              <div className="text-xs font-bold text-[#2D366F] text-center font-serif">
                {letra}
              </div>
            </div>
          );
        })}
      </div>

      {/* Filas de bloques */}
      <div>
        {customBlocksWithTime.map((block, idx) => (
          <div
            key={idx}
            className="grid"
            style={{ gridTemplateColumns: '100px repeat(auto-fit, minmax(140px, 1fr))' }}
          >
            {/* Columna hora */}
            <div className="border border-gray-200 p-2 bg-gray-50 flex items-center justify-center">
              <span className="text-[10px] text-gray-500 font-mono">
                {block.timeRange}
              </span>
            </div>

            {/* Columnas A, B, C para este bloque */}
            {Array.from({ length: numCols }).map((_, ci) => {
              const letra = String.fromCharCode(65 + ci);
              const key = `${letra}-${idx}`;
              const cursoAsignado = cursoAsignaciones[key];
              const isBreak = block.type === 'break';
              const isSelected = isBlockSelected(letra, idx);

              return (
                <div
                  key={ci}
                  className={`border border-[#57C7C2]/30 bg-gradient-to-br from-white to-[#57C7C2]/10 shadow-md flex items-center justify-center relative ${selectionMode && !isBreak ? 'cursor-pointer' : ''}`}
                  onClick={() => selectionMode && !isBreak && onToggleSelection(letra, idx)}
                >
                  {cursoAsignado ? (
                    <div
                      className="w-full flex flex-col items-center justify-center text-black px-2 py-1 rounded cursor-pointer transition-opacity shadow-lg shadow-gray-900/10 relative"
                      style={{
                        backgroundColor: hexToRgba(cursoAsignado.color, 0.25),
                        border: '2px solid',
                        borderColor: isSelected ? hexToRgba(cursoAsignado.color, 1) : hexToRgba(cursoAsignado.color, 0.5),
                        zIndex: 10,
                        backdropFilter: 'blur(4px)',
                        ...(isSelected && { boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.5)' })
                      }}
                      title={`${cursoAsignado.codigoCompartido} - ${cursoAsignado.nombreCurso}\nDocente: ${cursoAsignado.nombreDocente}`}
                    >
                      {deleteMode && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteBlock(letra, idx); }}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-white hover:bg-red-700 transition-colors z-20"
                          title="Eliminar asignación"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                      <span className="text-center whitespace-normal break-words text-xs font-bold">
                        {cursoAsignado.codigoCompartido} - {cursoAsignado.nombreCurso}
                      </span>
                      {cursoAsignado.nombreDocente && (
                        <span className="text-center whitespace-normal break-words text-xs">
                          Docente: {cursoAsignado.nombreDocente}
                        </span>
                      )}
                    </div>
                  ) : isBreak ? (
                    <div
                      className="w-full px-2 py-1 rounded border text-xs font-serif bg-gray-100 border-gray-300 text-gray-600 italic"
                    >
                      <div className="font-medium truncate text-center">
                        {block.label}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full">
                      <div
                        className={`
                          w-full px-2 py-1 rounded border text-xs font-serif
                          ${isSelected ? 'bg-[#57C7C2]/30 border-[#2D366F]' : 'bg-[#57C7C2]/10 border-[#57C7C2]/30 text-[#2D366F]'}
                        `}
                      >
                        <div className="font-medium truncate text-center">
                          {block.label} (Libre)
                        </div>
                        <div className="text-[10px] opacity-75 text-center">{block.duration} min · {block.type}</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlockPreview;
