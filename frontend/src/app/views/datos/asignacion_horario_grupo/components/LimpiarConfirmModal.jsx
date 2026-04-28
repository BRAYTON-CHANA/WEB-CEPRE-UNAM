import React, { useState, useEffect } from 'react';
import Modal from '@/features/modal/views/Modal';

/**
 * Modal de confirmación para limpiar todas las asignaciones de un grupo.
 * Countdown de 5 segundos antes de permitir confirmar.
 */
const LimpiarConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  grupoNombre
}) => {
  const [countdown, setCountdown] = useState(5);
  const [canConfirm, setCanConfirm] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(5);
      setCanConfirm(false);
      return;
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanConfirm(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  const handleCancel = () => {
    onClose?.();
  };

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm?.();
    onClose?.();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Limpiar todas las asignaciones"
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              canConfirm
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-red-400 text-white cursor-not-allowed'
            }`}
          >
            {canConfirm ? 'Confirmar' : `Confirmar (${countdown}s)`}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <p className="text-sm text-red-800 font-medium">
            Se eliminarán todas las asignaciones del grupo:
          </p>
          <p className="text-lg font-semibold text-red-900 mt-1">
            {grupoNombre || 'N/A'}
          </p>
        </div>
        <p className="text-sm text-gray-600 text-center">
          Esta acción no se puede deshacer.
        </p>
      </div>
    </Modal>
  );
};

export default LimpiarConfirmModal;
