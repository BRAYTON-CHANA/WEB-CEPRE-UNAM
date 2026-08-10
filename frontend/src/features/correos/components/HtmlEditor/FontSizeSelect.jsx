import React, { useEffect, useRef, useState } from 'react';
import { MIN_FONT_SIZE, MAX_FONT_SIZE } from '@/features/correos/constants/editor';
import { ChevronDownIcon } from '@/features/correos/components/CorreoIcons';

const FontSizeSelect = ({ options, value, onSelect, disabled, onOpen }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [draftValue, setDraftValue] = useState(value);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const blurTimeoutRef = useRef(null);

  useEffect(() => {
    setDraftValue(value);
  }, [value]);

  const applyValue = (raw) => {
    const num = parseInt(raw, 10);
    if (!Number.isNaN(num) && num >= MIN_FONT_SIZE && num <= MAX_FONT_SIZE) {
      onSelect(num);
      setDraftValue(String(num));
    } else {
      setDraftValue(value || '');
    }
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyValue(draftValue);
      inputRef.current?.blur();
    }
  };

  const handleBlur = () => {
    blurTimeoutRef.current = setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setDraftValue(value || '');
        setIsOpen(false);
      }
    }, 150);
  };

  const handleOptionClick = (size) => {
    clearTimeout(blurTimeoutRef.current);
    applyValue(String(size));
  };

  const toggleOpen = () => {
    onOpen?.();
    setIsOpen(o => !o);
  };

  return (
    <div ref={containerRef} className="relative" onMouseDown={(e) => { e.stopPropagation(); onOpen?.(); }}>
      <div className="flex items-center h-7 border border-gray-300 rounded bg-white overflow-hidden">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={draftValue}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9]/g, '');
            setDraftValue(raw);
          }}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onMouseDown={(e) => { e.stopPropagation(); onOpen?.(); }}
          disabled={disabled}
          placeholder="Tamaño"
          className="w-14 px-2 text-xs text-gray-700 outline-none disabled:opacity-50"
        />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={toggleOpen}
          disabled={disabled}
          className="px-1 h-full hover:bg-gray-100 text-gray-500 disabled:opacity-50"
          title="Tamaños predefinidos"
        >
          <ChevronDownIcon className="w-3 h-3" />
        </button>
      </div>
      {isOpen && (
        <div className="absolute z-10 mt-1 w-20 max-h-48 overflow-y-auto bg-white border border-gray-300 rounded shadow-lg">
          {options.map(size => (
            <button
              key={size}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleOptionClick(size)}
              className="w-full px-2 py-1.5 text-xs text-left text-gray-700 hover:bg-gray-100"
            >
              {size}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FontSizeSelect;
