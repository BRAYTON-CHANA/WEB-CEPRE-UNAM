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
  return (
    <div className="mt-6">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Título y descripción - Izquierda */}
          <div className="ml-4">
            {footerTitle && (
              <h2 className={`text-lg font-semibold text-gray-700 mb-1 ${footerTitleClassName || ''}`}>
                {footerTitle}
              </h2>
            )}
            {footerDescription && (
              <p className={`text-gray-500 text-sm ${footerDescriptionClassName || ''}`}>
                {footerDescription}
              </p>
            )}
          </div>

          {/* Acciones - Derecha */}
          {actions.length > 0 && (
            <div className="flex items-center gap-3 mr-4">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors text-sm ${
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
    </div>
  );
}

export default CrudFooter;
