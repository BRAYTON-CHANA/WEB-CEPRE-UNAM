import React from 'react';

/**
 * SectionAccordion — sección colapsable con header compacto.
 * Reemplaza al CrudHeader + toggle suelto por un diseño tipo acordeón.
 *
 * @param {ReactNode} icon - icono SVG o emoji
 * @param {string} title - título de la sección
 * @param {number} [count] - contador opcional de items
 * @param {Array} [actions] - [{ text, onClick, font }] botones al final del header
 * @param {boolean} isCollapsed - si está contraída
 * @param {Function} onToggle - callback al hacer toggle
 * @param {ReactNode} children - contenido colapsable
 */
function SectionAccordion({
  icon,
  title,
  actions = [],
  isCollapsed,
  onToggle,
  children
}) {
  return (
    <div className="space-y-4">
      {/* Header compacto del acordeón */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-white rounded-xl border border-gray-100 shadow-sm">
        {/* Botón toggle (icono + título + chevron) */}
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-3 flex-1 min-w-0 text-left group"
        >
          {/* Icono */}
          {icon && (
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 text-gray-500 group-hover:bg-gray-100 transition-colors shrink-0">
              {icon}
            </span>
          )}
          {/* Título */}
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-base font-semibold text-gray-800 truncate">
              {title}
            </h2>
          </div>
          {/* Chevron */}
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ${isCollapsed ? '' : 'rotate-180'}`}
            fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Acciones (botones) — click NO hace toggle */}
        {actions.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            {actions.map((action, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick?.();
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow ${
                  action.font || 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {action.icon && <span>{action.icon}</span>}
                <span>{action.text}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Contenido colapsable */}
      {!isCollapsed && (
        <div className="transition-all duration-200">
          {children}
        </div>
      )}
    </div>
  );
}

export default SectionAccordion;
