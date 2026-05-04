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
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-5">
      <div className="flex items-center justify-between gap-4">
        {/* Título y descripción - Izquierda */}
        <div className="min-w-0">
          <h1 className={`text-xl font-semibold text-gray-900 mb-1.5 tracking-tight ${titleClassName || ''}`}>
            {headerTitle}
          </h1>
          {headerDescription && (
            <p className={`text-gray-500 text-sm leading-relaxed ${descriptionClassName || ''}`}>
              {headerDescription}
            </p>
          )}
        </div>

        {/* Acciones - Derecha */}
        {actions.length > 0 && (
          <div className="flex items-center gap-2.5 shrink-0">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow ${
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
  );
}

export default CrudHeader;
