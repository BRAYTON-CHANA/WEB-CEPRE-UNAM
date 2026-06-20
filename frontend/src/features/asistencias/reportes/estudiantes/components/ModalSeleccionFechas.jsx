import React, { useState, useMemo, useEffect } from 'react';

const fmtFechaLabel = (fechaStr) => {
  if (!fechaStr) return '';
  const s = String(fechaStr).split('T')[0];
  if (s.includes('-')) {
    const [y, m, d] = s.split('-');
    return `${d}/${m}/${y}`;
  }
  return s;
};

export function ModalSeleccionFechas({ grupo, asistencias, onConfirm, onClose }) {
  const fechasUnicas = useMemo(() => {
    const set = new Set();
    const arr = [];
    for (const row of (asistencias || [])) {
      const f = String(row.FECHA || '').split('T')[0];
      if (f && !set.has(f)) {
        set.add(f);
        arr.push(f);
      }
    }
    return arr.sort();
  }, [asistencias]);

  const [seleccionadas, setSeleccionadas] = useState(() => new Set(fechasUnicas));

  useEffect(() => {
    setSeleccionadas(new Set(fechasUnicas));
  }, [fechasUnicas]);

  const toggleFecha = (f) => {
    setSeleccionadas(prev => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });
  };

  const seleccionarTodo = () => setSeleccionadas(new Set(fechasUnicas));
  const desmarcarTodo = () => setSeleccionadas(new Set());

  const handleConfirm = () => {
    if (seleccionadas.size === 0) return;
    onConfirm(new Set(seleccionadas));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Seleccionar días</h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[280px]">
              {grupo?.NOMBRE_GRUPO || grupo?.CODIGO_GRUPO || 'Grupo'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Acciones rápidas */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-50">
          <button
            onClick={seleccionarTodo}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
          >
            Seleccionar todo
          </button>
          <span className="text-gray-300">·</span>
          <button
            onClick={desmarcarTodo}
            className="text-xs font-semibold text-gray-400 hover:text-gray-600 hover:underline transition-colors"
          >
            Desmarcar todo
          </button>
          <span className="ml-auto text-xs text-gray-400">
            {seleccionadas.size} / {fechasUnicas.length} días
          </span>
        </div>

        {/* Lista de fechas */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
          {fechasUnicas.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">No hay sesiones para este grupo</p>
          ) : (
            fechasUnicas.map(f => (
              <label
                key={f}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors select-none"
              >
                <input
                  type="checkbox"
                  checked={seleccionadas.has(f)}
                  onChange={() => toggleFecha(f)}
                  className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-800">{fmtFechaLabel(f)}</span>
              </label>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={seleccionadas.size === 0}
            className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Exportar ({seleccionadas.size} días)
          </button>
        </div>
      </div>
    </div>
  );
}
