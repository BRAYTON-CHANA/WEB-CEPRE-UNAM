import React from 'react';
import { FONTS } from '@/features/correos/constants/editor';

const FontSelect = ({ value, onChange, onSaveRange, disabled }) => (
  <select
    value={value}
    onMouseDown={(e) => { e.stopPropagation(); onSaveRange(); }}
    onChange={(e) => { const font = e.target.value; if (font) onChange(font); }}
    disabled={disabled}
    className="h-7 px-2 text-xs border border-gray-300 rounded bg-white text-gray-700 disabled:opacity-50"
    title="Fuente"
  >
    <option value="" disabled>Fuente</option>
    {FONTS.map(f => (
      <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
    ))}
  </select>
);

export default FontSelect;
