import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import SidebarMenu from '@/shared/components/layout/SidebarMenu';

const ConfigSidebar = () => {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState({});

  const toggleMenu = (menuId) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

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

  const SchoolIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
      <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
    </svg>
  );

  const BookIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
    </svg>
  );

  const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  );

  const LinkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
    </svg>
  );

  const ChevronDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  );

  const menuItems = [
    {
      id: 'infraestructura',
      name: 'Infraestructura',
      icon: <BuildingIcon />,
      expanded: expandedMenus.infraestructura,
      children: [
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
        },
        {
          id: 'aulas',
          name: 'Aulas',
          icon: <SchoolIcon />,
          href: '/configuracion/aulas',
          active: location.pathname === '/configuracion/aulas'
        }
      ]
    },
    {
      id: 'academico',
      name: 'Académico',
      icon: <BookIcon />,
      expanded: expandedMenus.academico,
      children: [
        {
          id: 'cursos',
          name: 'Cursos',
          icon: <BookIcon />,
          href: '/configuracion/cursos',
          active: location.pathname === '/configuracion/cursos'
        },
        {
          id: 'docentes',
          name: 'Docentes',
          icon: <UserIcon />,
          href: '/configuracion/docentes',
          active: location.pathname === '/configuracion/docentes'
        }
      ]
    },
    {
      id: 'relaciones',
      name: 'Relaciones',
      icon: <LinkIcon />,
      expanded: expandedMenus.relaciones,
      children: [
        {
          id: 'curso_area',
          name: 'Curso-Área',
          icon: <LinkIcon />,
          href: '/configuracion/curso_area',
          active: location.pathname === '/configuracion/curso_area'
        },
        {
          id: 'docente_curso',
          name: 'Docente-Curso',
          icon: <LinkIcon />,
          href: '/configuracion/docente_curso',
          active: location.pathname === '/configuracion/docente_curso'
        }
      ]
    }
  ];

  return (
    <SidebarMenu 
      items={menuItems} 
      className="w-64" 
      expandable={true}
      expandedMenus={expandedMenus}
      onToggleMenu={toggleMenu}
    />
  );
};

export default ConfigSidebar;
