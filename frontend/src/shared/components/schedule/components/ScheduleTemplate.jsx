import React, { useState } from 'react';

const DEFAULT_DAY_LABELS = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
  7: 'Domingo'
};

const getDayName = (val, dayLabels) => {
  if (val === null || val === undefined || val === '') return null;
  const num = Number(val);
  if (isNaN(num)) return String(val);
  return dayLabels[num] || `Día ${num}`;
};

const hexToRgba = (hex, alpha) => {
  if (!hex || !hex.startsWith('#')) return `rgba(100,100,100,${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * ScheduleTemplate - muestra plantilla de horario como tabla
 *
 * @param {Array}   blocks          - bloques [{ timeRange, label, key, orden }]
 * @param {Array}   matrix          - MATRIZ_DIAS 2D, cada fila = nivel de header
 * @param {Object}  dayLabels       - map dia numero -> nombre
 * @param {Object}  cellEvents      - Record<"colIdx-bloqueOrden", { label, color, idProgramacion, idBloque, idPlanAcademicoCurso }>
 * @param {boolean} selectionMode   - habilita clic en celdas vacías para seleccionar
 * @param {boolean} deleteMode      - muestra botones × en todos los eventos
 * @param {Set}     selectedCells   - Set de keys "colIdx-bloqueOrden" seleccionadas
 * @param {Function} onCellToggle   - (colIdx, bloqueOrden) => void
 * @param {Function} onCellDelete   - (cellEvent) => void
 */
const ScheduleTemplate = ({
  blocks = [],
  matrix = [],
  dayLabels = DEFAULT_DAY_LABELS,
  cellEvents = {},
  columnDates = [],
  selectionMode = false,
  deleteMode = false,
  selectedCells = new Set(),
  onCellToggle = null,
  onCellDelete = null
}) => {
  const [pendingDelete, setPendingDelete] = useState(null);

  const headerRows = matrix.length;
  const colCount = headerRows > 0 && Array.isArray(matrix[0]) ? matrix[0].length : 0;

  const getCellKey = (colIndex, bloqueOrden) => `${colIndex}-${bloqueOrden}`;

  const handleDeleteClick = (e, event) => {
    e.stopPropagation();
    setPendingDelete(event);
  };

  const handleConfirmDelete = () => {
    if (pendingDelete && onCellDelete) onCellDelete(pendingDelete);
    setPendingDelete(null);
  };

  const handleCancelDelete = () => setPendingDelete(null);

  if (colCount === 0) {
    return (
      <div className="overflow-auto bg-white rounded-lg border border-gray-200">
        <div className="p-8 text-center text-gray-400 text-sm">
          No hay posiciones configuradas en la plantilla
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Modal de confirmación de eliminación */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={handleCancelDelete} />
          <div className="relative bg-white rounded-xl shadow-2xl p-6 w-80 border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Eliminar asignación</p>
                <p className="text-xs text-gray-500 mt-0.5">{pendingDelete.label}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5">¿Confirmas que deseas quitar este curso de la celda?</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors shadow-sm"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-auto bg-white rounded-lg border border-gray-200">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th
                rowSpan={columnDates.length > 0 ? 2 : 1}
                className="bg-slate-50 p-3 text-xs font-medium text-slate-600 border border-slate-200 border-r-2 border-slate-300 sticky top-0 left-0 z-20 w-28 align-middle"
              >
                Bloque
              </th>
              {Array.from({ length: colCount }, (_, colIndex) => (
                <th
                  key={colIndex}
                  className="bg-slate-50 p-3 border-b border-slate-200 border-r border-slate-300 sticky top-0 z-10 min-w-[100px]"
                >
                  {headerRows > 1 ? (
                    <div className="flex flex-col gap-1">
                      {matrix.map((row, rowIdx) => (
                        <span key={rowIdx} className="text-xs font-medium text-slate-700">
                          {getDayName(row[colIndex], dayLabels) || '\u00a0'}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs font-medium text-slate-700">
                      {getDayName(matrix[0][colIndex], dayLabels) || '\u00a0'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
            {columnDates.length > 0 && (
              <tr>
                {Array.from({ length: colCount }, (_, colIndex) => (
                  <th
                    key={colIndex}
                    className="bg-blue-50 px-2 py-1.5 border-b border-r border-slate-200 min-w-[100px]"
                  >
                    <div className="flex flex-wrap gap-x-1.5 gap-y-0.5 justify-center">
                      {(columnDates[colIndex] || []).map(f => (
                        <span key={f} className="text-[10px] text-blue-500 font-medium whitespace-nowrap">{f}</span>
                      ))}
                    </div>
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {blocks.length === 0 ? (
              <tr>
                <td colSpan={colCount + 1} className="p-8 text-center text-gray-400 text-sm border border-slate-200">
                  No hay bloques definidos
                </td>
              </tr>
            ) : blocks.map((block, blockIndex) => {
              const isBreak = block.type === 'break';
              return (
                <tr key={block.key || `b-${blockIndex}`} className={isBreak ? 'bg-gray-50' : ''}>
                  <td className="bg-white p-3 text-xs border border-slate-200 border-r-2 border-slate-300 w-28">
                    {block.label && (
                      <div className="text-slate-700 font-medium mb-1 truncate" title={block.label}>
                        {block.label}
                      </div>
                    )}
                    <div className="font-mono text-slate-500 leading-tight">
                      {block.timeRange}
                    </div>
                  </td>

                  {isBreak ? (
                    <td
                      colSpan={colCount}
                      className="border-b border-r border-slate-200 bg-gray-50 text-center py-2"
                    >
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-full px-3 py-1">
                        ☕ Break
                      </span>
                    </td>
                  ) : Array.from({ length: colCount }, (_, colIndex) => {
                    const cellKey = getCellKey(colIndex, block.orden);
                    const event = cellEvents[cellKey];
                    const isSelected = selectedCells.has(cellKey);
                    const canClick = selectionMode && !event;
                    return (
                      <td
                        key={colIndex}
                        onClick={() => canClick && onCellToggle && onCellToggle(colIndex, block.orden)}
                        className={[
                          'p-0 border-b border-r border-slate-200 min-w-[100px] relative overflow-hidden',
                          canClick ? 'cursor-pointer bg-blue-50' : '',
                          isSelected ? 'bg-emerald-100 ring-2 ring-inset ring-emerald-400' : 'bg-white'
                        ].join(' ')}
                      >
                        <div className="min-h-[72px] w-full" />
                        {event ? (
                          <div
                            className="absolute inset-0 flex flex-col items-center justify-center px-2 py-1 text-black shadow-md z-10"
                            style={{
                              backgroundColor: hexToRgba(event.color, 0.25),
                              border: '2px solid rgba(0,0,0,0.55)',
                              backdropFilter: 'blur(4px)'
                            }}
                          >
                            {onCellDelete && (
                              <button
                                onClick={(e) => handleDeleteClick(e, event)}
                                className={[
                                  'absolute top-1 right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-white z-20 shadow transition-colors',
                                  deleteMode ? 'opacity-100' : 'opacity-0 pointer-events-none'
                                ].join(' ')}
                                title="Eliminar asignación"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                            <span className="text-xs font-bold text-center whitespace-normal break-words leading-tight text-black">
                              {event.label}
                            </span>
                            {event.group && (
                              <span className="text-[10px] text-center whitespace-normal break-words leading-tight text-black/70 mt-0.5">
                                {event.group}
                              </span>
                            )}
                            {event.description && (
                              <span className="text-[10px] text-center whitespace-normal break-words leading-tight text-black/60 mt-0.5 italic">
                                {event.description}
                              </span>
                            )}
                          </div>
                        ) : isSelected ? (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-emerald-600 text-xs font-medium">✓</span>
                          </div>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default ScheduleTemplate;
