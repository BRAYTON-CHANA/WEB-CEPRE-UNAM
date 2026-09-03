import React from 'react';

/**
 * Utilidades reutilizables para renderizado de celdas
 */

/**
 * Renderiza una celda según el tipo de dato (reutilizable)
 * @param {*} value - Valor a renderizar
 * @param {number} rowIndex - Índice de la fila
 * @param {string} header - Nombre de la columna
 * @param {string} columnType - Tipo de la columna (opcional)
 * @returns {React.ReactNode} - Elemento React renderizado
 */
/**
 * Paleta de colores por defecto para el tipo 'badge'.
 * Se puede sobreescribir con el prop `colorMap` del header.
 * Las claves son los posibles valores del campo (case-insensitive).
 */
const DEFAULT_BADGE_COLORS = {
  activo:    'bg-green-100 text-green-700',
  active:    'bg-green-100 text-green-700',
  inactivo:  'bg-red-100 text-red-700',
  inactive:  'bg-red-100 text-red-700',
  pendiente: 'bg-yellow-100 text-yellow-700',
  pending:   'bg-yellow-100 text-yellow-700',
  aprobado:  'bg-blue-100 text-blue-700',
  approved:  'bg-blue-100 text-blue-700',
  rechazado: 'bg-red-100 text-red-700',
  rejected:  'bg-red-100 text-red-700',
  cancelado: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-gray-100 text-gray-600',
  completado:'bg-emerald-100 text-emerald-700',
  completed: 'bg-emerald-100 text-emerald-700',
};

export const renderCell = (value, rowIndex, header, columnType, colorMap) => {
  // ── Badge ────────────────────────────────────────────────────────────────
  if (columnType === 'badge') {
    if (value === null || value === undefined) return <span className="text-gray-400">-</span>;
    const key = String(value).toLowerCase();
    const palette = colorMap || DEFAULT_BADGE_COLORS;
    const colorClass = palette[key] || 'bg-gray-100 text-gray-600';
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        {String(value)}
      </span>
    );
  }

  // ── Tag-list (array de chips) ─────────────────────────────────────────────
  if (columnType === 'tag-list') {
    const items = Array.isArray(value) ? value : (value ? [value] : []);
    if (items.length === 0) return <span className="text-gray-400">-</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {items.map((item, idx) => (
          <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 font-medium">
            {String(item)}
          </span>
        ))}
      </div>
    );
  }

  // ── Currency ──────────────────────────────────────────────────────────────
  if (columnType === 'currency') {
    if (value === null || value === undefined) return <span className="text-gray-400">-</span>;
    return (
      <span className="font-mono text-sm">
        {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(Number(value))}
      </span>
    );
  }

  // ── Link ──────────────────────────────────────────────────────────────────
  if (columnType === 'link') {
    if (!value) return <span className="text-gray-400">-</span>;
    return (
      <a
        href={String(value)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline text-sm truncate max-w-[200px] inline-block"
        onClick={(e) => e.stopPropagation()}
      >
        {String(value)}
      </a>
    );
  }

  // ── Action-badge: botón clickable con label, colorClass, icon, onClick ────
  if (columnType === 'action-badge') {
    if (!value || typeof value !== 'object') return <span className="text-gray-400">-</span>;

    // Modo multi-acción: { actions: [{ label, colorClass, icon, onClick, title }] }
    if (Array.isArray(value.actions)) {
      return (
        <div className="inline-flex items-center gap-1.5">
          {value.label && (
            <span className="text-xs text-gray-600 truncate max-w-[140px]" title={value.title || value.label}>
              {value.label}
            </span>
          )}
          {value.actions.map((action, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (action.onClick) action.onClick();
              }}
              className={`inline-flex items-center justify-center rounded p-1 transition-colors ${action.colorClass || 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
              title={action.title || action.label}
            >
              {action.icon === 'eye' && (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
              {action.icon === 'replace' && (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              )}
              {action.icon === 'upload' && (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      );
    }

    // Modo single: { label, colorClass, icon, onClick }
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (value.onClick) value.onClick();
        }}
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${value.colorClass || 'bg-gray-100 text-gray-600'} hover:opacity-80 cursor-pointer transition-opacity ${value.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={value.disabled}
        title={value.title || value.label}
      >
        {value.icon === 'eye' && (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
        {value.label}
      </button>
    );
  }

  // ── Stacked: se llama con value = { primary, secondary } ──────────────────
  if (columnType === 'stacked') {
    if (!value || typeof value !== 'object') return <span className="text-gray-400">-</span>;
    return (
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-900">{value.primary ?? '-'}</span>
        {value.secondary !== undefined && value.secondary !== null && (
          <span className="text-xs text-gray-500">{value.secondary}</span>
        )}
      </div>
    );
  }

  // ── Info-card: { title, tags: [{label, value, colorClass}] } ───────────────
  if (columnType === 'info-card') {
    if (!value || typeof value !== 'object') return <span className="text-gray-400">-</span>;
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-gray-900 text-sm">{value.title}</span>
        {Array.isArray(value.tags) && value.tags.map((tag, idx) => (
          <span key={idx} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tag.colorClass || 'bg-gray-100 text-gray-700'}`}>
            {tag.label}{tag.value !== '' && tag.value !== undefined && tag.value !== null ? (
              <span className="ml-1 font-bold">{tag.value}</span>
            ) : null}
          </span>
        ))}
      </div>
    );
  }

  // ── Manejo de valores nulos o indefinidos ─────────────────────────────────
  if (value === null || value === undefined) {
    return <span className="text-gray-400">-</span>;
  }
  
  // ── Boolean ───────────────────────────────────────────────────────────────
  if (columnType === 'boolean' && (typeof value === 'boolean' || value === 1 || value === 0)) {
    const isTrue = value === true || value === 1;
    return (
      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium ${
        isTrue ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
      }`}>
        {isTrue ? '✓' : '✕'}
      </span>
    );
  }
  
  // ── Date / Datetime ───────────────────────────────────────────────────────
  if ((columnType === 'date' || columnType === 'datetime') && value) {
    try {
      if (columnType === 'datetime') {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          const dateStr = date.toLocaleDateString('es-PE', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' });
          const timeStr = date.toLocaleTimeString('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit', hour12: false });
          return <span>{`${dateStr} ${timeStr}`}</span>;
        }
      }
      // date puro: evitar conversión de zona horaria.
      // PostgreSQL DATE llega como "YYYY-MM-DD"; new Date() lo parsea como UTC medianoche
      // y toLocaleDateString con timeZone: 'America/Lima' (UTC-5) lo muestra un día antes.
      // Solución: parsear como fecha local (año, mes, día) y formatear sin timeZone.
      const str = String(value);
      const m = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (m) {
        const localDate = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
        const dateStr = localDate.toLocaleDateString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit' });
        return <span>{dateStr}</span>;
      }
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        const dateStr = date.toLocaleDateString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit' });
        return <span>{dateStr}</span>;
      }
    } catch (e) {
      // Si falla el parsing, retornar el valor original
    }
  }
  
  // ── Color ─────────────────────────────────────────────────────────────────
  if (columnType === 'color' && value) {
    const hexColor = String(value).startsWith('#') ? String(value) : `#${value}`;
    return (
      <div className="flex items-center gap-2">
        <div 
          className="w-6 h-6 rounded-full border-2 border-gray-300 shadow-sm flex-shrink-0"
          style={{ backgroundColor: hexColor }}
          title={hexColor}
        />
        <span className="text-xs font-mono text-gray-600">{hexColor.toUpperCase()}</span>
      </div>
    );
  }
  
  // ── Objetos genéricos ─────────────────────────────────────────────────────
  if (typeof value === 'object' && !Array.isArray(value)) {
    return <span className="text-xs text-gray-600">{JSON.stringify(value)}</span>;
  }
  
  // ── Arrays genéricos ──────────────────────────────────────────────────────
  if (Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1">
        {value.map((item, idx) => (
          <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-800 text-white font-medium shadow-sm">
            {item}
          </span>
        ))}
      </div>
    );
  }
  
  return String(value);
};

/**
 * Formatea un valor para mostrar en la tabla (reutilizable)
 * @param {*} value - Valor a formatear
 * @param {string} type - Tipo de formateo ('currency', 'date', 'percentage')
 * @param {string} locale - Configuración regional (por defecto 'es-ES')
 * @returns {string} - Valor formateado
 */
export const formatCellValue = (value, type = 'text', locale = 'es-ES') => {
  if (value === null || value === undefined) return '-';
  
  switch (type) {
    case 'currency':
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'EUR'
      }).format(value);
    
    case 'date':
      if (value instanceof Date) {
        return value.toLocaleDateString(locale);
      }
      return new Date(value).toLocaleDateString(locale);
    
    case 'percentage':
      return new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: 2
      }).format(value);
    
    case 'number':
      return new Intl.NumberFormat(locale).format(value);
    
    default:
      return String(value);
  }
};
