import React from 'react';

/**
 * Componente simplificado para renderizar acciones de fila
 * Maneja acciones personalizadas, editar y eliminar
 */
const TableActions = ({ 
  actions, 
  row, 
  rowIndex, 
  cellClassName 
}) => {
  const renderActionIcon = (iconName) => {
    const iconClass = "w-4 h-4";
    
    switch (iconName) {
      case 'plus':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 5v14m-7-7h14" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'edit':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'trash':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'eye':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex gap-2">
      {/* Acciones personalizadas */}
      {actions?.custom?.map((customAction, actionIndex) => (
        <button
          key={actionIndex}
          onClick={() => customAction.onClick(row, rowIndex)}
          className={`p-2 rounded transition-colors ${
            customAction.className || 'text-gray-600 hover:bg-gray-100'
          }`}
          title={customAction.label}
        >
          {renderActionIcon(customAction.icon)}
        </button>
      ))}
      
      {/* Botón de editar */}
      {actions?.edit?.enabled && (
        <button
          onClick={() => actions.edit.onClick(row, rowIndex)}
          className={`p-2 rounded transition-colors ${
            actions.edit.className || 'text-blue-600 hover:bg-blue-100'
          }`}
          title={actions.edit.label || 'Editar'}
        >
          {renderActionIcon(actions.edit.icon || 'edit')}
        </button>
      )}
      
      {/* Botón de eliminar */}
      {actions?.delete?.enabled && (
        <button
          onClick={() => actions.delete.onClick(row, rowIndex)}
          className={`p-2 rounded transition-colors ${
            actions.delete.className || 'text-red-600 hover:bg-red-100'
          }`}
          title={actions.delete.label || 'Eliminar'}
        >
          {renderActionIcon(actions.delete.icon || 'trash')}
        </button>
      )}
    </div>
  );
};

export default TableActions;
