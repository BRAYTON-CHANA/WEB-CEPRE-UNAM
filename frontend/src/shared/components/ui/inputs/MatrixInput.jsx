import React, { useState, useEffect, useCallback } from 'react';

/*
 * MatrixInput - edita matriz 2D
 * select/text/number celdas
 * + / - filas y columnas
 */
const MatrixInput = ({
  name, value, onChange, label, disabled = false, required = false,
  rows = 1, cols = 1, cellType = 'text', cellOptions = [], allowNull = true
}) => {
  const initMatrix = (r, c) => Array.from({ length: r }, () =>
    Array.from({ length: c }, () => (allowNull ? null : '')));

  const parseValue = (val) => {
    if (!val) return initMatrix(rows, cols);
    if (Array.isArray(val)) return val.length > 0 ? val : initMatrix(rows, cols);
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : initMatrix(rows, cols);
      } catch { return initMatrix(rows, cols); }
    }
    return initMatrix(rows, cols);
  };

  const [matrix, setMatrix] = useState(() => parseValue(value));

  useEffect(() => { setMatrix(parseValue(value)); }, [value]);

  const notify = useCallback((m) => { onChange?.(name, m); }, [name, onChange]);

  const updateCell = (r, c, v) => {
    const updated = matrix.map((row, ri) => row.map((cell, ci) => (ri === r && ci === c ? v : cell)));
    setMatrix(updated); notify(updated);
  };

  const addRow = () => { const u = [...matrix, Array.from({ length: matrix[0]?.length || cols }, () => allowNull ? null : '')]; setMatrix(u); notify(u); };
  const removeRow = () => { if (matrix.length <= 1) return; const u = matrix.slice(0, -1); setMatrix(u); notify(u); };
  const addCol = () => { const u = matrix.map(row => [...row, allowNull ? null : '']); setMatrix(u); notify(u); };
  const removeCol = () => { if (!matrix[0] || matrix[0].length <= 1) return; const u = matrix.map(row => row.slice(0, -1)); setMatrix(u); notify(u); };

  /* ===== iconos ===== */
  const IconPlus = () => <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>;
  const IconMinus = () => <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4"/></svg>;
  const IconX = () => <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>;

  const renderCell = (cell, r, c) => {
    const v = cell !== null && cell !== undefined ? cell : '';

    if (cellType === 'select') {
      const isNull = cell === null || cell === undefined || cell === '';
      const selectValue = isNull ? '' : String(cell);
      return (
        <div className="relative">
          <select value={selectValue} onChange={e => {
            const raw = e.target.value;
            const val = raw === '' ? (allowNull ? null : '') : (isNaN(raw) ? raw : Number(raw));
            updateCell(r, c, val);
          }} disabled={disabled}
            className="w-full pr-6 pl-1 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 appearance-none bg-white">
            {allowNull && <option value="">—</option>}
            {cellOptions.filter(o => o.value !== null).map((o, i) => <option key={i} value={o.value}>{o.label}</option>)}
          </select>
          {/* X dentro del select */}
          {!isNull && allowNull && !disabled && (
            <button
              type="button"
              onClick={() => updateCell(r, c, null)}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-red-500 rounded transition-colors"
              title="Deseleccionar"
            >
              <IconX />
            </button>
          )}
        </div>
      );
    }

    if (cellType === 'number' || cellType === 'integer') return (
      <input type="number" value={v} disabled={disabled}
        onChange={e => updateCell(r, c, e.target.value === '' ? (allowNull ? null : '') : Number(e.target.value))}
        className="w-full px-1 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500" />);

    return <input type="text" value={v} disabled={disabled} onChange={e => updateCell(r, c, e.target.value)}
      className="w-full px-1 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500" />;
  };

  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>}

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full border-collapse"><tbody>
          {matrix.map((row, ri) => (
            <tr key={ri} className="border-b border-gray-200 last:border-b-0">
              {row.map((cell, ci) => (
                <td key={ci} className="p-1 border-r border-gray-200 last:border-r-0 min-w-[80px]">{renderCell(cell, ri, ci)}</td>
              ))}
            </tr>
          ))}
        </tbody></table>
      </div>

      {/* Botones reorganizados */}
      <div className="flex items-center gap-3 mt-2">
        {/* Grupo Filas */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 mr-1">Filas</span>
          <button type="button" onClick={addRow} disabled={disabled}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded border border-blue-200 hover:bg-blue-100 disabled:opacity-40 transition-colors">
            <IconPlus /> Agregar
          </button>
          <button type="button" onClick={removeRow} disabled={disabled || matrix.length <= 1}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-red-50 text-red-700 rounded border border-red-200 hover:bg-red-100 disabled:opacity-40 transition-colors">
            <IconMinus /> Quitar
          </button>
        </div>

        <div className="w-px h-4 bg-gray-300" />

        {/* Grupo Columnas */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 mr-1">Columnas</span>
          <button type="button" onClick={addCol} disabled={disabled}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded border border-blue-200 hover:bg-blue-100 disabled:opacity-40 transition-colors">
            <IconPlus /> Agregar
          </button>
          <button type="button" onClick={removeCol} disabled={disabled || !matrix[0] || matrix[0].length <= 1}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-red-50 text-red-700 rounded border border-red-200 hover:bg-red-100 disabled:opacity-40 transition-colors">
            <IconMinus /> Quitar
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatrixInput;
