import React from 'react';
import { createPortal } from 'react-dom';

/**
 * Portal para renderizar menús fuera del contenedor de la tabla
 * Evita problemas de clipping y posicionamiento
 */
const MenuPortal = ({ children, isOpen }) => {
  if (!isOpen) return null;
  
  return createPortal(
    <div className="menu-portal-container">
      {children}
    </div>,
    document.body
  );
};

export default MenuPortal;
