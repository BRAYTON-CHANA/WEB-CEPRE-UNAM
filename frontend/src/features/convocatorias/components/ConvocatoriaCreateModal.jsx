import React from 'react';
import { Form } from '@/shared/components/form';
import { Modal } from '@/shared/components/modal';
import {
  convocatoriaFormFields,
  convocatoriaValidation
} from '@/features/convocatorias/config/formConfig';
import PlazasGridInput from '@/features/convocatorias/components/PlazasGridInput';

/**
 * ConvocatoriaCreateModal — modal custom de creación en 2 pasos.
 * Paso 1: datos de la convocatoria (Form base).
 * Paso 2: grid de plazas por (sede x curso) — PlazasGridInput.
 *
 * Props:
 *   isOpen, onClose
 *   createStep: 1 | 2
 *   plazas, submitting, submitError
 *   onStep1Submit: (formData) => void
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
        <Form
          key="custom-create-step1"
          fields={convocatoriaFormFields}
          validation={convocatoriaValidation}
          onSubmit={onStep1Submit}
          submitText="Siguiente"
          submitWrapperClassName="sticky bottom-0 bg-white pt-4 pb-2 mt-6 -mx-6 px-6 border-t border-gray-200 z-10"
        />
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
