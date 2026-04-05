import { useMemo } from 'react';
import { buildOverlayClasses, buildModalClasses, buildSectionClasses } from '../utils/modalUtils';

/**
 * Hook para construir todas las clases CSS del modal
 */
export const useModalClasses = ({
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
  footerClassName
}) => {
  const overlayClasses = useMemo(() => 
    buildOverlayClasses({
      overlayColor,
      overlayOpacity,
      position,
      animation,
      fullscreenOnMobile
    }), 
    [overlayColor, overlayOpacity, position, animation, fullscreenOnMobile]
  );

  const modalClasses = useMemo(() => 
    buildModalClasses({
      backgroundColor,
      border,
      shadow,
      size,
      customSize,
      animation,
      fullscreenOnMobile,
      className
    }), 
    [backgroundColor, border, shadow, size, customSize, animation, fullscreenOnMobile, className]
  );

  const headerClasses = useMemo(() => 
    buildSectionClasses('header', headerClassName), 
    [headerClassName]
  );

  const bodyClasses = useMemo(() => 
    buildSectionClasses('body', bodyClassName), 
    [bodyClassName]
  );

  const footerClasses = useMemo(() => 
    buildSectionClasses('footer', footerClassName), 
    [footerClassName]
  );

  return {
    overlayClasses,
    modalClasses,
    headerClasses,
    bodyClasses,
    footerClasses
  };
};
