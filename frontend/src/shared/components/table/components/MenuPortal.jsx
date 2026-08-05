import { createPortal } from 'react-dom';

const MenuPortal = ({ isOpen, children }) => {
  if (!isOpen) return null;
  return createPortal(
    <div className="menu-portal-container">{children}</div>,
    document.body
  );
};

export default MenuPortal;
