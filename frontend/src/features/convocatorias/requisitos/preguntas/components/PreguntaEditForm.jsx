import React, { useMemo, useState, useCallback } from 'react';
import { useFormState } from '@/shared/components/form/hooks/useFormState';
import { useFormValidation } from '@/shared/components/form/hooks/useFormValidation';
import FormField from '@/shared/components/form/components/FormField';
import { evaluateHidden } from '@/shared/components/form/utils/conditionEvaluator';
import { preguntasFormFields, preguntasValidation } from '@/features/convocatorias/requisitos/preguntas/config/formConfig';
import { buildPayloadConRestricciones, mapRecordToFormValues } from '@/features/convocatorias/requisitos/preguntas/services/convocatoriaPreguntasService';
import PreviewInput from './PreviewInput';
import PreguntaBadges from './PreguntaBadges';

// Secciones del formulario (orden lógico, no orden del array formConfig)
const FIELD_SECTIONS = {
  basic: ['NOMBRE', 'DESCRIPCION'],
  tipo: ['TIPO_RESPUESTA'],
  // Slots de configuración: 'field' = un campo, 'grid' = varios en mismo row
  config: [
    { type: 'field', name: 'TIPO_TEXTO' },                          // texto
    { type: 'field', name: 'MODO_SELECCION' },                       // opcion_multiple
    { type: 'field', name: 'OPCIONES' },                             // opcion_multiple
    { type: 'field', name: 'PERMITE_OTROS' },                        // opcion_multiple
    { type: 'field', name: 'MAX_CARACTERES' },                       // texto+libre o opcion_multiple+otros
    { type: 'grid', names: ['MIN_VALOR', 'MAX_VALOR'] },             // texto+entero/float, mismo row
  ],
  footer: ['OBLIGATORIO']
};

/**
 * PreguntaEditForm — formulario inline estilo Google Forms.
 * Se renderiza dentro de PreguntaCard cuando isEditing=true.
 *
 * Layout seccionado:
 *   1. Básico (NOMBRE, DESCRIPCION)
 *   2. Tipo de respuesta (TIPO_RESPUESTA)
 *   3. Contenedor "Configuración" con campos dependientes (animados)
 *   4. Vista previa en vivo
 *   5. Footer (OBLIGATORIO)
 *
 * No muestra ORDEN ni CONDICION_LABORAL (no editables).
 * Reusa FormField + useFormState + useFormValidation del sistema de formularios.
 *
 * @param {Object} pregunta - record original de VW_CONVOCATORIA_PREGUNTAS
 * @param {Function} onSave - callback(payload) al guardar
 * @param {Function} onCancel - callback() al cancelar
 */
function PreguntaEditForm({ pregunta, onSave, onCancel }) {
  // Filtrar campos: excluir CONDICION_LABORAL y ORDEN (no editables inline)
  const editFields = useMemo(
    () => preguntasFormFields.filter(f => f.name !== 'CONDICION_LABORAL' && f.name !== 'ORDEN'),
    []
  );

  // Lookup por nombre para acceso rápido
  const fieldByName = useMemo(() => {
    const map = {};
    editFields.forEach(f => { map[f.name] = f; });
    return map;
  }, [editFields]);

  // Valores iniciales desde el record (mapeo centralizado en service)
  const initialValues = useMemo(
    () => mapRecordToFormValues(pregunta, editFields),
    [pregunta, editFields]
  );

  const { formData, setFieldValue } = useFormState(initialValues);
  const { errors, validateForm } = useFormValidation(preguntasValidation, editFields);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Construir objeto "pregunta preview" desde formData para PreviewInput en vivo
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

  // Renderizar un campo individual por nombre (respeta hidden conditions)
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

    // validateForm ya filtra campos ocultos via getVisibleFields
    const isValid = validateForm(formData);
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      // Construir payload: campos base + restricciones según tipo
      // ACTIVO se preserva del record original (no se edita inline)
      const payload = {
        NOMBRE: formData.NOMBRE,
        DESCRIPCION: formData.DESCRIPCION || null,
        TIPO_RESPUESTA: formData.TIPO_RESPUESTA,
        OBLIGATORIO: !!formData.OBLIGATORIO,
        ACTIVO: pregunta.ACTIVO !== false && pregunta.ACTIVO !== 'false' && pregunta.ACTIVO !== 0
      };
      buildPayloadConRestricciones(payload, formData);
      await onSave(payload);
    } catch (err) {
      setSubmitError(err.message || 'Error al guardar la pregunta');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, onSave, pregunta]);

  return (
    <div className="px-5 py-4">
      {/* Header compacto: badges read-only del tipo actual */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <PreguntaBadges
          TIPO_RESPUESTA={formData.TIPO_RESPUESTA}
          TIPO_TEXTO={formData.TIPO_TEXTO}
          PERMITE_OTROS={formData.PERMITE_OTROS}
          MODO_SELECCION={formData.MODO_SELECCION}
        />
        <span className="text-[10px] text-gray-400 font-medium ml-auto">Editando pregunta</span>
      </div>

      {/* Sección: Básico + Tipo de respuesta */}
      <div className="space-y-3">
        {FIELD_SECTIONS.basic.map(renderField)}
        {FIELD_SECTIONS.tipo.map(renderField)}
      </div>

      {/* Sección: Configuración (contenedor visual, solo si hay campos visibles) */}
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
          Guardar cambios
        </button>
      </div>
    </div>
  );
}

export default PreguntaEditForm;
