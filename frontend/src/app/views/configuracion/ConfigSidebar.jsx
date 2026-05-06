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

  const BookIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
    </svg>
  );

  const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  );

  const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  );

  const GridIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"></rect>
      <rect x="14" y="3" width="7" height="7"></rect>
      <rect x="3" y="14" width="7" height="7"></rect>
      <rect x="14" y="14" width="7" height="7"></rect>
    </svg>
  );

  const ChevronDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  );

  const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  );

  const TimetableIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"></rect>
      <line x1="3" y1="8" x2="21" y2="8"></line>
      <line x1="3" y1="13" x2="21" y2="13"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
      <line x1="9" y1="3" x2="9" y2="21"></line>
    </svg>
  );

  const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"></circle>
      <path d="M12 2v2"></path>
      <path d="M12 20v2"></path>
      <path d="M4.93 4.93l1.41 1.41"></path>
      <path d="M17.66 17.66l1.41 1.41"></path>
      <path d="M2 12h2"></path>
      <path d="M20 12h2"></path>
      <path d="M6.34 17.66l-1.41 1.41"></path>
      <path d="M19.07 4.93l-1.41 1.41"></path>
    </svg>
  );

  const UsersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  );

  const menuItems = [
    {
      id: 'infraestructura',
      name: 'Infraestructura',
      icon: <BuildingIcon />,
      href: '/configuracion/sedes_aulas',
      active: location.pathname === '/configuracion/sedes_aulas'
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
          id: 'areas_cursos',
          name: 'Áreas y Cursos',
          icon: <GridIcon />,
          href: '/configuracion/areas_cursos',
          active: location.pathname === '/configuracion/areas_cursos'
        },
        {
          id: 'docentes_cursos',
          name: 'Docentes y Cursos',
          icon: <UserIcon />,
          href: '/configuracion/docentes_cursos',
          active: location.pathname === '/configuracion/docentes_cursos'
        },
        {
          id: 'planes_academicos',
          name: 'Planes Académicos',
          icon: <BookIcon />,
          href: '/configuracion/planes_academicos',
          active: location.pathname === '/configuracion/planes_academicos'
        }
      ]
    },
    
    {
      id: 'horarios_y_turnos',
      name: 'Horarios y Turnos',
      icon: <ClockIcon />,
      expanded: expandedMenus.horarios_y_turnos,
      children: [
        {
          id: 'horarios_bloques',
          name: 'Plantillas de Horario',
          icon: <TimetableIcon />,
          href: '/configuracion/horarios_bloques',
          active: location.pathname === '/configuracion/horarios_bloques'
        },
        {
          id: 'turnos',
          name: 'Turnos',
          icon: <SunIcon />,
          href: '/configuracion/turnos',
          active: location.pathname === '/configuracion/turnos'
        }
      ]
    },
    {
      id: 'periodos_academicos',
      name: 'Periodos Academicos',
      icon: <CalendarIcon />,
      expanded: expandedMenus.programacion,
      children: [
        {
          id: 'periodos',
          name: 'Periodos',
          icon: <CalendarIcon />,
          href: '/configuracion/periodos',
          active: location.pathname === '/configuracion/periodos'
        },
        {
          id: 'plazas_docentes',
          name: 'Plazas Docentes',
          icon: <UserIcon />,
          href: '/configuracion/plazas_docentes',
          active: location.pathname === '/configuracion/plazas_docentes'
        },
        {
          id: 'grupos',
          name: 'Grupos',
          icon: <UsersIcon />,
          href: '/configuracion/grupos',
          active: location.pathname === '/configuracion/grupos'
        },
        {
          id: 'programacion_grupo',
          name: 'Programación de Grupo',
          icon: <TimetableIcon />,
          href: '/configuracion/programacion_grupo',
          active: location.pathname === '/configuracion/programacion_grupo'
        },
        {
          id: 'programacion_plazas_docentes',
          name: 'Programación por Plaza',
          icon: <TimetableIcon />,
          href: '/configuracion/programacion_plazas_docentes',
          active: location.pathname === '/configuracion/programacion_plazas_docentes'
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
