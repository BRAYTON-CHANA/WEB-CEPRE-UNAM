import React, { useMemo, useState, useCallback } from 'react';
import { useFormState } from '@/shared/components/form/hooks/useFormState';
import { useFormValidation } from '@/shared/components/form/hooks/useFormValidation';
import FormField from '@/shared/components/form/components/FormField';
import { evaluateHidden } from '@/shared/components/form/utils/conditionEvaluator';
import { preguntasFormFields, preguntasValidation } from '@/features/convocatorias/requisitos/preguntas/config/formConfig';
import {
  buildPayloadConRestricciones,
  createPregunta,
  getNextOrdenForCondicion
} from '@/features/convocatorias/requisitos/preguntas/services/convocatoriaPreguntasService';
import PreviewInput from './PreviewInput';

// Condiciones laborales disponibles
const CONDICIONES = [
  { value: 'CONTRATADO', label: 'Contratado' },
  { value: 'EXTERNO', label: 'Externo' },
  { value: 'ORDINARIO', label: 'Ordinario' }
];

// Secciones del formulario (mismo patrón que PreguntaEditForm)
const FIELD_SECTIONS = {
  basic: ['NOMBRE', 'DESCRIPCION'],
  tipo: ['TIPO_RESPUESTA'],
  config: [
    { type: 'field', name: 'TIPO_TEXTO' },
    { type: 'field', name: 'MODO_SELECCION' },
    { type: 'field', name: 'OPCIONES' },
    { type: 'field', name: 'PERMITE_OTROS' },
    { type: 'field', name: 'MAX_CARACTERES' },
    { type: 'grid', names: ['MIN_VALOR', 'MAX_VALOR'] },
  ],
  footer: ['OBLIGATORIO']
};

// Valores iniciales por defecto para crear desde cero
const DEFAULT_VALUES = {
  NOMBRE: '',
  DESCRIPCION: '',
  TIPO_RESPUESTA: 'texto',
  TIPO_TEXTO: 'libre',
  OPCIONES: [],
  PERMITE_OTROS: false,
  MODO_SELECCION: 'unica',
  MIN_VALOR: '',
  MAX_VALOR: '',
  MAX_CARACTERES: '',
  OBLIGATORIO: false
};

/**
 * PreguntaCreateForm — formulario inline estilo Google Forms para crear pregunta.
 * Aparece al hacer clic en "Crear Pregunta" o "Añadir Pregunta" (por grupo).
 *
 * Diferencias con PreguntaEditForm:
 *  - Selector de condiciones laborales (checkboxes, mínimo 1)
 *  - ORDEN calculado automático (último + 1 por condición)
 *  - Inserción múltiple (una por condición seleccionada)
 *  - Valores iniciales = defaults (no de un record existente)
 *
 * @param {Array} tableRecords - records de VW_CONVOCATORIA_PREGUNTAS (para calcular ORDEN)
 * @param {string[]} condicionesPreseleccionadas - condiciones a pre-checkear al abrir
 * @param {Function} onSuccess - callback después de crear (refresh + notificación)
 * @param {Function} onCancel - callback para cerrar el form
 */
function PreguntaCreateForm({ tableRecords, condicionesPreseleccionadas = [], onSuccess, onCancel }) {
  // Filtrar campos: excluir CONDICION_LABORAL y ORDEN (se manejan aparte)
  const createFields = useMemo(
    () => preguntasFormFields.filter(f => f.name !== 'CONDICION_LABORAL' && f.name !== 'ORDEN'),
    []
  );

  // Lookup por nombre
  const fieldByName = useMemo(() => {
    const map = {};
    createFields.forEach(f => { map[f.name] = f; });
    return map;
  }, [createFields]);

  // Validación: solo validar NOMBRE y TIPO_RESPUESTA (CONDICION_LABORAL y ORDEN se manejan aparte)
  const createValidation = useMemo(() => ({
    NOMBRE: preguntasValidation.NOMBRE,
    TIPO_RESPUESTA: preguntasValidation.TIPO_RESPUESTA
  }), []);

  const { formData, setFieldValue } = useFormState(DEFAULT_VALUES);
  const { errors, validateForm } = useFormValidation(createValidation, createFields);

  // Condiciones laborales seleccionadas (checkboxes)
  const [condicionesSeleccionadas, setCondicionesSeleccionadas] = useState(
    () => Array.isArray(condicionesPreseleccionadas) ? [...condicionesPreseleccionadas] : []
  );
  const [condicionesError, setCondicionesError] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Preview en vivo
  const previewPregunta = useMemo(() => {
    let opciones = formData.OPCIONES;
    if (typeof opciones === 'string') {
      try { opciones = JSON.parse(opciones); } catch { opciones = []; }
    }
    return {
      TIPO_RESPUESTA: formData.TIPO_RESPUESTA,
      TIPO_TEXTO: formData.TIPO_TEXTO,
      OPCIONES: opciones,
      PERMITE_OTROS: formData.PERMITE_OTROS,
      MODO_SELECCION: formData.MODO_SELECCION,
      MIN_VALOR: formData.MIN_VALOR,
      MAX_VALOR: formData.MAX_VALOR,
      MAX_CARACTERES: formData.MAX_CARACTERES
    };
  }, [formData]);

  const handleChange = useCallback((name, value) => {
    setFieldValue(name, value);
  }, [setFieldValue]);

  const toggleCondicion = useCallback((value) => {
    setCondicionesSeleccionadas(prev => {
      if (prev.includes(value)) {
        return prev.filter(c => c !== value);
      }
      return [...prev, value];
    });
    setCondicionesError(null);
  }, []);

  // Renderizar un campo individual por nombre
  const renderField = useCallback((name) => {
    const field = fieldByName[name];
    if (!field) return null;
    const isHidden = evaluateHidden(field.hidden, formData);
    if (isHidden) return null;
    return (
      <FormField
        key={field.name}
        field={field}
        value={formData[field.name]}
        error={errors[field.name]}
        touched={true}
        onChange={handleChange}
        formData={formData}
      />
    );
  }, [fieldByName, formData, errors, handleChange]);

  // Renderizar un slot del contenedor de configuración
  const renderConfigSlot = useCallback((slot) => {
    if (slot.type === 'field') {
      return renderField(slot.name);
    }
    if (slot.type === 'grid') {
      const visible = slot.names
        .map(name => ({ name, field: fieldByName[name] }))
        .filter(({ field }) => field && !evaluateHidden(field.hidden, formData));
      if (visible.length === 0) return null;
      return (
        <div key={`grid-${slot.names.join('-')}`} className="grid grid-cols-2 gap-3">
          {visible.map(({ name }) => {
            const field = fieldByName[name];
            return (
              <FormField
                key={field.name}
                field={field}
                value={formData[field.name]}
                error={errors[field.name]}
                touched={true}
                onChange={handleChange}
                formData={formData}
              />
            );
          })}
        </div>
      );
    }
    return null;
  }, [fieldByName, formData, errors, handleChange, renderField]);

  // ¿Hay campos visibles en el contenedor de configuración?
  const hasVisibleConfig = useMemo(() => {
    return FIELD_SECTIONS.config.some(slot => {
      if (slot.type === 'field') {
        const field = fieldByName[slot.name];
        return field && !evaluateHidden(field.hidden, formData);
      }
      if (slot.type === 'grid') {
        return slot.names.some(name => {
          const field = fieldByName[name];
          return field && !evaluateHidden(field.hidden, formData);
        });
      }
      return false;
    });
  }, [fieldByName, formData]);

  const handleSave = useCallback(async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setSubmitError(null);
    setCondicionesError(null);

    // Validar condiciones (mínimo 1)
    if (condicionesSeleccionadas.length === 0) {
      setCondicionesError('Debe seleccionar al menos una condición laboral');
      return;
    }

    // Validar campos del formulario
    const isValid = validateForm(formData);
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      // Crear una pregunta por cada condición seleccionada
      const promises = condicionesSeleccionadas.map(condicion => {
        const orden = getNextOrdenForCondicion(tableRecords, condicion);
        const payload = {
          CONDICION_LABORAL: condicion,
          NOMBRE: formData.NOMBRE,
          DESCRIPCION: formData.DESCRIPCION || null,
          TIPO_RESPUESTA: formData.TIPO_RESPUESTA,
          OBLIGATORIO: !!formData.OBLIGATORIO,
          ACTIVO: true,
          ORDEN: orden
        };
        // createPregunta(data, _id, formData) — formData = estado local
        return createPregunta(payload, null, formData);
      });

      await Promise.all(promises);
      await onSuccess();
    } catch (err) {
      setSubmitError(err.message || 'Error al crear la pregunta');
    } finally {
      setIsSubmitting(false);
    }
  }, [condicionesSeleccionadas, formData, validateForm, tableRecords, onSuccess]);

  return (
    <div className="px-5 py-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <svg
          className="w-4 h-4 text-green-600"
          fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        <span className="text-sm font-semibold text-gray-700">Creando nueva pregunta</span>
      </div>

      {/* Selector de condiciones laborales */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Aplicar a <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {CONDICIONES.map(cond => {
            const checked = condicionesSeleccionadas.includes(cond.value);
            return (
              <label
                key={cond.value}
                className={`
                  flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 cursor-pointer transition-all
                  ${checked
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleCondicion(cond.value)}
                  className="sr-only"
                />
                <div className={`
                  w-4 h-4 rounded border-2 flex items-center justify-center transition-all
                  ${checked ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}
                `}>
                  {checked && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium">{cond.label}</span>
              </label>
            );
          })}
        </div>
        {condicionesError && (
          <p className="mt-1.5 text-xs text-red-600">{condicionesError}</p>
        )}
        <p className="mt-1.5 text-xs text-gray-400">
          Se creará una pregunta por cada condición seleccionada. El orden se asigna automáticamente.
        </p>
      </div>

      {/* Sección: Básico + Tipo de respuesta */}
      <div className="space-y-3">
        {FIELD_SECTIONS.basic.map(renderField)}
        {FIELD_SECTIONS.tipo.map(renderField)}
      </div>

      {/* Sección: Configuración */}
      {hasVisibleConfig && (
        <div className="mt-4 p-4 bg-gray-50/80 rounded-lg border border-gray-200/60 transition-all duration-200">
          <div className="flex items-center gap-1.5 mb-3">
            <svg
              className="w-3.5 h-3.5 text-gray-400"
              fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Configuración
            </span>
          </div>
          <div className="space-y-3">
            {FIELD_SECTIONS.config.map(slot => renderConfigSlot(slot))}
          </div>
        </div>
      )}

      {/* Preview en vivo */}
      <div className="mt-4 p-3 bg-gray-50/70 rounded-lg border border-gray-100">
        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">
          Vista previa del campo
        </p>
        <PreviewInput pregunta={previewPregunta} />
      </div>

      {/* Footer: OBLIGATORIO */}
      <div className="mt-4">
        {FIELD_SECTIONS.footer.map(renderField)}
      </div>

      {/* Error de submit */}
      {submitError && (
        <div className="mt-3 p-2.5 bg-red-50 border border-red-200 rounded-md">
          <p className="text-xs text-red-600">{submitError}</p>
        </div>
      )}

      {/* Botones */}
      <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          {isSubmitting && (
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {isSubmitting
            ? `Creando en ${condicionesSeleccionadas.length} condición(es)...`
            : `Crear pregunta${condicionesSeleccionadas.length > 1 ? ` (${condicionesSeleccionadas.length} condiciones)` : ''}`
          }
        </button>
      </div>
    </div>
  );
}

export default PreguntaCreateForm;
