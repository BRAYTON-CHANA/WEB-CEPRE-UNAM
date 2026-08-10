import React, { useRef, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { HIGHLIGHT_COLORS } from '@/features/correos/constants/editor';
import { MarkerIcon, ChevronDownIcon } from '@/features/correos/components/CorreoIcons';

const HighlightControl = ({ color, onColorChange, onApply, disabled, onSaveRange }) => {
  const [open, setOpen] = useState(false);
  const colorInputRef = useRef(null);

  const handleApply = (newColor) => {
    onColorChange(newColor);
    onApply(newColor);
    setOpen(false);
  };

  const handleMoreColors = () => {
    colorInputRef.current?.click();
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <div
        className={`inline-flex items-center rounded overflow-hidden ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            onSaveRange();
          }}
          onClick={() => onApply(color)}
          disabled={disabled}
          title="Resaltar"
          className="p-1.5 hover:bg-gray-200 text-gray-600 disabled:cursor-not-allowed flex flex-col items-center gap-0.5"
        >
          <MarkerIcon className="w-4 h-4" />
          <span
            className="w-4 h-1 rounded-sm"
            style={{ backgroundColor: color }}
          />
        </button>
        <Popover.Trigger asChild>
          <button
            type="button"
            onMouseDown={() => onSaveRange()}
            disabled={disabled}
            title="Elegir color de resaltado"
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
          className="z-50 p-2 bg-white border border-gray-200 rounded-lg shadow-lg outline-none"
        >
          <div className="grid grid-cols-4 gap-1.5 mb-2">
            {HIGHLIGHT_COLORS.map(c => (
              <button
                key={c.value}
                type="button"
                onClick={() => handleApply(c.value)}
                title={c.name}
                className={`w-6 h-6 rounded border ${c.value === 'transparent' ? 'bg-white border-gray-300' : 'border-transparent'}`}
                style={{ backgroundColor: c.value === 'transparent' ? undefined : c.value }}
              >
                {c.value === 'transparent' && (
                  <span className="block w-full h-0.5 bg-red-400 rotate-45" />
                )}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleMoreColors}
            className="w-full px-2 py-1 text-xs text-left text-gray-600 hover:bg-gray-100 rounded"
          >
            Más colores…
          </button>
          <input
            ref={colorInputRef}
            type="color"
            onChange={(e) => handleApply(e.target.value)}
            className="sr-only"
          />
          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

export default HighlightControl;
