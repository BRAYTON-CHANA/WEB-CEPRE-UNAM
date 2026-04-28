import React from 'react';

/**
 * Componente CrudHeader
 * @param {string} headerTitle - Título del CRUD
 * @param {string} headerDescription - Descripción del CRUD
 * @param {string} titleClassName - Clases CSS opcionales para el título
 * @param {string} descriptionClassName - Clases CSS opcionales para la descripción
 * @param {Array} actions - Array de acciones con: text, color, font, icon, onClick
 */
function CrudHeader({ 
  headerTitle, 
  headerDescription, 
  titleClassName,
  descriptionClassName,
  actions = [] 
}) {
  return (
    <div>
      <div className="container mx-auto px-4 py-0 mt-6">
        <div className="flex items-center justify-between">
          {/* Título y descripción - Izquierda */}
          <div className="ml-1">
            <h1 className={`text-2xl font-bold text-gray-900 mb-1 ${titleClassName || ''}`}>
              {headerTitle}
            </h1>
            {headerDescription && (
              <p className={`text-gray-600 text-sm ${descriptionClassName || ''}`}>
                {headerDescription}
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
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                    action.font || 'bg-blue-600 hover:bg-blue-700 text-white'
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

export default CrudHeader;
