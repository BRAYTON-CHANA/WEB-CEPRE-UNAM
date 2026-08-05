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

  const CarrerasIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
      <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
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

  const FileTextIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  );

  const SettingsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
  );

  const MailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
      <polyline points="22,6 12,13 2,6"></polyline>
    </svg>
  );

  const InboxIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline>
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
    </svg>
  );

  const TagIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
      <line x1="7" y1="7" x2="7.01" y2="7"></line>
    </svg>
  );

  const KeyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 0 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
    </svg>
  );

  const ServerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
      <line x1="6" y1="6" x2="6.01" y2="6"></line>
      <line x1="6" y1="18" x2="6.01" y2="18"></line>
    </svg>
  );

  const LinkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
    </svg>
  );

  const menuItems = [
    {
      id: 'sistema',
      name: 'Sistema',
      icon: <SettingsIcon />,
      expanded: expandedMenus.sistema,
      children: [
        {
          id: 'usuarios',
          name: 'Usuarios',
          icon: <UserIcon />,
          href: '/configuracion/sistema/usuarios',
          active: location.pathname === '/configuracion/sistema/usuarios'
        },
        {
          id: 'roles',
          name: 'Roles',
          icon: <UserIcon />,
          href: '/configuracion/sistema/roles',
          active: location.pathname === '/configuracion/sistema/roles'
        },
        {
          id: 'permisos',
          name: 'Permisos',
          icon: <GridIcon />,
          href: '/configuracion/sistema/permisos',
          active: location.pathname === '/configuracion/sistema/permisos'
        }
      ]
    },
    {
      id: 'correos',
      name: 'Correos',
      icon: <MailIcon />,
      expanded: expandedMenus.correos,
      children: [
        {
          id: 'correos',
          name: 'Correos',
          icon: <InboxIcon />,
          href: '/configuracion/correos/correos',
          active: location.pathname === '/configuracion/correos/correos'
        },
        {
          id: 'tipos_correo',
          name: 'Tipos de Correo',
          icon: <TagIcon />,
          href: '/configuracion/correos/tipos',
          active: location.pathname === '/configuracion/correos/tipos'
        },
        {
          id: 'password_reset',
          name: 'Códigos de Reset',
          icon: <KeyIcon />,
          href: '/configuracion/correos/password-reset',
          active: location.pathname === '/configuracion/correos/password-reset'
        },
        {
          id: 'cuentas_smtp',
          name: 'Cuentas SMTP',
          icon: <ServerIcon />,
          href: '/configuracion/correos/cuentas-smtp',
          active: location.pathname === '/configuracion/correos/cuentas-smtp'
        },
        {
          id: 'asignacion_cuentas_sedes',
          name: 'Asignación Cuentas x Sede',
          icon: <LinkIcon />,
          href: '/configuracion/correos/asignacion-cuentas-sedes',
          active: location.pathname === '/configuracion/correos/asignacion-cuentas-sedes'
        }
      ]
    },
    {
      id: 'infraestructura',
      name: 'Infraestructura',
      icon: <BuildingIcon />,
      href: '/configuracion/infraestructura',
      active: location.pathname === '/configuracion/infraestructura'
    },
    {
      id: 'academico',
      name: 'Académico',
      icon: <BookIcon />,
      expanded: expandedMenus.academico,
      children: [
        {
          id: 'areas',
          name: 'Áreas',
          icon: <GridIcon />,
          href: '/configuracion/academico/areas',
          active: location.pathname === '/configuracion/academico/areas'
        },
        {
          id: 'cursos',
          name: 'Cursos',
          icon: <BookIcon />,
          href: '/configuracion/academico/cursos',
          active: location.pathname === '/configuracion/academico/cursos'
        },
        {
          id: 'carreras',
          name: 'Carreras',
          icon: <CarrerasIcon />,
          href: '/configuracion/academico/carreras',
          active: location.pathname === '/configuracion/academico/carreras'
        },
        {
          id: 'docentes',
          name: 'Docentes',
          icon: <UserIcon />,
          href: '/configuracion/academico/docentes',
          active: location.pathname === '/configuracion/academico/docentes'
        },
        {
          id: 'planes_academicos',
          name: 'Planes Académicos',
          icon: <BookIcon />,
          href: '/configuracion/academico/planes_academicos',
          active: location.pathname === '/configuracion/academico/planes_academicos'
        }
      ]
    },
    
    {
      id: 'horarios',
      name: 'Horarios',
      icon: <ClockIcon />,
      expanded: expandedMenus.horarios,
      children: [
        {
          id: 'horarios_bloques',
          name: 'Plantillas de Horario',
          icon: <TimetableIcon />,
          href: '/configuracion/horarios',
          active: location.pathname === '/configuracion/horarios'
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
          href: '/configuracion/periodo_academico/periodos',
          active: location.pathname === '/configuracion/periodo_academico/periodos'
        },
        {
          id: 'plazas_docentes',
          name: 'Plazas Docentes',
          icon: <UserIcon />,
          href: '/configuracion/periodo_academico/plazas_docentes',
          active: location.pathname === '/configuracion/periodo_academico/plazas_docentes'
        },
        {
          id: 'grupos',
          name: 'Grupos',
          icon: <UsersIcon />,
          href: '/configuracion/periodo_academico/grupos',
          active: location.pathname === '/configuracion/periodo_academico/grupos'
        },
        {
          id: 'postulantes',
          name: 'Postulantes',
          icon: <UserIcon />,
          href: '/configuracion/periodo_academico/postulantes',
          active: location.pathname === '/configuracion/periodo_academico/postulantes'
        },
        {
          id: 'programacion_grupo',
          name: 'Programación de Grupo',
          icon: <TimetableIcon />,
          href: '/configuracion/periodo_academico/programacion_grupo',
          active: location.pathname === '/configuracion/periodo_academico/programacion_grupo'
        },
        {
          id: 'programacion_plazas_docentes',
          name: 'Programación por Plaza (En mantenimiento)',
          icon: <TimetableIcon />,
          disabled: true,
          active: false
        }
      ]
    },
    {
      id: 'reportes',
      name: 'Reportes',
      icon: <FileTextIcon />,
      expanded: expandedMenus.reportes,
      children: [
        {
          id: 'reportes_grupos',
          name: 'Grupos',
          icon: <UsersIcon />,
          href: '/configuracion/reportes/grupos',
          active: location.pathname === '/configuracion/reportes/grupos'
        },
        {
          id: 'reportes_plazas',
          name: 'Plazas Docentes',
          icon: <UserIcon />,
          href: '/configuracion/reportes/plazas',
          active: location.pathname === '/configuracion/reportes/plazas'
        },
        {
          id: 'reportes_docentes',
          name: 'Docentes',
          icon: <UserIcon />,
          href: '/configuracion/reportes/docentes',
          active: location.pathname === '/configuracion/reportes/docentes'
        }
      ]
    },
  ];

  return (
    <SidebarMenu 
      items={menuItems} 
      className="w-[250px]" 
      expandable={true}
      expandedMenus={expandedMenus}
      onToggleMenu={toggleMenu}
    />
  );
};

export default ConfigSidebar;
