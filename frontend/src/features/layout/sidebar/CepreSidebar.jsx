import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/shared/context/AuthContext';
import { getRoleFlags } from '@/shared/utils/roles';
import logoCepre from '@/shared/assets/images/logo.png';

const ClipboardCheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
    <rect x="8" y="2" width="8" height="4" rx="1"></rect>
    <path d="M9 12l2 2 4-4"></path>
  </svg>
);

const UserCheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="8.5" cy="7" r="4"></circle>
    <polyline points="17 11 19 13 23 9"></polyline>
  </svg>
);

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const ArrowIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);

const CepreSidebar = () => {
  const location = useLocation();
  const { user, activeRole } = useAuthContext();
  const { esDocente, puedeVerAsistenciasViejo, puedeVerAsistenciasNuevo } = getRoleFlags(user, activeRole);

  const menuItems = [
    {
      id: 'horario',
      name: 'Horario',
      description: 'Tu horario de clases del período',
      icon: <CalendarIcon />,
      href: '/horario',
      active: location.pathname.startsWith('/horario'),
      hidden: !esDocente
    },
    {
      id: 'asistencias',
      name: 'Asistencias',
      description: 'Gestión, marcación y reportes de asistencia',
      icon: <ClipboardCheckIcon />,
      href: '/asistencias',
      active: location.pathname === '/asistencias' || location.pathname.startsWith('/asistencias/'),
      hidden: !puedeVerAsistenciasViejo
    },
    {
      id: 'asistencia_estudiantes',
      name: 'Asistencia Estudiantes',
      description: 'Registro de asistencia por sesión de clase',
      icon: <UserCheckIcon />,
      href: '/asistencias_nuevo/estudiantes',
      active: location.pathname.startsWith('/asistencias_nuevo'),
      hidden: !puedeVerAsistenciasNuevo
    }
  ];

  return (
    <aside className="sidebar-menu !w-[260px] h-full shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)]">
      {/* ── Header institucional ── */}
      <div className="px-4 pt-5 pb-4 border-b-2 border-[#43B3C1]/25 bg-gradient-to-br from-[#43B3C1]/10 to-[#25346A]/5">
        <div className="flex items-center gap-3">
          <img
            src={logoCepre}
            alt="CEPRE UNAM"
            className="h-14 w-14 object-contain shrink-0"
          />
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-bold text-[#25346A] uppercase leading-snug tracking-wide">
              Centro de Estudios Preuniversitario
            </span>
            <span className="text-[10px] font-normal text-slate-500 leading-tight mt-1">
              Universidad Nacional de Moquegua
            </span>
          </div>
        </div>
      </div>

      {/* ── Items en bloques integrados al sidebar ── */}
      <nav className="flex-1 py-2 overflow-y-auto divide-y divide-slate-200/70">
        {menuItems.filter(i => !i.hidden).map(item => (
          <Link
            key={item.id}
            to={item.href}
            className={`group flex items-center gap-3.5 px-5 py-4 border-l-[3px] transition-all duration-200 ${
              item.active
                ? 'border-[#43B3C1] bg-[#43B3C1]/15'
                : 'border-transparent hover:bg-[#43B3C1]/10 hover:border-[#43B3C1]/40'
            }`}
          >
            <span className={`inline-flex items-center justify-center w-11 h-11 shrink-0 transition-colors duration-200 ${
              item.active ? 'text-[#43B3C1]' : 'text-[#25346A] group-hover:text-[#43B3C1]'
            }`}>
              {item.icon}
            </span>
            <span className="flex-1 min-w-0">
              <span className={`block text-sm font-bold leading-tight ${
                item.active ? 'text-[#25346A]' : 'text-slate-700'
              }`}>
                {item.name}
              </span>
              <span className="block text-[11px] text-slate-500 leading-snug mt-0.5">
                {item.description}
              </span>
            </span>
            <span className={`shrink-0 transition-all duration-200 ${
              item.active
                ? 'text-[#43B3C1] opacity-100'
                : 'text-slate-300 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-[#43B3C1]'
            }`}>
              <ArrowIcon />
            </span>
          </Link>
        ))}
      </nav>
    </aside>
  );
};

CepreSidebar.displayName = 'CepreSidebar';

export default CepreSidebar;
