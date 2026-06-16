import React from 'react';

/**
 * Componente reutilizable para botón de crear
 * @param {Object} action - Configuración de la acción de crear
 * @param {boolean} loading - Estado de carga
 */
const CreateButton = ({ action, loading }) => {
  if (!action?.enabled) return null;

  const renderIcon = (iconName) => {
    switch (iconName) {
      case 'plus':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 5v14m-7-7h14" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <button
      onClick={action.onClick}
      className={`px-4 py-2 rounded transition-colors flex items-center gap-2 ${
        action.className || 'bg-green-600 text-white hover:bg-green-700'
      }`}
      disabled={loading}
    >
      {renderIcon(action.icon)}
      {action.label || 'Añadir'}
    </button>
  );
};

export default CreateButton;
