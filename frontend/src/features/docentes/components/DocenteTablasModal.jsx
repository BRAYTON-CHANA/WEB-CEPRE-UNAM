import React, { useRef, useState, useCallback } from 'react';
import { Modal } from '@/shared/components/modal';
import DocenteTablasRelacionadas from '@/features/docentes/components/DocenteTablasRelacionadas';
import { actualizarTablasDocente } from '@/features/docentes/services/docenteService';

/**
 * DocenteTablasModal — modal standalone para editar las 4 tablas hijas de un docente.
 * Reutiliza DocenteTablasRelacionadas (misma página 3 del DocenteForm).
 *
 * Props:
 *  - open: boolean
 *  - docente: row de VW_DOCENTES (debe tener ID_DOCENTE y NOMBRE_COMPLETO)
 *  - onClose: () => void
 *  - onSuccess: (result) => void
 */
function DocenteTablasModal({ open, docente, onClose, onSuccess }) {
  const tablasRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleGuardar = useCallback(async () => {
    if (!docente?.ID_DOCENTE) return;
    setError(null);

    const validation = tablasRef.current?.validateAndGetAllData();
    if (!validation || !validation.valid) {
      setError(validation?.error || 'Complete todos los campos antes de guardar.');
      return;
    }

    setSaving(true);
    try {
      const result = await actualizarTablasDocente(docente.ID_DOCENTE, validation.data);
      onSuccess?.(result);
      onClose();
    } catch (err) {
      console.error('[DocenteTablasModal] Error guardando:', err);
      setError(err.message || 'Error al guardar las tablas relacionadas');
    } finally {
      setSaving(false);
    }
  }, [docente, onSuccess, onClose]);

  const handleClose = useCallback(() => {
    if (saving) return;
    setError(null);
    onClose();
  }, [saving, onClose]);

  if (!docente) return null;

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      title={`Tablas relacionadas — ${docente.NOMBRE_COMPLETO || 'Docente'}`}
      size="xl"
      closeOnOutsideClick={false}
    >
      <div className="p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600"><strong>Error:</strong> {error}</p>
          </div>
        )}

        <DocenteTablasRelacionadas
          ref={tablasRef}
          idDocente={docente.ID_DOCENTE}
          mode="edit"
        />

        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGuardar}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Guardar cambios
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default DocenteTablasModal;
