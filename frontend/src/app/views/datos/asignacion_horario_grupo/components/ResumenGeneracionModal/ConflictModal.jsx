import React from 'react';

/**
 * Modal para mostrar conflictos de asignación
 */
const ConflictModal = ({ conflictos, onCancel, onConfirm, loading }) => {
  if (!conflictos || conflictos.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#2D366F] to-[#57C7C2] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Conflictos detectados</h3>
              <p className="text-sm text-white/80">{conflictos.length} {conflictos.length === 1 ? 'registro' : 'registros'} ya existen</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-4 text-sm text-slate-600">
            Las siguientes asignaciones ya existen en la base de datos. ¿Deseas sobreescribir los registros existentes?
          </div>

          <div className="max-h-60 overflow-y-auto rounded-lg border border-[#2D366F]/20 bg-[#2D366F]/5">
            <table className="min-w-full divide-y divide-[#2D366F]/10">
              <thead className="bg-[#2D366F]/10">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-bold text-[#2D366F] uppercase">Fecha</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-[#2D366F] uppercase">Curso</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-[#2D366F] uppercase">Bloque</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2D366F]/10">
                {conflictos.map((c, i) => (
                  <tr key={i} className="hover:bg-[#2D366F]/5">
                    <td className="px-3 py-2 text-sm text-slate-800">{c.nueva.FECHA}</td>
                    <td className="px-3 py-2 text-sm text-slate-700">{c.nueva._nombreCurso}</td>
                    <td className="px-3 py-2 text-sm text-slate-600 font-mono">#{c.nueva.ORDEN}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-[#2D366F] to-[#57C7C2] text-white hover:from-[#3a4289] hover:to-[#6dd9d4] disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Procesando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Sobreescribir
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConflictModal;
