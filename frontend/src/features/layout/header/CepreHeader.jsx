import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/shared/context/AuthContext';
import logo from '@/shared/assets/images/unam-logo.png';

const CepreHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, activeRole, setActiveRole, logout } = useAuthContext();
  const roles = user?.roles || [];

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const LogOutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
      <polyline points="16 17 21 12 16 7"></polyline>
      <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
  );

  const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );

  const navLinkBase = "px-3 py-2 rounded-lg text-sm font-medium transition-colors";
  const navLink = `${navLinkBase} text-white/80 hover:text-white hover:bg-white/10`;
  const navLinkActive = `${navLinkBase} bg-white/15 text-white`;

  const userInitials = user ? `${user.nombres?.charAt(0) || ''}${user.apellidos?.charAt(0) || ''}` : '';
  const firstName = user ? user.nombres?.split(' ')[0] : '';

  return (
    <header className="bg-[#25346A] backdrop-blur border-b border-white/10 sticky top-0 z-50">
      <nav className="w-full px-3 sm:px-4 lg:px-5">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center gap-3">
                <div className="bg-white rounded-lg p-1 flex items-center justify-center">
                  <img
                    src={logo}
                    alt="UNAM"
                    className="h-9 w-auto object-contain"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-white leading-none">
                    CEPRE
                  </span>
                  <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wider leading-tight">
                    Universidad Nacional de Moquegua
                  </span>
                </div>
              </Link>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Link 
                to="/" 
                className={isActive('/') ? navLinkActive : navLink}
              >
                Inicio
              </Link>
              <Link 
                to="/configuracion" 
                className={isActive('/configuracion') ? navLinkActive : navLink}
              >
                Configuración
              </Link>
            </div>
            <div className="h-6 w-px bg-white/20" />
            {user && (
              <div ref={userMenuRef} className="relative">
                <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 bg-white/10 border border-white/15 hover:border-white/30 hover:bg-white/15 rounded-full pl-3 pr-2 py-1.5 transition-all"
                >
                  <span className="w-7 h-7 rounded-full bg-white/20 text-white text-xs font-bold flex items-center justify-center">
                    {userInitials}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      {firstName}
                    </span>
                    {activeRole && (
                      <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/15 text-white">
                        {activeRole}
                      </span>
                    )}
                  </div>
                  <svg className="h-4 w-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 overflow-hidden">
                    {/* User identity */}
                    <div className="px-4 py-2 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-full bg-[#25346A] text-white text-sm font-bold flex items-center justify-center">
                          {userInitials}
                        </span>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-slate-900 truncate">
                            {user.nombres} {user.apellidos}
                          </span>
                          <span className="text-xs text-[#25346A] font-medium truncate">
                            {activeRole || (roles.length > 0 ? roles[0].nombre : '')}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Profile link */}
                    <div className="border-b border-slate-100 py-1">
                      <Link
                        to="/perfil"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        Mi perfil
                      </Link>
                    </div>
                    {/* Role switcher */}
                    <div className="py-2">
                      <p className="px-4 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Cambiar rol
                      </p>
                      {roles.map((r) => (
                        <button
                          key={r.nombre}
                          onClick={() => {
                            setActiveRole(r.nombre);
                            setIsUserMenuOpen(false);
                          }}
                          className="flex items-center justify-between w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex flex-col items-start">
                            <span className="text-sm">{r.nombre}</span>
                            <span className="text-[10px] text-slate-400">Nivel {r.nivel}</span>
                          </div>
                          {activeRole === r.nombre && (
                            <span className="text-[#25346A]">
                              <CheckIcon />
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                    {/* Logout */}
                    <div className="border-t border-slate-100 pt-2 pb-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
                      >
                        <LogOutIcon />
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              <span className="sr-only">Abrir menú</span>
              {isMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-white/10">
            <div className="px-2 py-4 space-y-2">
              <Link
                to="/"
                className={`block px-3 py-2 rounded-lg text-base font-medium transition-colors ${isActive('/') ? 'bg-white/15 text-white' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
              >
                Inicio
              </Link>
              <Link
                to="/configuracion"
                className={`block px-3 py-2 rounded-lg text-base font-medium transition-colors ${isActive('/configuracion') ? 'bg-white/15 text-white' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
              >
                Configuración
              </Link>
              {user && (
                <div className="border-t border-white/10 pt-3 mt-2">
                  <div className="px-4 pb-3">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="w-10 h-10 rounded-full bg-white/20 text-white text-sm font-bold flex items-center justify-center">
                        {userInitials}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">
                          {user.nombres} {user.apellidos}
                        </span>
                        <span className="text-xs text-white/60 font-medium">
                          {activeRole || (roles.length > 0 ? roles[0].nombre : '')}
                        </span>
                      </div>
                    </div>
                    <Link
                      to="/perfil"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-white/80 hover:bg-white/10 transition-colors mb-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      Mi perfil
                    </Link>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">
                      Cambiar rol
                    </p>
                    <div className="space-y-1">
                      {roles.map((r) => (
                        <button
                          key={r.nombre}
                          onClick={() => {
                            setActiveRole(r.nombre);
                            setIsMenuOpen(false);
                          }}
                          className={`flex items-center justify-between w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                            activeRole === r.nombre
                              ? 'bg-white/15 text-white font-semibold'
                              : 'text-white/80 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex flex-col items-start">
                            <span className="text-sm">{r.nombre}</span>
                            <span className="text-[10px] text-white/40">Nivel {r.nivel}</span>
                          </div>
                          {activeRole === r.nombre && (
                            <span className="text-white">
                              <CheckIcon />
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-white/10">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-base font-medium text-red-300 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOutIcon />
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default CepreHeader;
