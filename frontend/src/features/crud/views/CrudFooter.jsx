import React from 'react';

/**
 * Componente CrudFooter
 * @param {string} footerTitle - Título del footer
 * @param {string} footerDescription - Descripción del footer
 * @param {string} footerTitleClassName - Clases CSS opcionales para el título
 * @param {string} footerDescriptionClassName - Clases CSS opcionales para la descripción
 * @param {Array} actions - Array de acciones con: text, color, font, icon, onClick
 */
function CrudFooter({
  footerTitle,
  footerDescription,
  footerTitleClassName,
  footerDescriptionClassName,
  actions = []
}) {
  const hasContent = footerTitle || footerDescription || actions.length > 0;
  if (!hasContent) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        {/* Título y descripción - Izquierda */}
        <div className="min-w-0">
          {footerTitle && (
            <h2 className={`text-sm font-semibold text-gray-800 mb-0.5 ${footerTitleClassName || ''}`}>
              {footerTitle}
            </h2>
          )}
          {footerDescription && (
            <p className={`text-gray-500 text-xs ${footerDescriptionClassName || ''}`}>
              {footerDescription}
            </p>
          )}
        </div>

        {/* Acciones - Derecha */}
        {actions.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  action.font || 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
                style={action.color ? { backgroundColor: action.color } : undefined}
              >
                {action.icon && <span>{action.icon}</span>}
                <span>{action.text}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CrudFooter;
