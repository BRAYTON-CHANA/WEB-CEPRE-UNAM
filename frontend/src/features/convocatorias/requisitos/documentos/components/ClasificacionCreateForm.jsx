import React, { useMemo, useState, useCallback } from 'react';
import { useFormState } from '@/shared/components/form/hooks/useFormState';
import { useFormValidation } from '@/shared/components/form/hooks/useFormValidation';
import FormField from '@/shared/components/form/components/FormField';
import { clasificacionFormFields, clasificacionValidation } from '@/features/convocatorias/requisitos/documentos/config/formConfig';
import { createClasificacion } from '@/features/convocatorias/requisitos/documentos/services/convocatoriaDocumentosService';

// Condiciones laborales disponibles
const CONDICIONES = [
  { value: 'CONTRATADO', label: 'Contratado' },
  { value: 'EXTERNO', label: 'Externo' },
  { value: 'ORDINARIO', label: 'Ordinario' }
];

// Valores iniciales por defecto
const DEFAULT_VALUES = {
  NOMBRE: '',
  OBLIGATORIO: false,
  ACTIVO: true
};

/**
 * ClasificacionCreateForm — formulario inline estilo Google Forms para crear clasificación.
 * Aparece al hacer clic en "Nueva Clasificación".
 *
 * Crea una sección (checklist) por cada condición laboral seleccionada.
 * No crea documentos — la sección aparece vacía y se le agregan documentos después.
 *
 * @param {Array} clasificacionesRecords - records de VW_CONVOCATORIA_DOCUMENTOS_CLASIFICACION (para validar duplicados)
 * @param {string[]} condicionesPreseleccionadas - condiciones a pre-checkear al abrir
 * @param {Function} onSuccess - callback después de crear (refresh + notificación)
 * @param {Function} onCancel - callback para cerrar el form
 */
function ClasificacionCreateForm({ clasificacionesRecords, condicionesPreseleccionadas = [], onSuccess, onCancel }) {
  // Filtrar campos: todos (NOMBRE, OBLIGATORIO, ACTIVO)
  const createFields = useMemo(() => clasificacionFormFields, []);

  // Validación: solo NOMBRE
  const createValidation = useMemo(() => ({
    NOMBRE: clasificacionValidation.NOMBRE
  }), []);

  const { formData, setFieldValue } = useFormState(DEFAULT_VALUES);
  const { errors, validateForm } = useFormValidation(createValidation, createFields);

  // Condiciones laborales seleccionadas
  const [condicionesSeleccionadas, setCondicionesSeleccionadas] = useState(
    () => Array.isArray(condicionesPreseleccionadas) ? [...condicionesPreseleccionadas] : []
  );
  const [condicionesError, setCondicionesError] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

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

    // Validar campos
    const isValid = validateForm(formData);
    if (!isValid) return;

    // Validar duplicados: (condición + nombre) no debe existir
    const nombreTrim = (formData.NOMBRE || '').trim();
    const duplicados = condicionesSeleccionadas.filter(cond => {
      return (clasificacionesRecords || []).some(
        c => c.CONDICION_LABORAL === cond && (c.NOMBRE || '').toUpperCase() === nombreTrim.toUpperCase()
      );
    });
    if (duplicados.length > 0) {
      const labels = duplicados.map(c =>
        CONDICIONES.find(co => co.value === c)?.label || c
      );
      setSubmitError(`Ya existe una clasificación "${nombreTrim}" para: ${labels.join(', ')}. Use un nombre diferente o edite la existente.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const promises = condicionesSeleccionadas.map(condicion => {
        return createClasificacion({
          CONDICION_LABORAL: condicion,
          NOMBRE: nombreTrim,
          OBLIGATORIO: formData.OBLIGATORIO ?? false,
          ACTIVO: formData.ACTIVO ?? true
        });
      });

      await Promise.all(promises);
      await onSuccess();
    } catch (err) {
      setSubmitError(err.message || 'Error al crear la clasificación');
    } finally {
      setIsSubmitting(false);
    }
  }, [condicionesSeleccionadas, formData, validateForm, clasificacionesRecords, onSuccess]);

  return (
    <div className="px-5 py-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <svg
          className="w-4 h-4 text-blue-600"
          fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <span className="text-sm font-semibold text-gray-700">Creando nueva clasificación</span>
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
          Se creará una sección vacía por cada condición seleccionada. Los documentos se agregan después.
        </p>
      </div>

      {/* Campos del formulario */}
      <div className="space-y-3">
        {createFields.map(field => (
          <FormField
            key={field.name}
            field={field}
            value={formData[field.name]}
            error={errors[field.name]}
            touched={true}
            onChange={handleChange}
            formData={formData}
          />
        ))}
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
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          {isSubmitting && (
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {isSubmitting
            ? `Creando en ${condicionesSeleccionadas.length} condición(es)...`
            : `Crear clasificación${condicionesSeleccionadas.length > 1 ? ` (${condicionesSeleccionadas.length} condiciones)` : ''}`
          }
        </button>
      </div>
    </div>
  );
}

export default ClasificacionCreateForm;
