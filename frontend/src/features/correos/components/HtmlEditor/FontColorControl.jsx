import React, { useRef, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { THEME_COLORS, STANDARD_COLORS } from '@/features/correos/constants/editor';
import { FontColorIcon, ChevronDownIcon, PaletteIcon } from '@/features/correos/components/CorreoIcons';

const FontColorControl = ({ color, onColorChange, onApply, disabled, onSaveRange }) => {
  const [open, setOpen] = useState(false);
  const [draftColor, setDraftColor] = useState(null);
  const colorInputRef = useRef(null);

  const handleOpenChange = (o) => {
    if (o) onSaveRange?.();
    setOpen(o);
    if (o) setDraftColor(null);
  };

  const handleApply = (c) => {
    onColorChange(c);
    onApply?.(c);
    setOpen(false);
  };

  const handleMoreColors = (e) => {
    e?.stopPropagation();
    colorInputRef.current?.click();
  };

  const effectiveColor = color || '#000000';

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <div className={`inline-flex items-center rounded overflow-hidden ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            onSaveRange?.();
          }}
          onClick={() => onApply(effectiveColor)}
          disabled={disabled}
          title="Color de fuente"
          className="p-1.5 hover:bg-gray-200 text-gray-600 disabled:cursor-not-allowed flex flex-col items-center gap-0.5"
        >
          <FontColorIcon color={effectiveColor} className="w-4 h-4" />
          <span
            className="w-4 h-1 rounded-sm"
            style={{ backgroundColor: effectiveColor }}
          />
        </button>
        <Popover.Trigger asChild>
          <button
            type="button"
            onMouseDown={() => onSaveRange?.()}
            disabled={disabled}
            title="Elegir color de fuente"
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
          className="z-50 p-2 bg-white border border-gray-200 rounded-lg shadow-lg outline-none w-56"
        >
          <div className="px-2 pb-1 space-y-3">
            <div>
              <p className="text-[10px] font-medium text-gray-500 mb-1.5">Colores del tema</p>
              <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${THEME_COLORS.length}, minmax(0, 1fr))` }}>
                {THEME_COLORS.map(col => (
                  <div key={col.name} className="flex flex-col gap-1">
                    {col.shades.map((shade, i) => (
                      <button
                        key={`${col.name}-${i}`}
                        type="button"
                        onClick={() => handleApply(shade)}
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
                    onClick={() => handleApply(c.value)}
                    title={c.name}
                    className="w-full aspect-square rounded-sm border border-gray-200 hover:ring-2 hover:ring-blue-400"
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleApply('transparent')}
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
                  onClick={() => handleApply(draftColor)}
                  className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Aceptar
                </button>
              </div>
            )}
          </div>
          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

export default FontColorControl;
