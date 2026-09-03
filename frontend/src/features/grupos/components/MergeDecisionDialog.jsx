import React, { useState } from 'react';

const formatTime = (t) => {
  if (!t) return '';
  return String(t).slice(0, 5);
};

/**
 * MergeDecisionDialog — modal que pregunta al usuario si unir sesiones adyacentes
 * o crear sesión independiente.
 *
 * Props:
 *   sesionesAdyacentes — array de { id_sesion, hora_inicio, hora_fin, duracion_minutos, num_bloques }
 *   onConfirm  — (decisiones: [{ id_sesion, unir }]) => void
 *   onCancel   — () => void
 *   saving     — boolean
 */
function MergeDecisionDialog({ sesionesAdyacentes, onConfirm, onCancel, saving }) {
  // Default: todas en "Sí, unir"
  const [decisiones, setDecisiones] = useState(() => {
    if (!sesionesAdyacentes) return {};
    const init = {};
    sesionesAdyacentes.forEach(s => { init[s.id_sesion] = true; });
    return init;
  });

  const toggle = (idSesion) => {
    setDecisiones(prev => ({ ...prev, [idSesion]: !prev[idSesion] }));
  };

  const handleConfirm = () => {
    const result = (sesionesAdyacentes || []).map(s => ({
      id_sesion: s.id_sesion,
      unir: !!decisiones[s.id_sesion]
    }));
    onConfirm(result);
  };

  if (!sesionesAdyacentes || sesionesAdyacentes.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Sesiones adyacentes detectadas</h3>
              <p className="text-xs text-gray-500 mt-0.5">Los bloques seleccionados son contiguos a sesiones existentes del mismo curso</p>
            </div>
          </div>
        </div>

        {/* Advertencia */}
        <div className="mx-6 mt-4 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-amber-800">
              Al unir, se <span className="font-semibold">eliminarán las sesiones existentes</span> y se crearán <span className="font-semibold">nuevas sesiones combinadas</span> con todos los bloques agrupados por contigüidad.
            </p>
          </div>
        </div>

        {/* Lista de sesiones */}
        <div className="px-6 py-4 space-y-3 max-h-60 overflow-y-auto">
          {sesionesAdyacentes.map((s, idx) => (
            <div
              key={s.id_sesion}
              className={`rounded-lg border p-3 transition-colors cursor-pointer ${
                decisiones[s.id_sesion]
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
              onClick={() => toggle(s.id_sesion)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {formatTime(s.hora_inicio)} – {formatTime(s.hora_fin)}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {s.num_bloques} bloque{s.num_bloques > 1 ? 's' : ''} · {s.duracion_minutos} min
                  </div>
                </div>
                <div className={`w-10 h-6 rounded-full transition-colors flex items-center ${
                  decisiones[s.id_sesion] ? 'bg-green-500' : 'bg-gray-300'
                }`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    decisiones[s.id_sesion] ? 'translate-x-4' : 'translate-x-0.5'
                  }`} />
                </div>
              </div>
              <div className={`text-xs font-medium mt-2 ${
                decisiones[s.id_sesion] ? 'text-green-700' : 'text-gray-500'
              }`}>
                {decisiones[s.id_sesion] ? '✓ Unir con esta sesión' : 'Crear independiente'}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors disabled:opacity-40"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-white" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

export default MergeDecisionDialog;
