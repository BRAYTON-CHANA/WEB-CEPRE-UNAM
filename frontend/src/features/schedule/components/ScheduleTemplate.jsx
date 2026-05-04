import React from 'react';

const DEFAULT_DAY_LABELS = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Mi\u00e9rcoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'S\u00e1bado',
  7: 'Domingo'
};

const getDayName = (val, dayLabels) => {
  if (val === null || val === undefined || val === '') return null;
  const num = Number(val);
  if (isNaN(num)) return String(val);
  return dayLabels[num] || `D\u00eda ${num}`;
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
 * @param {Set}     selectedCells   - Set de keys "colIdx-bloqueOrden" seleccionadas
 * @param {Function} onCellToggle   - (colIdx, bloqueOrden) => void
 * @param {Function} onCellDelete   - (cellEvent) => void
 */
const ScheduleTemplate = ({
  blocks = [],
  matrix = [],
  dayLabels = DEFAULT_DAY_LABELS,
  cellEvents = {},
  selectionMode = false,
  selectedCells = new Set(),
  onCellToggle = null,
  onCellDelete = null
}) => {
  const headerRows = matrix.length;
  const colCount = headerRows > 0 && Array.isArray(matrix[0]) ? matrix[0].length : 0;

  if (colCount === 0) {
    return (
      <div className="overflow-auto bg-white rounded-lg border border-gray-200">
        <div className="p-8 text-center text-gray-400 text-sm">
          No hay posiciones configuradas en la plantilla
        </div>
      </div>
    );
  }

  const getCellKey = (colIndex, bloqueOrden) => `${colIndex}-${bloqueOrden}`;

  return (
    <div className="overflow-auto bg-white rounded-lg border border-gray-200">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="bg-slate-50 p-3 text-xs font-medium text-slate-600 border border-slate-200 border-r-2 border-slate-300 sticky top-0 left-0 z-20 w-28">
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
        </thead>
        <tbody>
          {blocks.length === 0 ? (
            <tr>
              <td colSpan={colCount + 1} className="p-8 text-center text-gray-400 text-sm border border-slate-200">
                No hay bloques definidos
              </td>
            </tr>
          ) : (
            blocks.map((block, blockIndex) => (
              <tr key={block.key || `b-${blockIndex}`}>
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
                {Array.from({ length: colCount }, (_, colIndex) => {
                  const cellKey = getCellKey(colIndex, block.orden);
                  const event = cellEvents[cellKey];
                  const isSelected = selectedCells.has(cellKey);
                  const canClick = selectionMode && !event;

                  return (
                    <td
                      key={colIndex}
                      onClick={() => canClick && onCellToggle && onCellToggle(colIndex, block.orden)}
                      className={[
                        'p-1 text-center text-xs border-b border-r border-slate-200 min-w-[100px] relative',
                        canClick ? 'cursor-pointer hover:bg-blue-50' : '',
                        isSelected ? 'bg-emerald-100 ring-2 ring-inset ring-emerald-400' : 'bg-white'
                      ].join(' ')}
                    >
                      {event ? (
                        <div
                          className="relative mx-auto rounded flex flex-col items-center justify-center px-2 py-1 min-h-[48px]"
                          style={{
                            backgroundColor: hexToRgba(event.color, 0.18),
                            border: `2px solid ${hexToRgba(event.color, 0.5)}`
                          }}
                        >
                          {onCellDelete && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onCellDelete(event); }}
                              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white z-10 shadow"
                              title="Eliminar asignación"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                          <span className="text-xs font-bold text-center break-words leading-tight" style={{ color: event.color }}>
                            {event.label}
                          </span>
                        </div>
                      ) : isSelected ? (
                        <div className="flex items-center justify-center min-h-[48px]">
                          <span className="text-emerald-600 text-xs font-medium">✓</span>
                        </div>
                      ) : (
                        <div className="min-h-[48px]">{'\u00a0'}</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ScheduleTemplate;
