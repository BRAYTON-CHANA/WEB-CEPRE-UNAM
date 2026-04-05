import React from 'react';

/**
 * Componente de loading para el modal
 */
export const ModalLoading = () => (
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-3 text-gray-600">Cargando...</span>
  </div>
);

/**
 * Componente de error para el modal
 */
export const ModalError = ({ error }) => (
  <div className="flex items-center justify-center py-8">
    <div className="text-red-600 text-center">
      <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      <p>{error}</p>
    </div>
  </div>
);

/**
 * Componente de botón de cierre para el modal
 */
export const ModalCloseButton = ({ onClose, customIcon, preventClose }) => {
  if (preventClose) return null;
  
  return (
    <button
      onClick={onClose}
      className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
      aria-label="Cerrar modal"
    >
      {customIcon || (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
    </button>
  );
};
