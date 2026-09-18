import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const ESTADOS_ASISTENCIA = [
  { value: null,          label: '—', fullLabel: 'Sin marcar',  cls: 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200' },
  { value: 'ASISTIO',     label: 'A', fullLabel: 'Asistió',     cls: 'bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200' },
  { value: 'TARDANZA',    label: 'T', fullLabel: 'Tardanza',    cls: 'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200' },
  { value: 'FALTA',       label: 'F', fullLabel: 'Falta',       cls: 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200' },
  { value: 'JUSTIFICADO', label: 'J', fullLabel: 'Justificado', cls: 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200' },
];

function EstadoAsistenciaSelect({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPos, setMenuPos] = useState(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const estadoActual = ESTADOS_ASISTENCIA.find(e => e.value === value) || ESTADOS_ASISTENCIA[0];

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const menuHeight = ESTADOS_ASISTENCIA.length * 40 + 12;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < menuHeight + 8 && rect.top > menuHeight;
    setMenuPos({
      top: openUp ? rect.top - menuHeight - 4 : rect.bottom + 4,
      left: Math.min(rect.left, window.innerWidth - 170),
      openUp,
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        buttonRef.current && !buttonRef.current.contains(e.target) &&
        (!menuRef.current || !menuRef.current.contains(e.target))
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      updatePosition();
      document.addEventListener('keydown', handleEscape);
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        document.removeEventListener('keydown', handleEscape);
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen, updatePosition]);

  return (
    <div className="relative inline-block" ref={buttonRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-10 h-8 rounded-lg text-sm font-bold border flex items-center justify-center gap-0.5 transition-all hover:scale-105 active:scale-95 shadow-sm ${estadoActual.cls}`}
        title={estadoActual.fullLabel}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span>{estadoActual.label}</span>
        <svg
          className={`w-3 h-3 opacity-60 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu — portal para no quedar recortado por el overflow del modal */}
      {isOpen && menuPos && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[60] bg-white rounded-xl shadow-2xl border border-gray-200 py-1.5 min-w-[150px] animate-in fade-in duration-150"
          style={{
            top: menuPos.top,
            left: menuPos.left,
            transformOrigin: menuPos.openUp ? 'bottom' : 'top',
          }}
          role="listbox"
        >
          {ESTADOS_ASISTENCIA.map((e) => (
            <button
              key={e.value ?? '__null__'}
              type="button"
              onClick={() => {
                onChange(e.value);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                value === e.value ? 'bg-gray-50 font-semibold' : ''
              }`}
              role="option"
              aria-selected={value === e.value}
            >
              <span className={`w-7 h-7 rounded-md text-xs font-bold border flex items-center justify-center shadow-sm ${e.cls}`}>
                {e.label}
              </span>
              <span className="text-gray-700 whitespace-nowrap">{e.fullLabel}</span>
              {value === e.value && (
                <svg className="w-4 h-4 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

export { EstadoAsistenciaSelect, ESTADOS_ASISTENCIA };
