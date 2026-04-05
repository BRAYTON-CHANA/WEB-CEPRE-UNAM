import React, { createContext, useContext } from 'react';

// Contexto para manejar el estado global del menú activo
const MenuContext = createContext({ activeMenu: null, setActiveMenu: () => {} });

// Hook personalizado para usar el contexto del menú
export const useMenuContext = () => useContext(MenuContext);

export default MenuContext;
