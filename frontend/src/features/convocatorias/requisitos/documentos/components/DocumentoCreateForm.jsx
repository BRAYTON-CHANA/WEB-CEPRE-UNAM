import React, { useMemo, useState, useCallback } from 'react';
import { useFormState } from '@/shared/components/form/hooks/useFormState';
import { useFormValidation } from '@/shared/components/form/hooks/useFormValidation';
import FormField from '@/shared/components/form/components/FormField';
import { documentosFormFields, documentosValidation } from '@/features/convocatorias/requisitos/documentos/config/formConfig';
import {
  createDocumento
} from '@/features/convocatorias/requisitos/documentos/services/convocatoriaDocumentosService';

// Condiciones laborales disponibles
const CONDICIONES = [
  { value: 'CONTRATADO', label: 'Contratado' },
  { value: 'EXTERNO', label: 'Externo' },
  { value: 'ORDINARIO', label: 'Ordinario' }
];

// Valores iniciales por defecto
const DEFAULT_VALUES = {
  CLASIFICACION: '',
  NOMBRE: '',
  DESCRIPCION: ''
};

/**
 * DocumentoCreateForm — formulario inline estilo Google Forms para crear documento.
 * Aparece al hacer clic en "Crear Documento".
 *
 * Modelo nuevo (dos tablas, FK invertido):
 *  - CONVOCATORIA_DOCUMENTOS_CLASIFICACION: sección (condición + nombre + obligatorio)
 *  - CONVOCATORIA_DOCUMENTOS: plantilla asociada via FK ID_CLASIFICACION + ORDEN
 *
 * El usuario selecciona condiciones + clasificación + nombre/descripción del documento.
 * Al crear: busca/crea la clasificación por (condición + nombre), luego inserta el documento con FK + ORDEN.
 * Sin ARCHIVO (se sube después via tabla inline).
 *
 * @param {Array} tableRecords - records de VW_CONVOCATORIA_DOCUMENTOS (para calcular ORDEN)
 * @param {Array} clasificacionesRecords - records de VW_CONVOCATORIA_DOCUMENTOS_CLASIFICACION
 * @param {string[]} condicionesPreseleccionadas - condiciones a pre-checkear al abrir
 * @param {Function} onSuccess - callback después de crear (refresh + notificación)
 * @param {Function} onCancel - callback para cerrar el form
 */
function DocumentoCreateForm({ tableRecords, clasificacionesRecords, condicionesPreseleccionadas = [], onSuccess, onCancel }) {
  // Filtrar campos: excluir CONDICION_LABORAL y ORDEN (se manejan aparte)
  const createFields = useMemo(
    () => documentosFormFields.filter(f => f.name !== 'CONDICION_LABORAL' && f.name !== 'ORDEN'),
    []
  );

  // Validación: CLASIFICACION y NOMBRE
  const createValidation = useMemo(() => ({
    CLASIFICACION: documentosValidation.CLASIFICACION,
    NOMBRE: documentosValidation.NOMBRE
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

    setIsSubmitting(true);
    try {
      const clasificacion = formData.CLASIFICACION;

      // Crear un documento por cada condición seleccionada.
      // El ORDEN lo calcula el service desde la BD.
      const promises = condicionesSeleccionadas.map(condicion => {
        const payload = {
          CONDICION_LABORAL: condicion,
          CLASIFICACION: clasificacion,
          NOMBRE: formData.NOMBRE,
          DESCRIPCION: formData.DESCRIPCION || null,
          OBLIGATORIO: false,
          ACTIVO: true,
          // Pasar clasificacionesRecords para que el service busque/crea la clasificación
          _clasificacionesRecords: clasificacionesRecords
        };
        // createDocumento(data, _id, formData) — sin archivo en create
        return createDocumento(payload, null, {});
      });

      await Promise.all(promises);
      await onSuccess();
    } catch (err) {
      setSubmitError(err.message || 'Error al crear el documento');
    } finally {
      setIsSubmitting(false);
    }
  }, [condicionesSeleccionadas, formData, validateForm, clasificacionesRecords, onSuccess]);

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
        <span className="text-sm font-semibold text-gray-700">Creando nuevo documento</span>
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
          Se creará un documento por cada condición seleccionada. El orden se asigna automáticamente. El archivo se sube después desde la tabla.
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
            : `Crear documento${condicionesSeleccionadas.length > 1 ? ` (${condicionesSeleccionadas.length} condiciones)` : ''}`
          }
        </button>
      </div>
    </div>
  );
}

export default DocumentoCreateForm;
