import React from 'react';
import { MODAL_DEFAULTS } from '../constants/modalConstants';
import { useModal } from '../hooks/useModal';
import { useModalClasses } from '../hooks/useModalClasses';
import { ModalLoading, ModalError, ModalCloseButton } from '../components/ModalComponents';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  // Tamaño y posición
  size = MODAL_DEFAULTS.size,
  position = MODAL_DEFAULTS.position,
  customSize = null,
  
  // Personalización visual
  overlayColor = MODAL_DEFAULTS.overlayColor,
  overlayOpacity = MODAL_DEFAULTS.overlayOpacity,
  backgroundColor = MODAL_DEFAULTS.backgroundColor,
  border = MODAL_DEFAULTS.border,
  shadow = MODAL_DEFAULTS.shadow,
  headerGradient = null,
  headerPattern = null,
  
  // Comportamiento
  closeOnOutsideClick = MODAL_DEFAULTS.closeOnOutsideClick,
  closeOnEscapeKey = MODAL_DEFAULTS.closeOnEscapeKey,
  preventClose = MODAL_DEFAULTS.preventClose,
  
  // Estructura
  showHeader = MODAL_DEFAULTS.showHeader,
  showCloseButton = MODAL_DEFAULTS.showCloseButton,
  headerClassName = '',
  bodyClassName = '',
  footer = null,
  footerClassName = '',
  
  // Estados
  loading = false,
  error = null,
  
  // Animación y responsive
  animation = MODAL_DEFAULTS.animation,
  fullscreenOnMobile = MODAL_DEFAULTS.fullscreenOnMobile,
  className = '',
  widthClass = 'w-auto',
  
  // Accesibilidad
  ariaLabel = null,
  ariaDescribedBy = null,
  
  // Custom
  customCloseIcon = null,
  onOpen = null,
  onBeforeClose = null
}) => {
  // Hook de comportamiento y accesibilidad
  const { modalRef, handleClose, handleOutsideClick } = useModal({
    isOpen,
    closeOnEscapeKey,
    preventClose,
    onOpen,
    onBeforeClose,
    onClose
  });

  // Hook de clases CSS
  const { overlayClasses, modalClasses, headerClasses, bodyClasses, footerClasses, headerGradientClasses, headerPatternClasses } = useModalClasses({
    overlayColor,
    overlayOpacity,
    position,
    animation,
    fullscreenOnMobile,
    backgroundColor,
    border,
    shadow,
    size,
    customSize,
    className,
    headerClassName,
    bodyClassName,
    footerClassName,
    widthClass,
    headerGradient,
    headerPattern
  });

  // Manejo de clic fuera
  const handleOutsideClickFinal = (event) => {
    if (closeOnOutsideClick) {
      handleOutsideClick(event);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className={overlayClasses}
      onClick={handleOutsideClickFinal}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel || title}
      aria-describedby={ariaDescribedBy}
    >
      <div 
        ref={modalRef}
        className={modalClasses}
        tabIndex={-1}
      >
        {/* Header */}
        {showHeader && (
          <div className={`${headerClasses} ${headerGradientClasses} ${headerPatternClasses}`}>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            {showCloseButton && (
              <ModalCloseButton 
                onClose={handleClose}
                customIcon={customCloseIcon}
                preventClose={preventClose}
              />
            )}
          </div>
        )}
        
        {/* Loading State */}
        {loading && <ModalLoading />}
        
        {/* Error State */}
        {error && <ModalError error={error} />}
        
        {/* Body */}
        {!loading && !error && (
          <div className={bodyClasses}>
            {children}
          </div>
        )}
        
        {/* Footer */}
        {footer && !loading && !error && (
          <div className={footerClasses}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
