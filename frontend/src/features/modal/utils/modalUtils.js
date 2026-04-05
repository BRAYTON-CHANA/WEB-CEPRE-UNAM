import { 
  MODAL_SIZES, 
  MODAL_POSITIONS, 
  MODAL_OVERLAYS, 
  MODAL_OPACITIES, 
  MODAL_BACKGROUNDS, 
  MODAL_BORDERS, 
  MODAL_SHADOWS 
} from '../constants/modalConstants';

/**
 * Construye las clases CSS para el overlay del modal
 */
export const buildOverlayClasses = ({
  overlayColor,
  overlayOpacity,
  position,
  animation,
  fullscreenOnMobile
}) => {
  // Si overlayColor incluye clases personalizadas (como backdrop-blur), usarla directamente
  const overlayClass = overlayColor.includes(' ') ? overlayColor : MODAL_OVERLAYS[overlayColor];
  
  // Usar position absoluto en lugar de flex para mejor control del centrado
  const positionClasses = {
    top: 'items-start justify-center pt-20',
    center: 'items-center justify-center',
    bottom: 'items-end justify-center'
  };
  
  return `
    fixed inset-0 
    ${overlayClass}
    ${overlayColor.includes(' ') ? '' : MODAL_OPACITIES[overlayOpacity]}
    flex ${positionClasses[position]}
    z-50 p-4
    ${animation ? 'transition-opacity duration-300' : ''}
    ${fullscreenOnMobile ? 'md:p-4 p-2' : ''}
  `.trim();
};

/**
 * Construye las clases CSS para el contenido del modal
 */
export const buildModalClasses = ({
  backgroundColor,
  border,
  shadow,
  size,
  customSize,
  animation,
  fullscreenOnMobile,
  className
}) => {
  const modalSize = customSize || MODAL_SIZES[size];
  
  return `
    ${MODAL_BACKGROUNDS[backgroundColor]}
    ${MODAL_BORDERS[border]}
    ${MODAL_SHADOWS[shadow]}
    w-full ${modalSize}
    ${fullscreenOnMobile ? 'md:mx-4 mx-2' : 'mx-auto'}
    ${animation ? 'transition-all duration-300 transform' : ''}
    ${className}
  `.trim();
};

/**
 * Construye las clases CSS para las secciones del modal
 */
export const buildSectionClasses = (type, customClassName = '') => {
  const baseClasses = {
    header: 'flex items-center justify-between p-6 border-b border-gray-200',
    body: 'p-6',
    footer: 'flex items-center justify-end gap-3 p-6 border-t border-gray-200'
  };
  
  return `${baseClasses[type]} ${customClassName}`.trim();
};
