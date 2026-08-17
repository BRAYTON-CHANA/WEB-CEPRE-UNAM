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
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        const year  = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day   = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}/${month}/${day}`;
        if (columnType === 'datetime') {
          const hours   = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          return <span>{`${dateStr} ${hours}:${minutes}`}</span>;
        }
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
