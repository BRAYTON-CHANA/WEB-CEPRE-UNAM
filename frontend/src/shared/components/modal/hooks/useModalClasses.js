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
  footerClassName,
  widthClass,
  headerGradient,
  headerPattern
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
      className,
      widthClass
    }), 
    [backgroundColor, border, shadow, size, customSize, animation, fullscreenOnMobile, className, widthClass]
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

  const headerGradientClasses = useMemo(() => {
    return headerGradient ? headerGradient : '';
  }, [headerGradient]);

  const headerPatternClasses = useMemo(() => {
    return headerPattern ? headerPattern : '';
  }, [headerPattern]);

  return {
    overlayClasses,
    modalClasses,
    headerClasses,
    bodyClasses,
    footerClasses,
    headerGradientClasses,
    headerPatternClasses
  };
};
