import { createContext, useContext } from 'react';

const MenuContext = createContext({ activeMenu: null, setActiveMenu: () => {} });

export const useMenuContext = () => useContext(MenuContext);

export default MenuContext;
