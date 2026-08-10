import React, { useEffect, useRef, useState } from 'react';

const APPEAR_THRESHOLD = 15;
const DISAPPEAR_THRESHOLD = 15;

const LABELS = {
  addColLeft: 'Agregar columna a la izquierda',
  addColRight: 'Agregar columna a la derecha',
  addRowAbove: 'Agregar fila arriba',
  addRowBelow: 'Agregar fila abajo',
};

const TableEdgeHandles = ({ table, editorRef, hoveredCell, mousePos, onAdd }) => {
  const [activeHandle, setActiveHandle] = useState(null);
  const activeHandleRef = useRef(activeHandle);

  useEffect(() => {
    activeHandleRef.current = activeHandle;
  }, [activeHandle]);

  useEffect(() => {
    if (!table || !editorRef?.current) {
      setActiveHandle(null);
      return;
    }

    const update = () => {
      const editorRect = editorRef.current.getBoundingClientRect();
      const tableRect = table.getBoundingClientRect();

      // Si hay un handle activo, mantenerlo hasta que el mouse supere el radio de desaparición.
      const current = activeHandleRef.current;
      if (current) {
        const absLeft = current.position.left + editorRect.left;
        const absTop = current.position.top + editorRect.top;
        const dist = Math.hypot(mousePos.clientX - absLeft, mousePos.clientY - absTop);
        if (dist > DISAPPEAR_THRESHOLD) {
          setActiveHandle(null);
        }
        return;
      }

      if (!hoveredCell) return;

      const cellRect = hoveredCell.getBoundingClientRect();
      const isFirstRow = Math.abs(cellRect.top - tableRect.top) < 1;
      const isLastRow = Math.abs(cellRect.bottom - tableRect.bottom) < 1;
      const isFirstCol = Math.abs(cellRect.left - tableRect.left) < 1;
      const isLastCol = Math.abs(cellRect.right - tableRect.right) < 1;

      const candidates = [];

      if (isFirstRow) {
        // Esquina superior-izquierda → columna a la izquierda.
        candidates.push({
          action: 'addColLeft',
          cell: hoveredCell,
          position: { top: tableRect.top, left: cellRect.left },
        });
        // Esquina superior-derecha → columna a la derecha.
        candidates.push({
          action: 'addColRight',
          cell: hoveredCell,
          position: { top: tableRect.top, left: cellRect.right },
        });
      } else if (isFirstCol) {
        // Esquina superior-izquierda (no primera fila) → fila arriba (realmente abajo de la celda de arriba).
        candidates.push({
          action: 'addRowAbove',
          cell: hoveredCell,
          position: { top: cellRect.top, left: tableRect.left },
        });
      } else if (isLastCol) {
        // Esquina superior-derecha (no primera fila) → fila arriba.
        candidates.push({
          action: 'addRowAbove',
          cell: hoveredCell,
          position: { top: cellRect.top, left: tableRect.right },
        });
      }

      if (isLastRow) {
        // Esquina inferior-izquierda (no primera columna) → columna a la izquierda.
        if (!isFirstCol) {
          candidates.push({
            action: 'addColLeft',
            cell: hoveredCell,
            position: { top: tableRect.bottom, left: cellRect.left },
          });
        }
        // Esquina inferior-derecha (no última columna) → columna a la derecha.
        if (!isLastCol) {
          candidates.push({
            action: 'addColRight',
            cell: hoveredCell,
            position: { top: tableRect.bottom, left: cellRect.right },
          });
        }
      }

      if (isFirstCol) {
        // Esquina inferior-izquierda → fila abajo.
        candidates.push({
          action: 'addRowBelow',
          cell: hoveredCell,
          position: { top: cellRect.bottom, left: tableRect.left },
        });
      } else if (isLastCol) {
        // Esquina inferior-derecha → fila abajo.
        candidates.push({
          action: 'addRowBelow',
          cell: hoveredCell,
          position: { top: cellRect.bottom, left: tableRect.right },
        });
      }

      if (candidates.length === 0) return;

      const withDistances = candidates.map(c => ({
        ...c,
        dist: Math.hypot(mousePos.clientX - c.position.left, mousePos.clientY - c.position.top),
      }));

      const inRange = withDistances.filter(c => c.dist <= APPEAR_THRESHOLD);
      if (inRange.length === 0) return;

      const closest = inRange.sort((a, b) => a.dist - b.dist)[0];

      setActiveHandle({
        action: closest.action,
        cell: closest.cell,
        position: {
          top: closest.position.top - editorRect.top,
          left: closest.position.left - editorRect.left,
        },
      });
    };

    update();
  }, [table, editorRef, hoveredCell, mousePos]);

  if (!activeHandle) return null;

  return (
    <button
      type="button"
      onClick={() => onAdd(activeHandle.action, activeHandle.cell)}
      onMouseDown={(e) => e.preventDefault()}
      title={LABELS[activeHandle.action]}
      className="absolute z-20 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white border border-gray-400 text-black rounded-full shadow-sm flex items-center justify-center text-[10px] pointer-events-auto hover:bg-gray-50 hover:shadow-lg hover:shadow-gray-400/60 focus:outline-none"
      style={{ top: activeHandle.position.top, left: activeHandle.position.left }}
    >
      +
    </button>
  );
};

export default TableEdgeHandles;
