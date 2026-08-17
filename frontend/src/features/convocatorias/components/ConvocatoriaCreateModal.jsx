import React, { useState } from 'react';
import { Form } from '@/shared/components/form';
import { Modal } from '@/shared/components/modal';
import {
  convocatoriaFormFieldsSinPeriodo,
  convocatoriaValidationSinPeriodo
} from '@/features/convocatorias/config/formConfig';
import PlazasGridInput from '@/features/convocatorias/components/PlazasGridInput';
import { usePeriodosSinConvocatoria } from '@/features/convocatorias/hooks/usePeriodosSinConvocatoria';

/**
 * ConvocatoriaCreateModal — modal custom de creación en 2 pasos.
 * Paso 1: datos de la convocatoria (select custom de periodo + Form base).
 * Paso 2: grid de plazas por (sede x curso) — PlazasGridInput.
 *
 * Props:
 *   isOpen, onClose
 *   createStep: 1 | 2
 *   plazas, submitting, submitError
 *   onStep1Submit: (formData) => void  — formData incluye ID_PERIODO
 *   onPlazasChange: (plazas) => void
 *   onFinalSubmit: () => void
 *   onBackToStep1: () => void
 */
function ConvocatoriaCreateModal({
  isOpen,
  onClose,
  createStep,
  plazas,
  submitting,
  submitError,
  onStep1Submit,
  onPlazasChange,
  onFinalSubmit,
  onBackToStep1
}) {
  const { periodos, loading, refresh } = usePeriodosSinConvocatoria();
  const [selectedIdPeriodo, setSelectedIdPeriodo] = useState('');
  const [periodoError, setPeriodoError] = useState('');

  const handleStep1Wrapper = (formData) => {
    if (!selectedIdPeriodo) {
      setPeriodoError('El periodo es obligatorio');
      return;
    }
    setPeriodoError('');
    onStep1Submit({ ...formData, ID_PERIODO: Number(selectedIdPeriodo) });
  };

  const handlePeriodoChange = (e) => {
    setSelectedIdPeriodo(e.target.value);
    if (e.target.value) setPeriodoError('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={createStep === 1 ? 'Crear Nueva Convocatoria — Paso 1 de 2' : 'Crear Nueva Convocatoria — Paso 2 de 2'}
      size="xl"
      closeOnOutsideClick={false}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className={`flex items-center gap-2 ${createStep === 1 ? 'text-blue-700' : 'text-gray-400'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${createStep === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>1</span>
          <span className="text-sm font-medium">Datos de Convocatoria</span>
        </div>
        <div className="flex-1 h-px bg-gray-200" />
        <div className={`flex items-center gap-2 ${createStep === 2 ? 'text-blue-700' : 'text-gray-400'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${createStep === 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>2</span>
          <span className="text-sm font-medium">Plazas por Curso/Sede</span>
        </div>
      </div>

      {submitError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {submitError}
        </div>
      )}

      {createStep === 1 && (
        <div className="space-y-4">
          {/* Select custom de periodo con refresh */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              Periodo
              <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center w-full">
              <select
                value={selectedIdPeriodo}
                onChange={handlePeriodoChange}
                disabled={loading}
                className={`w-full pl-3 pr-20 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-gray-400 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed ${
                  selectedIdPeriodo ? 'border-blue-400' : 'border-gray-300'
                }`}
              >
                <option value="">Seleccionar periodo...</option>
                {periodos.map(p => (
                  <option key={p.id_periodo} value={p.id_periodo}>
                    {p.nombre_periodo} ({p.codigo_periodo})
                  </option>
                ))}
              </select>

              {/* Botón refresh */}
              <button
                type="button"
                onClick={refresh}
                disabled={loading}
                title="Actualizar periodos"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
              </button>
            </div>
            {periodoError && (
              <span className="text-xs text-red-600">{periodoError}</span>
            )}
            {periodos.length === 0 && !loading && (
              <span className="text-xs text-amber-600">
                No hay periodos disponibles sin convocatoria. Cree un periodo nuevo o actualice la lista.
              </span>
            )}
          </div>

          {/* Form con los demás campos */}
          <Form
            key="custom-create-step1"
            fields={convocatoriaFormFieldsSinPeriodo}
            validation={convocatoriaValidationSinPeriodo}
            onSubmit={handleStep1Wrapper}
            submitText="Siguiente"
            submitWrapperClassName="sticky bottom-0 bg-white pt-4 pb-2 mt-6 -mx-6 px-6 border-t border-gray-200 z-10"
          />
        </div>
      )}

      {createStep === 2 && (
        <div>
          <PlazasGridInput
            value={plazas}
            onChange={(_, v) => onPlazasChange(v)}
            label="Plazas por Curso/Sede"
            minPlazas={0}
            maxPlazas={99}
          />

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onBackToStep1}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Atrás
            </button>
            <button
              type="button"
              onClick={onFinalSubmit}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Creando...' : 'Crear Convocatoria'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default ConvocatoriaCreateModal;
