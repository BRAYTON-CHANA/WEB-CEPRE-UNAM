import React, { useState, useEffect } from 'react';
import { Modal } from '@/shared/components/modal';
import PredefinedFilesInput from '@/shared/components/ui/inputs/PredefinedFilesInput';
import { getDocumentoUrl } from '@/features/convocatorias/requisitos/documentos/services/convocatoriaDocumentosService';

/**
 * AdjuntosModal — modal para ver/editar documentos adjuntos de una postulación.
 *
 * @param {Object} adjuntosModal - { open, postulacion, adjuntos, loading, saving }
 * @param {Function} onSave - handler guardar (recibe adjuntosData)
 * @param {Function} onClose - handler cerrar
 */
function AdjuntosModal({
  adjuntosModal,
  onSave,
  onClose,
}) {
  const { open, postulacion, adjuntos, loading, saving } = adjuntosModal;
  const [localValue, setLocalValue] = useState(null);

  useEffect(() => {
    if (open && adjuntos) {
      setLocalValue(adjuntos);
    }
  }, [open, adjuntos]);

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={`Documentos de ${postulacion?.DOCENTE_NOMBRE || ''}`}
      size="lg"
      closeOnOutsideClick={false}
    >
      <div className="p-6">
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block w-5 h-5 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-2" />
            <p className="text-sm text-gray-500">Cargando documentos...</p>
          </div>
        )}

        {!loading && adjuntos && (
          <>
            <PredefinedFilesInput
              name="ADJUNTOS_DATA"
              value={localValue}
              onChange={(name, value) => setLocalValue(value)}
              label="Documentos de postulación"
              mode="edit"
              getDownloadUrl={getDocumentoUrl}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.png,.jpg,.jpeg"
              maxSize={10 * 1024 * 1024}
            />

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 mt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cerrar
              </button>
              <button
                onClick={() => onSave(localValue)}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </>
        )}

        {!loading && !adjuntos && (
          <div className="text-center py-8 text-sm text-gray-500">
            Esta postulación no tiene documentos.
          </div>
        )}
      </div>
    </Modal>
  );
}

export default AdjuntosModal;
