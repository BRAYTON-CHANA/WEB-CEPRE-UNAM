import React from 'react';
import { TIPO_RESPUESTA_LABELS, TIPO_RESPUESTA_COLORS, TIPO_TEXTO_LABELS, MODO_SELECCION_LABELS } from '../config/tableConfig.jsx';

/**
 * PreguntaBadges — renderiza los badges de tipo de respuesta, sub-tipo de texto,
 * modo de selección (múltiple) y "Otros" para opción múltiple.
 * Reutilizado por PreguntaCard y PreguntaEditForm.
 *
 * @param {string} TIPO_RESPUESTA - 'texto' | 'si_no' | 'opcion_multiple'
 * @param {string} [TIPO_TEXTO] - 'libre' | 'entero' | 'float' (solo si TIPO_RESPUESTA='texto')
 * @param {boolean} [PERMITE_OTROS] - true si opción múltiple permite "Otros"
 * @param {string} [MODO_SELECCION] - 'unica' | 'multiple' (solo si TIPO_RESPUESTA='opcion_multiple')
 */
function PreguntaBadges({ TIPO_RESPUESTA, TIPO_TEXTO, PERMITE_OTROS, MODO_SELECCION }) {
  const tipoLabel = TIPO_RESPUESTA_LABELS[TIPO_RESPUESTA] || TIPO_RESPUESTA;
  const tipoColor = TIPO_RESPUESTA_COLORS[TIPO_RESPUESTA] || TIPO_RESPUESTA_COLORS.texto;
  const tipoTextoLabel = TIPO_RESPUESTA === 'texto' && TIPO_TEXTO
    ? TIPO_TEXTO_LABELS[TIPO_TEXTO] || TIPO_TEXTO
    : null;
  const modoMultiple = TIPO_RESPUESTA === 'opcion_multiple' && MODO_SELECCION === 'multiple';

  return (
    <>
      <span className={`inline-flex items-center px-2 py-0.5 text-[10px] rounded font-medium border ${tipoColor}`}>
        {tipoLabel}
      </span>
      {tipoTextoLabel && (
        <span className="inline-flex items-center px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] rounded font-medium border border-indigo-200">
          {tipoTextoLabel}
        </span>
      )}
      {modoMultiple && (
        <span className="inline-flex items-center px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[10px] rounded font-medium border border-amber-200">
          {MODO_SELECCION_LABELS.multiple}
        </span>
      )}
      {TIPO_RESPUESTA === 'opcion_multiple' && PERMITE_OTROS && (
        <span className="inline-flex items-center px-1.5 py-0.5 bg-teal-50 text-teal-600 text-[10px] rounded font-medium border border-teal-200">
          + Otros
        </span>
      )}
    </>
  );
}

export default PreguntaBadges;
