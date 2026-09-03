import React from 'react';

/**
 * FormSection - Wrapper visual para agrupar campos de formulario en secciones
 * Muestra título, descripción y un contenedor estilizado para los campos
 */
const FormSection = ({
  // Identificación
  id,

  // Contenido
  title = '',
  description = '',

  // Children (campos del formulario)
  children,

  // Layout de columnas
  columns = 1,

  // Opciones de estilo
  variant = 'default', // 'default' | 'bordered' | 'card'
  className = '',

  // Estado
  isActive = true,
  isCompleted = false
}) => {
  /**
   * Variantes de estilo
   */
  const variantClasses = {
    default: 'bg-white',
    bordered: 'bg-white border border-gray-200 rounded-lg p-6',
    card: 'bg-white shadow-md rounded-lg p-6 border border-gray-100',
    plain: ''
  };

  /**
   * Clases de grid según número de columnas
   * Responsive: 1 columna en móvil, N columnas desde md (768px+)
   */
  const gridColsClass = {
    1: 'grid grid-cols-1 gap-4',
    2: 'grid grid-cols-1 md:grid-cols-2 gap-4',
    3: 'grid grid-cols-1 md:grid-cols-3 gap-4',
    4: 'grid grid-cols-1 md:grid-cols-4 gap-4',
    5: 'grid grid-cols-1 md:grid-cols-5 gap-4',
    6: 'grid grid-cols-1 md:grid-cols-6 gap-4'
  };

  const fieldsContainerClass = columns > 1
    ? (gridColsClass[columns] || gridColsClass[6])
    : 'space-y-4';

  /**
   * Renderizar el header de la sección
   */
  const renderHeader = () => {
    if (!title && !description) return null;

    return (
      <div className="mb-4">
        {title && (
          <div className="flex items-center gap-2">
            <h4 className="text-md font-semibold text-gray-800">
              {title}
            </h4>
            {isCompleted && (
              <svg 
                className="w-5 h-5 text-green-500" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                  clipRule="evenodd" 
                />
              </svg>
            )}
          </div>
        )}
        {description && (
          <p className="text-sm text-gray-500 mt-1">
            {description}
          </p>
        )}
      </div>
    );
  };

  return (
    <div 
      id={id}
      className={`
        mb-8
        ${variantClasses[variant] || variantClasses.default}
        ${className}
        ${!isActive ? 'opacity-60' : ''}
      `}
    >
      {renderHeader()}

      <div className={fieldsContainerClass}>
        {children}
      </div>
    </div>
  );
};

export default FormSection;
