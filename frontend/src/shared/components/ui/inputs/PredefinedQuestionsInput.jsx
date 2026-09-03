import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { db } from '@/shared/api';

/**
 * PredefinedQuestionsInput
 *
 * Input genérico para responder preguntas predefinidas, agrupadas por clasificación.
 * Reutilizable en wizard de postulaciones.
 *
 * Estructura emitida via onChange(name, value):
 * {
 *   contextLabel: "CONTRATADO",
 *   grupos: {
 *     "DATOS_PERSONALES": {
 *       preguntas: [{ id, nombre, obligatorio, tipoRespuesta, opciones, respuesta }]
 *     }
 *   }
 * }
 *
 * Carga de predefinidos:
 *  - loadPredefined(formData) async fn → { contextLabel, grupos } | null
 *
 * Modo "create":
 *  - Carga predefinidos desde loadPredefined al cambiar triggerField.
 *
 * Modo "edit":
 *  - No consulta DB. Renderiza el JSON existente (snapshot).
 */

const DEFAULT_LABELS = {
  predefinido: 'Pregunta',
  cargando: 'Cargando preguntas...',
  sinTrigger: 'Seleccione un elemento para cargar las preguntas.',
  sinPredefinidos: 'No hay preguntas configuradas para este contexto.',
  contextBadgePrefix: '',
  obligatorio: 'Obligatorio',
  responder: 'Responder',
};

const TIPO_LABELS = {
  texto: 'Texto libre',
  si_no: 'Sí / No',
  opcion_multiple: 'Opción múltiple',
};

const PredefinedQuestionsInput = ({
  name,
  value,
  onChange,
  label,
  disabled = false,
  mode = 'create',
  loadPredefined = null,
  triggerField: triggerFieldProp = null,
  labels: labelsOverride = {},
  formData = {}
}) => {
  const L = { ...DEFAULT_LABELS, ...labelsOverride };

  const [preguntas, setPreguntas] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [contextLabel, setContextLabel] = useState(null);

  const lastTriggerValueRef = useRef(null);

  const triggerField = triggerFieldProp || null;
  const triggerValue = triggerField ? formData?.[triggerField] : null;

  // Parsear value inicial (modo edit)
  useEffect(() => {
    if (mode === 'edit') {
      let parsed = null;
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        parsed = value;
      } else if (typeof value === 'string' && value.trim()) {
        try { parsed = JSON.parse(value); } catch { parsed = null; }
      }
      setPreguntas(parsed?.grupos || null);
      setContextLabel(parsed?.contextLabel || null);
    }
  }, [mode, value]);

  // Cargar predefinidos en modo create
  useEffect(() => {
    if (mode !== 'create') return;
    if (!loadPredefined) return;

    const currentTrigger = triggerField ? triggerValue : 'global';
    if (lastTriggerValueRef.current === currentTrigger) return;
    lastTriggerValueRef.current = currentTrigger;

    if (triggerField && !triggerValue) {
      setPreguntas(null);
      setContextLabel(null);
      setLoadError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    loadPredefined(formData)
      .then(data => {
        if (cancelled) return;
        if (!data || !data.grupos) {
          setPreguntas(null);
          setContextLabel(data?.contextLabel || null);
          setLoading(false);
          return;
        }
        setPreguntas(data.grupos);
        setContextLabel(data.contextLabel || null);
        setLoading(false);
      })
      .catch(err => {
        if (cancelled) return;
        setLoadError(err.message || 'Error al cargar preguntas');
        setPreguntas(null);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [mode, loadPredefined, triggerField, triggerValue]); // eslint-disable-line react-hooks/exhaustive-deps

  // Emitir cambios
  const emitChange = useCallback((newGrupos) => {
    const payload = {
      contextLabel,
      grupos: newGrupos
    };
    onChange(name, payload);
  }, [contextLabel, name, onChange]);

  // Actualizar respuesta de una pregunta
  const handleRespuestaChange = useCallback((clas, idx, respuesta) => {
    const newGrupos = { ...preguntas };
    const grupo = { ...newGrupos[clas] };
    const newPreguntas = [...grupo.preguntas];
    newPreguntas[idx] = { ...newPreguntas[idx], respuesta };
    grupo.preguntas = newPreguntas;
    newGrupos[clas] = grupo;
    setPreguntas(newGrupos);
    emitChange(newGrupos);
  }, [preguntas, emitChange]);

  // Renderizar input según tipo de respuesta
  const renderInput = (pregunta, clas, idx) => {
    const { tipoRespuesta, opciones, respuesta } = pregunta;
    const inputId = `preg-${clas}-${idx}`;
    const isDisabled = disabled;

    if (tipoRespuesta === 'texto') {
      return (
        <textarea
          id={inputId}
          value={respuesta || ''}
          onChange={e => handleRespuestaChange(clas, idx, e.target.value)}
          disabled={isDisabled}
          rows={3}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
          placeholder="Escriba su respuesta..."
        />
      );
    }

    if (tipoRespuesta === 'si_no') {
      return (
        <div className="flex items-center gap-4">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={inputId}
              value="Sí"
              checked={respuesta === 'Sí'}
              onChange={() => handleRespuestaChange(clas, idx, 'Sí')}
              disabled={isDisabled}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Sí</span>
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={inputId}
              value="No"
              checked={respuesta === 'No'}
              onChange={() => handleRespuestaChange(clas, idx, 'No')}
              disabled={isDisabled}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">No</span>
          </label>
        </div>
      );
    }

    if (tipoRespuesta === 'opcion_multiple') {
      const opts = Array.isArray(opciones) ? opciones : [];
      const modoSeleccion = pregunta.modoSeleccion || 'unica';
      const isMultiple = modoSeleccion === 'multiple';
      const inputType = isMultiple ? 'checkbox' : 'radio';
      // Para selección múltiple, respuesta es un array; para única, un string
      const respArr = Array.isArray(respuesta) ? respuesta : [];
      const isChecked = (opt) => isMultiple ? respArr.includes(opt) : respuesta === opt;

      const toggleMultiple = (opt) => {
        const newArr = respArr.includes(opt)
          ? respArr.filter(o => o !== opt)
          : [...respArr, opt];
        handleRespuestaChange(clas, idx, newArr);
      };

      return (
        <div className="space-y-2">
          {opts.map((opt, i) => (
            <label key={i} className="inline-flex items-center gap-2 cursor-pointer mr-4">
              <input
                type={inputType}
                name={inputId}
                value={opt}
                checked={isChecked(opt)}
                onChange={() => isMultiple ? toggleMultiple(opt) : handleRespuestaChange(clas, idx, opt)}
                disabled={isDisabled}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{opt}</span>
            </label>
          ))}
        </div>
      );
    }

    return null;
  };

  const hasPreguntas = preguntas && Object.keys(preguntas).length > 0;

  return (
    <div className="space-y-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      )}

      {contextLabel && (
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
          {L.contextBadgePrefix}{contextLabel}
        </div>
      )}

      {loading && (
        <div className="text-center py-8 text-gray-500 text-sm">
          <div className="inline-block w-5 h-5 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-2" />
          <p>{L.cargando}</p>
        </div>
      )}

      {loadError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{loadError}</p>
        </div>
      )}

      {!loading && !loadError && triggerField && !triggerValue && (
        <div className="text-center py-8 text-gray-400 text-sm">
          <p>{L.sinTrigger}</p>
        </div>
      )}

      {!loading && !loadError && (!triggerField || triggerValue) && !hasPreguntas && (
        <div className="text-center py-8 text-gray-400 text-sm">
          <p>{L.sinPredefinidos}</p>
        </div>
      )}

      {!loading && !loadError && hasPreguntas && (
        <div className="space-y-6">
          {Object.entries(preguntas).map(([clas, grupo]) => (
            <div key={clas} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{clas}</h4>
              </div>
              <div className="divide-y divide-gray-100">
                {grupo.preguntas.map((p, idx) => (
                  <div key={idx} className="px-4 py-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-800">
                          {p.nombre}
                          {p.obligatorio && (
                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 bg-red-50 text-red-600 text-[10px] rounded font-medium border border-red-200">
                              {L.obligatorio}
                            </span>
                          )}
                        </label>
                        {p.descripcion && (
                          <p className="text-xs text-gray-500 mt-0.5">{p.descripcion}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-2">
                      {renderInput(p, clas, idx)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PredefinedQuestionsInput;
