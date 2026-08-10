import React, { useRef, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import {
  TableIcon,
  RowAboveIcon,
  RowBelowIcon,
  ColLeftIcon,
  ColRightIcon,
  DeleteRowIcon,
  DeleteColIcon,
  MergeCellsIcon,
  SplitCellIcon,
  DeleteTableIcon,
  ChevronDownIcon,
  PaletteIcon,
} from '@/features/correos/components/CorreoIcons';
import { THEME_COLORS, STANDARD_COLORS } from '@/features/correos/constants/editor';

const MAX_GRID = 8;

const TableControl = ({ inTable, selectedCellCount = 0, selectedCellInfo, canSplit = false, onAction, onMergeSelected, onCellColor, disabled, onSaveRange }) => {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState({ rows: 0, cols: 0 });
  const [draftColor, setDraftColor] = useState(null);
  const colorInputRef = useRef(null);

  const handleOpenChange = (o) => {
    if (o) onSaveRange?.();
    setOpen(o);
    if (o) setDraftColor(null);
  };

  const handleInsert = () => {
    onAction('insert', { rows: hovered.rows || 1, cols: hovered.cols || 1 });
    setOpen(false);
  };

  const handleAction = (action) => {
    onAction(action);
    setOpen(false);
  };

  const handleCellColor = (color) => {
    onCellColor?.(color);
    setOpen(false);
  };

  const Btn = ({ icon, label, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className="flex items-center gap-1.5 w-full px-2 py-1.5 text-xs text-left text-gray-700 hover:bg-gray-100 rounded"
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <div className={`inline-flex rounded overflow-hidden ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); onSaveRange?.(); }}
          disabled={disabled}
          title="Tabla"
          className="p-1.5 hover:bg-gray-200 text-gray-600 disabled:cursor-not-allowed flex items-center"
        >
          <TableIcon className="w-4 h-4" />
        </button>
        <Popover.Trigger asChild>
          <button
            type="button"
            onMouseDown={() => onSaveRange?.()}
            disabled={disabled}
            title="Opciones de tabla"
            className="p-1.5 h-full hover:bg-gray-200 text-gray-600 disabled:cursor-not-allowed border-l border-gray-200"
          >
            <ChevronDownIcon className="w-3 h-3" />
          </button>
        </Popover.Trigger>
      </div>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="start"
          sideOffset={4}
          className="z-50 p-2 bg-white border border-gray-200 rounded-lg shadow-lg outline-none max-h-[320px] overflow-y-auto"
        >
          {!inTable ? (
            <div className="w-52 p-1">
              <div
                className="grid grid-cols-8 gap-0.5 mb-2"
                onMouseLeave={() => setHovered({ rows: 0, cols: 0 })}
              >
                {Array.from({ length: MAX_GRID * MAX_GRID }).map((_, i) => {
                  const r = Math.floor(i / MAX_GRID) + 1;
                  const c = (i % MAX_GRID) + 1;
                  const active = r <= hovered.rows && c <= hovered.cols;
                  return (
                    <div
                      key={i}
                      onMouseEnter={() => setHovered({ rows: r, cols: c })}
                      onClick={() => { setHovered({ rows: r, cols: c }); handleInsert(); }}
                      className={`w-4 h-4 border border-gray-300 rounded-sm cursor-pointer transition-colors duration-75 ${active ? 'bg-blue-500 border-blue-500' : 'bg-white hover:bg-gray-100'}`}
                    />
                  );
                })}
              </div>
              <p className="text-xs font-medium text-gray-600 text-center">
                {hovered.rows > 0 ? `${hovered.rows} × ${hovered.cols}` : 'Elegir tamaño'}
              </p>
            </div>
          ) : (
            <div className="w-56 space-y-1">
              <p className="text-xs font-medium text-gray-500 px-2 pt-1 pb-0.5">Fila</p>
              <Btn icon={<RowAboveIcon className="w-4 h-4" />} label="Fila arriba" onClick={() => handleAction('addRowAbove')} />
              <Btn icon={<RowBelowIcon className="w-4 h-4" />} label="Fila abajo" onClick={() => handleAction('addRowBelow')} />
              <Btn icon={<DeleteRowIcon className="w-4 h-4" />} label="Eliminar fila" onClick={() => handleAction('deleteRow')} />

              <div className="h-px bg-gray-200 my-1" />
              <p className="text-xs font-medium text-gray-500 px-2 pt-1 pb-0.5">Columna</p>
              <Btn icon={<ColLeftIcon className="w-4 h-4" />} label="Columna izquierda" onClick={() => handleAction('addColLeft')} />
              <Btn icon={<ColRightIcon className="w-4 h-4" />} label="Columna derecha" onClick={() => handleAction('addColRight')} />
              <Btn icon={<DeleteColIcon className="w-4 h-4" />} label="Eliminar columna" onClick={() => handleAction('deleteCol')} />

              <div className="h-px bg-gray-200 my-1" />
              <p className="text-xs font-medium text-gray-500 px-2 pt-1 pb-0.5">Celdas</p>
              {selectedCellInfo && selectedCellInfo.count > 0 && (
                <p className="px-2 py-0.5 text-[10px] font-medium text-blue-700 bg-blue-50 rounded mb-1">
                  {selectedCellInfo.label}
                </p>
              )}
              {selectedCellCount >= 2 ? (
                <Btn
                  icon={<MergeCellsIcon className="w-4 h-4" />}
                  label={`Combinar celdas (${selectedCellCount})`}
                  onClick={() => { onMergeSelected?.(); setOpen(false); }}
                />
              ) : (
                <p className="px-2 py-1 text-xs text-gray-400 italic">Arrastra entre celdas para seleccionar</p>
              )}
              {canSplit && (
                <Btn icon={<SplitCellIcon className="w-4 h-4" />} label="Dividir celda" onClick={() => handleAction('split')} />
              )}

              <div className="h-px bg-gray-200 my-1" />
              <p className="text-xs font-medium text-gray-500 px-2 pt-1 pb-0.5">Pintado</p>
              <div className="px-2 pb-1 space-y-3">
                {selectedCellCount === 0 && (
                  <p className="text-[10px] text-gray-500">Pintar celda actual</p>
                )}

                <div>
                  <p className="text-[10px] font-medium text-gray-500 mb-1.5">Colores del tema</p>
                  <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${THEME_COLORS.length}, minmax(0, 1fr))` }}>
                    {THEME_COLORS.map(col => (
                      <div key={col.name} className="flex flex-col gap-1">
                        {col.shades.map((shade, i) => (
                          <button
                            key={`${col.name}-${i}`}
                            type="button"
                            onClick={() => handleCellColor(shade)}
                            title={`${col.name}: ${shade}`}
                            className="w-full aspect-square rounded-sm border border-gray-200 hover:ring-2 hover:ring-blue-400"
                            style={{ backgroundColor: shade }}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-medium text-gray-500 mb-1.5">Colores estándar</p>
                  <div className="grid grid-cols-10 gap-1">
                    {STANDARD_COLORS.map(c => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => handleCellColor(c.value)}
                        title={c.name}
                        className="w-full aspect-square rounded-sm border border-gray-200 hover:ring-2 hover:ring-blue-400"
                        style={{ backgroundColor: c.value }}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCellColor('transparent')}
                  className="w-full px-2 py-1.5 text-xs text-left text-gray-600 hover:bg-gray-100 rounded border border-gray-200"
                >
                  Sin color
                </button>

                <label className="relative flex items-center gap-1.5 w-full px-2 py-1.5 text-xs text-left text-gray-600 hover:bg-gray-100 rounded border border-gray-200 cursor-pointer">
                  <PaletteIcon className="w-3.5 h-3.5" />
                  <span>Más colores…</span>
                  <input
                    ref={colorInputRef}
                    type="color"
                    defaultValue="#ffffff"
                    onChange={(e) => setDraftColor(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </label>

                {draftColor !== null && (
                  <div className="flex items-center gap-2 px-2 py-1.5 border border-gray-200 rounded bg-gray-50">
                    <span
                      className="w-5 h-5 rounded border border-gray-200"
                      style={{ backgroundColor: draftColor }}
                    />
                    <span className="text-xs text-gray-600 flex-1 truncate">{draftColor}</span>
                    <button
                      type="button"
                      onClick={() => handleCellColor(draftColor)}
                      className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Aceptar
                    </button>
                  </div>
                )}
              </div>

              <div className="h-px bg-gray-200 my-1" />
              <Btn icon={<DeleteTableIcon className="w-4 h-4" />} label="Eliminar tabla" onClick={() => handleAction('deleteTable')} />
            </div>
          )}
          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

export default TableControl;
