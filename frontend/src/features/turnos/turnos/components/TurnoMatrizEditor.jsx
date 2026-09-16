import React, { useState, useRef } from 'react';
import { nombreDia, fechaCorta } from '@/features/turnos/turnos/utils/generarMatriz';

/**
 * TurnoMatrizEditor — editor visual de MATRIZ_DIAS (string[][] con nulls).
 * Cada fila = semana académica, cada columna = un espacio/día.
 * - Drag & drop entre celdas: intercambia valores (swap; a vacío = mover).
 * - Click en card: edición inline con input date. × vacía a null.
 * - Toolbar: agregar/quitar semanas (filas) y espacios (columnas).
 */
export default function TurnoMatrizEditor({ value, onChange, disabled = false }) {
  const matrix = Array.isArray(value) ? value : [];
  const numCols = matrix[0]?.length || 0;

  const [dragging, setDragging] = useState(null);      // {r, c}
  const [dragOver, setDragOver] = useState(null);      // {r, c}
  const [flash, setFlash] = useState([]);              // [{r,c}]
  const [editing, setEditing] = useState(null);        // {r, c}
  const flashTimer = useRef(null);

  const commit = (m) => onChange?.(m);

  const swapCells = (from, to) => {
    if (!from || !to || (from.r === to.r && from.c === to.c)) return;
    const m = matrix.map(row => [...row]);
    [m[from.r][from.c], m[to.r][to.c]] = [m[to.r][to.c], m[from.r][from.c]];
    commit(m);

    // Flash en las dos celdas intercambiadas
    setFlash([{ r: from.r, c: from.c }, { r: to.r, c: to.c }]);
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash([]), 600);
  };

  const setCell = (r, c, v) => {
    const m = matrix.map(row => [...row]);
    m[r][c] = v || null;
    commit(m);
  };

  const addRow = () => commit([...matrix, Array.from({ length: numCols || 1 }, () => null)]);
  const removeRow = () => { if (matrix.length > 1) commit(matrix.slice(0, -1)); };
  const addCol = () => commit(matrix.map(row => [...row, null]));
  const removeCol = () => { if (numCols > 1) commit(matrix.map(row => row.slice(0, -1))); };

  const isFlash = (r, c) => flash.some(f => f.r === r && f.c === c);
  const isDragOver = (r, c) => dragOver && dragOver.r === r && dragOver.c === c;
  const isDragging = (r, c) => dragging && dragging.r === r && dragging.c === c;
  const isEditing = (r, c) => editing && editing.r === r && editing.c === c;

  const cellKey = (r, c) => `${r}-${c}`;

  if (matrix.length === 0) return null;

  return (
    <div>
      {/* Flash animation keyframes */}
      <style>{`
        @keyframes turno-cell-flash {
          0% { background-color: #dbeafe; box-shadow: 0 0 0 2px #3b82f6; }
          100% { background-color: transparent; box-shadow: none; }
        }
      `}</style>

      {/* Toolbar */}
      {!disabled && (
        <div className="flex items-center gap-3 mb-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-gray-500 mr-1">Semanas</span>
            <button type="button" onClick={addRow}
              className="px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-200 hover:bg-blue-100 transition-colors">
              + Agregar
            </button>
            <button type="button" onClick={removeRow} disabled={matrix.length <= 1}
              className="px-2 py-1 bg-red-50 text-red-700 rounded border border-red-200 hover:bg-red-100 disabled:opacity-40 transition-colors">
              − Quitar
            </button>
          </div>
          <div className="w-px h-4 bg-gray-300" />
          <div className="flex items-center gap-1">
            <span className="text-gray-500 mr-1">Espacios</span>
            <button type="button" onClick={addCol}
              className="px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-200 hover:bg-blue-100 transition-colors">
              + Agregar
            </button>
            <button type="button" onClick={removeCol} disabled={numCols <= 1}
              className="px-2 py-1 bg-red-50 text-red-700 rounded border border-red-200 hover:bg-red-100 disabled:opacity-40 transition-colors">
              − Quitar
            </button>
          </div>
          <span className="ml-auto text-gray-400 italic hidden sm:inline">
            Arrastra una fecha sobre otra para intercambiarla
          </span>
        </div>
      )}

      {/* Grilla completa (sin scroll interno; el modal scrollea) */}
      <div className="overflow-x-auto">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="p-1" />
              {Array.from({ length: numCols }, (_, c) => (
                <th key={c} className="p-1 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  Día {c + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, r) => (
              <tr key={r}>
                <td className="p-1 pr-2 text-xs font-semibold text-gray-500 whitespace-nowrap align-middle">
                  Sem {r + 1}
                </td>
                {row.map((cell, c) => (
                  <td key={c} className="p-1 align-top">
                    {isEditing(r, c) ? (
                      <input
                        type="date"
                        autoFocus
                        defaultValue={cell || ''}
                        onBlur={e => { setCell(r, c, e.target.value); setEditing(null); }}
                        onKeyDown={e => {
                          if (e.key === 'Escape') setEditing(null);
                          if (e.key === 'Enter') { setCell(r, c, e.target.value); setEditing(null); }
                        }}
                        className="w-36 px-2 py-2 text-sm border border-blue-400 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    ) : (
                      <div
                        draggable={!disabled}
                        onDragStart={e => {
                          setDragging({ r, c });
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragEnd={() => { setDragging(null); setDragOver(null); }}
                        onDragOver={e => {
                          if (disabled) return;
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          setDragOver({ r, c });
                        }}
                        onDragLeave={() => {
                          setDragOver(prev => (prev && prev.r === r && prev.c === c ? null : prev));
                        }}
                        onDrop={e => {
                          e.preventDefault();
                          swapCells(dragging, { r, c });
                          setDragging(null);
                          setDragOver(null);
                        }}
                        onClick={() => !disabled && setEditing({ r, c })}
                        title={disabled ? undefined : 'Click para editar · arrastra para intercambiar'}
                        style={isFlash(r, c) ? { animation: 'turno-cell-flash 0.6s ease-out' } : undefined}
                        className={`
                          group relative w-36 select-none rounded-lg border px-2 py-2 transition-all duration-150
                          ${cell
                            ? 'bg-white border-gray-200 shadow-sm hover:border-blue-300 hover:shadow'
                            : 'bg-gray-50 border-dashed border-gray-300 hover:border-blue-300 hover:bg-blue-50/40'}
                          ${!disabled ? 'cursor-grab active:cursor-grabbing' : ''}
                          ${isDragging(r, c) ? 'opacity-40 scale-95' : ''}
                          ${isDragOver(r, c) ? 'ring-2 ring-blue-400 border-blue-400 scale-105' : ''}
                        `}
                      >
                        {cell ? (
                          <>
                            <div className="text-[10px] font-semibold uppercase tracking-widest text-blue-600">
                              {nombreDia(cell)}
                            </div>
                            <div className="text-sm font-semibold text-gray-900 leading-tight">
                              {fechaCorta(cell)}
                            </div>
                          </>
                        ) : (
                          <div className="py-2 text-center text-xs text-gray-400 italic">Vacío</div>
                        )}

                        {/* Vaciar celda */}
                        {!disabled && cell && (
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); setCell(r, c, null); }}
                            className="absolute top-1 right-1 w-4 h-4 hidden group-hover:flex items-center justify-center rounded-full bg-gray-200 text-gray-500 hover:bg-red-100 hover:text-red-600 text-[10px] leading-none"
                            title="Vaciar"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
