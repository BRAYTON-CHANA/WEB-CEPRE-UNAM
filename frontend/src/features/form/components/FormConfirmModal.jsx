import React from 'react';
import Modal from '@/features/modal/views/Modal';

/**
 * Componente de modal de confirmación para formularios
 * Encapsula toda la lógica y UI del modal de confirmación
 */
const FormConfirmModal = ({
  isOpen,
  onConfirm,
  onCancel,
  config = {}
}) => {
  const {
    title = 'Confirmar acción',
    message = '¿Estás seguro de que deseas continuar?',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    icon = null
  } = config;

  // Footer con botones de confirmar y cancelar
  const footer = (
    <div className="flex gap-3 justify-end">
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
      >
        {cancelText}
      </button>
      <button
        type="button"
        onClick={onConfirm}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        {confirmText}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      footer={footer}
      size="small"
      closeOnOutsideClick={false}
      closeOnEscapeKey={true}
    >
      <div className="flex items-start gap-4">
        {icon && (
          <div className="flex-shrink-0">
            {icon}
          </div>
        )}
        <div className="text-gray-700">
          {typeof message === 'string' ? (
            <p>{message}</p>
          ) : (
            message
          )}
        </div>
      </div>
    </Modal>
  );
};

export default FormConfirmModal;
