import React, { useState, useEffect, useRef } from 'react';
import { usePeriodo } from '@/shared/context/PeriodoContext';

/**
 * PeriodoSelector — selector del periodo de trabajo global.
 * Pill blanca sólida sobre el header navy: máximo contraste, contexto visible.
 * variant 'desktop' (pill) | 'mobile' (lista).
 */
const PeriodoSelector = ({ variant = 'desktop', onSelect }) => {
  const { periodo, periodoObj, periodos, setPeriodo, refreshPeriodos, loading, error } = usePeriodo();
  const [open, setOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activos = periodos.filter(p => p.ACTIVO);
  if (!error && (loading || activos.length === 0)) return null;

  const ErrorIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.054 0 1.746-1.066 1.345-2.028l-6.928-15.974c-.498-1.148-2.079-1.148-2.577 0L3.721 18.972C3.32 19.934 4.012 21 5.066 21z" />
    </svg>
  );

  if (error) {
    if (variant === 'mobile') {
      return (
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between mb-1">
            <p className="flex items-center gap-1.5 text-[10px] font-bold text-white/50 uppercase tracking-widest">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
              Periodo Académico
            </p>
          </div>
          <div className="rounded-lg bg-red-500/15 border border-red-400/30 p-3">
            <div className="flex items-start gap-2">
              <ErrorIcon className="h-4 w-4 text-red-300 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-100 leading-snug">Error al cargar periodos</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-100 bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50 rounded-md transition-colors"
            >
              <svg className={`h-3.5 w-3.5 ${refreshing || loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M20 9a8 8 0 00-14.9-3M4 15a8 8 0 0014.9 3" />
              </svg>
              {refreshing || loading ? 'Recargando...' : 'Reintentar'}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="relative">
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="group flex items-center gap-2 rounded-full bg-red-50 border border-red-200 pl-3 pr-2.5 py-1.5 transition-all hover:bg-red-100 disabled:opacity-60"
          title="Error al cargar periodos"
        >
          <ErrorIcon className="h-3.5 w-3.5 text-red-500" />
          <span className="text-sm font-bold text-red-700 tracking-wide">Error al cargar periodos</span>
          <span className="w-px h-4 bg-red-200 mx-0.5" />
          <svg className={`h-3.5 w-3.5 text-red-600 ${refreshing || loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M20 9a8 8 0 00-14.9-3M4 15a8 8 0 0014.9 3" />
          </svg>
          <span className="text-xs font-semibold text-red-600">
            {refreshing || loading ? 'Recargando...' : 'Reintentar'}
          </span>
        </button>
      </div>
    );
  }

  const handlePick = (id) => {
    setPeriodo(id);
    setOpen(false);
    onSelect?.();
  };

  const handleRefresh = async (e) => {
    e.stopPropagation();
    if (refreshing) return;
    setRefreshing(true);
    try {
      await refreshPeriodos();
    } finally {
      // Mínimo visible para que la animación se perciba
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const RefreshButton = ({ className, iconClassName }) => (
    <button
      onClick={handleRefresh}
      disabled={refreshing}
      className={className}
      title="Refrescar periodos"
    >
      <svg className={`${iconClassName} ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M20 9a8 8 0 00-14.9-3M4 15a8 8 0 0014.9 3" />
      </svg>
    </button>
  );

  const CheckIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5" />
    </svg>
  );

  if (variant === 'mobile') {
    return (
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between mb-1">
          <p className="flex items-center gap-1.5 text-[10px] font-bold text-white/50 uppercase tracking-widest">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Periodo Académico
          </p>
          <RefreshButton
            className="p-1 rounded text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            iconClassName="h-3.5 w-3.5"
          />
        </div>
        <div className="space-y-1">
          {activos.map((p) => {
            const isCurrent = periodo === p.ID_PERIODO;
            return (
              <button
                key={p.ID_PERIODO}
                onClick={() => handlePick(p.ID_PERIODO)}
                className={`flex items-center justify-between w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  isCurrent
                    ? 'bg-white text-[#25346A] font-semibold'
                    : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <span className="flex items-center gap-2">
                  {p.NOMBRE_PERIODO}
                </span>
                {isCurrent && <CheckIcon className="h-3.5 w-3.5 text-[#25346A]" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`group flex items-center gap-2 rounded-full bg-white pl-3 pr-2.5 py-1.5 transition-all ${
          open
            ? 'shadow-[0_0_0_3px_rgba(255,255,255,0.25)]'
            : 'hover:shadow-md'
        }`}
        title="Periodo Académico"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <svg className="h-3.5 w-3.5 text-[#25346A]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-sm font-bold text-[#25346A] tracking-wide">
          {periodoObj?.NOMBRE_PERIODO || 'Periodo'}
        </span>
        <svg
          className={`h-3.5 w-3.5 text-[#25346A]/50 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 mt-2.5 w-60 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-100">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Periodo Académico
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold text-slate-400">
                {activos.length} {activos.length === 1 ? 'activo' : 'activos'}
              </span>
              <RefreshButton
                className="p-1 rounded text-slate-400 hover:text-[#25346A] hover:bg-slate-200 transition-colors"
                iconClassName="h-3.5 w-3.5"
              />
            </div>
          </div>
          <div className="py-1.5">
            {activos.map((p) => {
              const isCurrent = periodo === p.ID_PERIODO;
              return (
                <button
                  key={p.ID_PERIODO}
                  onClick={() => handlePick(p.ID_PERIODO)}
                  className={`group flex items-center justify-between w-full text-left px-4 py-2 text-sm transition-colors border-l-2 ${
                    isCurrent
                      ? 'bg-slate-100 border-[#25346A] text-slate-900 font-semibold'
                      : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {p.NOMBRE_PERIODO}
                  </span>
                  {isCurrent && <CheckIcon className="h-3.5 w-3.5 text-[#25346A]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PeriodoSelector;
