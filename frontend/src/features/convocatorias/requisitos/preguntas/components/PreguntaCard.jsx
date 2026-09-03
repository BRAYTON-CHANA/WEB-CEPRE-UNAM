import React, { useState } from 'react';
import PreguntaEditForm from './PreguntaEditForm';
import PreviewInput from './PreviewInput';
import PreguntaBadges from './PreguntaBadges';

/**
 * PreguntaCard — card individual de una pregunta con preview del input.
 * Al editar, se transforma en formulario inline (PreguntaEditForm).
 */
function PreguntaCard({ pregunta, onSaveInline, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) {
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = async (payload) => {
    await onSaveInline?.(pregunta, payload);
    setIsEditing(false);
  };

  const handleCancelEdit = () => setIsEditing(false);

  // Modo edición: renderizar formulario inline
  if (isEditing) {
    return (
      <div className="bg-white rounded-xl border border-blue-200 shadow-md overflow-hidden">
        <PreguntaEditForm
          pregunta={pregunta}
          onSave={handleSave}
          onCancel={handleCancelEdit}
        />
      </div>
    );
  }

  const {
    NOMBRE, DESCRIPCION, ORDEN, TIPO_RESPUESTA, OBLIGATORIO, ACTIVO,
    TIPO_TEXTO, PERMITE_OTROS, MODO_SELECCION
  } = pregunta;

  const isInactivo = ACTIVO === false || ACTIVO === 'false' || ACTIVO === 0;

  return (
    <div className="flex items-stretch gap-2">
      {/* Flechas de reordenamiento (fuera del card, a la izquierda) */}
      <div className="flex flex-col items-center justify-center gap-1 shrink-0">
        <button
          onClick={() => onMoveUp?.()}
          disabled={isFirst}
          className={`p-1.5 rounded-md transition-colors ${
            isFirst
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200 bg-gray-100'
          }`}
          title="Mover arriba"
          aria-label="Mover arriba"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
        <button
          onClick={() => onMoveDown?.()}
          disabled={isLast}
          className={`p-1.5 rounded-md transition-colors ${
            isLast
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200 bg-gray-100'
          }`}
          title="Mover abajo"
          aria-label="Mover abajo"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* Card principal */}
      <div
        className={`flex-1 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden transition-opacity ${
          isInactivo ? 'opacity-60' : ''
        }`}
      >
        {/* Header del card */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold flex-shrink-0">
                  {ORDEN ?? '?'}
                </span>
                <h4 className="text-sm font-semibold text-gray-900 leading-snug">
                  {NOMBRE}
                </h4>
                {OBLIGATORIO && (
                  <span className="inline-flex items-center px-1.5 py-0.5 bg-red-50 text-red-600 text-[10px] rounded font-medium border border-red-200">
                    Obligatorio
                  </span>
                )}
                {isInactivo && (
                  <span className="inline-flex items-center px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded font-medium border border-gray-200">
                    Inactivo
                  </span>
                )}
                <PreguntaBadges
                  TIPO_RESPUESTA={TIPO_RESPUESTA}
                  TIPO_TEXTO={TIPO_TEXTO}
                  PERMITE_OTROS={PERMITE_OTROS}
                  MODO_SELECCION={MODO_SELECCION}
                />
              </div>
              {DESCRIPCION && (
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{DESCRIPCION}</p>
              )}
            </div>

            {/* Botones de acción */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
                title="Editar pregunta"
                aria-label="Editar pregunta"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button
                onClick={onDelete}
                className="p-1.5 rounded-md text-red-600 hover:bg-red-50 transition-colors"
                title="Eliminar pregunta"
                aria-label="Eliminar pregunta"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Preview del input (como lo vería el docente) */}
        <div className="px-5 py-3 bg-gray-50/50">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">
            Vista previa del campo
          </p>
          <PreviewInput pregunta={pregunta} />
        </div>
      </div>
    </div>
  );
}

export default PreguntaCard;
