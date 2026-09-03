import React from 'react';

/**
 * LimitesLabel — etiqueta pequeña con los límites (mín/máx/máx caracteres).
 */
function LimitesLabel({ text }) {
  return <p className="mt-1.5 text-[10px] text-gray-400 font-medium">{text}</p>;
}

/**
 * PreviewInput — renderiza el preview del input según TIPO_RESPUESTA (todos disabled).
 * Reutilizado por PreguntaCard (modo vista) y PreguntaEditForm (preview en vivo).
 *
 * @param {Object} pregunta - { TIPO_RESPUESTA, OPCIONES, PERMITE_OTROS, TIPO_TEXTO, MIN_VALOR, MAX_VALOR, MAX_CARACTERES, MODO_SELECCION }
 */
function PreviewInput({ pregunta }) {
  const {
    TIPO_RESPUESTA, OPCIONES, PERMITE_OTROS,
    TIPO_TEXTO, MIN_VALOR, MAX_VALOR, MAX_CARACTERES, MODO_SELECCION
  } = pregunta;

  const limitesText = [];
  if (MIN_VALOR !== null && MIN_VALOR !== undefined && MIN_VALOR !== '') {
    limitesText.push(`mín: ${MIN_VALOR}`);
  }
  if (MAX_VALOR !== null && MAX_VALOR !== undefined && MAX_VALOR !== '') {
    limitesText.push(`máx: ${MAX_VALOR}`);
  }
  if (MAX_CARACTERES !== null && MAX_CARACTERES !== undefined && MAX_CARACTERES !== '') {
    limitesText.push(`máx ${MAX_CARACTERES} caracteres`);
  }
  const limitesLabel = limitesText.length > 0 ? limitesText.join(' · ') : null;

  if (TIPO_RESPUESTA === 'texto') {
    if (TIPO_TEXTO === 'entero') {
      return (
        <div>
          <input
            type="number"
            disabled
            step="1"
            placeholder="0"
            className="w-32 px-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50 text-gray-400 cursor-not-allowed"
          />
          {limitesLabel && <LimitesLabel text={limitesLabel} />}
        </div>
      );
    }
    if (TIPO_TEXTO === 'float') {
      return (
        <div>
          <input
            type="number"
            disabled
            step="0.01"
            placeholder="0.00"
            className="w-32 px-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50 text-gray-400 cursor-not-allowed"
          />
          {limitesLabel && <LimitesLabel text={limitesLabel} />}
        </div>
      );
    }
    return (
      <div>
        <textarea
          disabled
          rows={2}
          placeholder="Respuesta de texto libre..."
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50 text-gray-400 cursor-not-allowed"
        />
        {limitesLabel && <LimitesLabel text={limitesLabel} />}
      </div>
    );
  }

  if (TIPO_RESPUESTA === 'si_no') {
    return (
      <div className="flex items-center gap-4">
        <label className="inline-flex items-center gap-2">
          <input type="radio" disabled className="w-4 h-4 text-gray-300 border-gray-200" />
          <span className="text-sm text-gray-400">Sí</span>
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="radio" disabled className="w-4 h-4 text-gray-300 border-gray-200" />
          <span className="text-sm text-gray-400">No</span>
        </label>
      </div>
    );
  }

  if (TIPO_RESPUESTA === 'opcion_multiple') {
    const opts = Array.isArray(OPCIONES) ? OPCIONES : [];
    if (opts.length === 0 && !PERMITE_OTROS) {
      return <p className="text-xs text-gray-400 italic">Sin opciones configuradas</p>;
    }
    const inputType = MODO_SELECCION === 'multiple' ? 'checkbox' : 'radio';
    return (
      <div>
        <div className="space-y-1.5">
          {opts.map((opt, i) => (
            <label key={i} className="inline-flex items-center gap-2 mr-4">
              <input type={inputType} disabled className="w-4 h-4 text-gray-300 border-gray-200" />
              <span className="text-sm text-gray-400">{opt}</span>
            </label>
          ))}
          {PERMITE_OTROS && (
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-2">
                <input type={inputType} disabled className="w-4 h-4 text-gray-300 border-gray-200" />
                <span className="text-sm text-gray-400">Otros:</span>
              </label>
              <input
                type="text"
                disabled
                placeholder="Especifique..."
                className="flex-1 max-w-xs px-2 py-1 text-sm border border-gray-200 rounded bg-gray-50 text-gray-400 cursor-not-allowed"
              />
            </div>
          )}
        </div>
        {limitesLabel && <LimitesLabel text={limitesLabel} />}
      </div>
    );
  }

  return null;
}

export default PreviewInput;
export { LimitesLabel };
