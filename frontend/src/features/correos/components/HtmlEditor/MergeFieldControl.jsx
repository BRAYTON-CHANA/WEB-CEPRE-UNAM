import React, { useState, useRef, useEffect } from 'react';
import { MergeFieldIcon } from '@/features/correos/components/CorreoIcons';
import ToolbarButton from './ToolbarButton';

const MergeFieldControl = ({ mergeFields, onInsert, disabled }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  if (!mergeFields || mergeFields.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <ToolbarButton
        onClick={() => setOpen(prev => !prev)}
        disabled={disabled}
        label="Campos personalizados"
        icon={<MergeFieldIcon className="w-4 h-4" />}
      />
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-[180px] py-1">
          <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
            Campos del view
          </div>
          {mergeFields.map(({ field, label }) => (
            <button
              key={field}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onInsert(field);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              {label}
              <span className="ml-2 text-[10px] text-gray-400 font-mono">{`{{${field}}}`}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MergeFieldControl;
