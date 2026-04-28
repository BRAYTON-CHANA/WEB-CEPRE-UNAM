import React from 'react';
import { useLocation } from 'react-router-dom';
import SidebarMenu from '@/shared/components/layout/SidebarMenu';

const ConfigSidebar = () => {
  const location = useLocation();

  // Iconos SVG simples
  const BuildingIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
      <path d="M9 22v-4h6v4"></path>
      <path d="M8 6h.01"></path>
      <path d="M16 6h.01"></path>
      <path d="M12 6h.01"></path>
      <path d="M12 10h.01"></path>
      <path d="M12 14h.01"></path>
      <path d="M16 10h.01"></path>
      <path d="M16 14h.01"></path>
      <path d="M8 10h.01"></path>
      <path d="M8 14h.01"></path>
    </svg>
  );

  const MapIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
      <line x1="8" y1="2" x2="8" y2="18"></line>
      <line x1="16" y1="6" x2="16" y2="22"></line>
    </svg>
  );

  const menuItems = [
    {
      id: 'sedes',
      name: 'Sedes',
      icon: <BuildingIcon />,
      href: '/configuracion/sedes',
      active: location.pathname === '/configuracion/sedes'
    },
    {
      id: 'areas',
      name: 'Áreas',
      icon: <MapIcon />,
      href: '/configuracion/areas',
      active: location.pathname === '/configuracion/areas'
    }
  ];

  return (
    <SidebarMenu items={menuItems} className="w-64" />
  );
};

export default ConfigSidebar;
