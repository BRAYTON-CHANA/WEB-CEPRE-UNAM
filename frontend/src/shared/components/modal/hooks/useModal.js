import { useEffect, useRef } from 'react';

/**
 * Hook personalizado para manejar la lógica de accesibilidad y comportamiento del modal
 */
export const useModal = ({ 
  isOpen, 
  closeOnEscapeKey, 
  preventClose, 
  onOpen, 
  onBeforeClose, 
  onClose 
}) => {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Manejo de focus y scroll
  useEffect(() => {
    if (isOpen) {
      // Guardar focus anterior
      previousFocusRef.current = document.activeElement;
      
      // Focus trap
      if (modalRef.current) {
        modalRef.current.focus();
      }
      
      // Prevenir scroll del body
      document.body.style.overflow = 'hidden';
      
      // Callback onOpen
      if (onOpen) onOpen();
    } else {
      // Restaurar scroll
      document.body.style.overflow = 'unset';
      
      // Restaurar focus
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onOpen]);

  // Manejo de teclado
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && closeOnEscapeKey && !preventClose) {
        handleClose();
      }
    };

    if (isOpen && closeOnEscapeKey) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, closeOnEscapeKey, preventClose]);

  const handleClose = () => {
    if (preventClose) return;
    
    if (onBeforeClose) {
      const shouldClose = onBeforeClose();
      if (shouldClose === false) return;
    }
    
    if (onClose) onClose();
  };

  const handleOutsideClick = (event) => {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  };

  return {
    modalRef,
    handleClose,
    handleOutsideClick
  };
};
