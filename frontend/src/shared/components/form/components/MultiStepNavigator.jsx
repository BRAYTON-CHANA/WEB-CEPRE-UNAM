import React from 'react';

/**
 * MultiStepNavigator - Indicador de progreso y navegación para formularios multi-step
 * Muestra dots de progreso y botones de navegación
 */
const MultiStepNavigator = ({
  // Estado
  currentPage,
  totalPages,
  completedPages = [],
  isLastPage,
  isFirstPage,
  canGoNext,
  canGoPrev,
  
  // Acciones
  onNext,
  onPrev,
  goToPage,
  
  // Configuración
  showDots = true,
  nextText = 'Siguiente',
  prevText = 'Atrás',
  submitText = 'Confirmar',
  loading = false,
  
  // Título de página actual (opcional)
  currentPageTitle = ''
}) => {
  /**
   * Renderizar indicador de dots
   */
  const renderDots = () => {
    if (!showDots) return null;

    return (
      <div className="flex items-center justify-center space-x-2 mb-6">
        {Array.from({ length: totalPages }, (_, i) => {
          const pageNum = i + 1;
          const isActive = pageNum === currentPage;
          const isCompleted = completedPages.includes(pageNum);
          
          return (
            <button
              key={pageNum}
              onClick={() => {
                // Solo permitir clickear páginas completadas o la siguiente
                if (isCompleted || pageNum <= currentPage) {
                  goToPage(pageNum);
                }
              }}
              disabled={!isCompleted && pageNum > currentPage}
              className={`
                w-3 h-3 rounded-full transition-all duration-200
                ${isActive 
                  ? 'bg-blue-600 w-6' 
                  : isCompleted 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-gray-300'
                }
                ${!isCompleted && pageNum > currentPage ? 'cursor-not-allowed' : 'cursor-pointer'}
              `}
              title={`Página ${pageNum}${isCompleted ? ' (completada)' : ''}`}
            />
          );
        })}
      </div>
    );
  };

  /**
   * Renderizar info de página
   */
  const renderPageInfo = () => {
    return (
      <div className="text-center mb-4">
        <span className="text-sm text-gray-500">
          Paso {currentPage} de {totalPages}
        </span>
        {currentPageTitle && (
          <h3 className="text-lg font-semibold text-gray-800 mt-1">
            {currentPageTitle}
          </h3>
        )}
      </div>
    );
  };

  /**
   * Renderizar botones de navegación
   */
  const renderNavigationButtons = () => {
    return (
      <div className="flex justify-between items-center mt-6">
        {/* Botón Atrás */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onPrev(e);
          }}
          disabled={!canGoPrev || loading}
          className={`
            px-4 py-2 rounded-md font-medium transition-colors
            ${isFirstPage 
              ? 'invisible' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'
            }
          `}
        >
          {prevText}
        </button>

        {/* Indicador centrado (opcional, si no hay dots arriba) */}
        {!showDots && (
          <span className="text-sm text-gray-500">
            {currentPage} / {totalPages}
          </span>
        )}

        {/* Botón Siguiente / Submit */}
        {isLastPage ? (
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Enviando...' : submitText}
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onNext(e);
            }}
            disabled={!canGoNext || loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {nextText}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="multi-step-navigator">
      {renderDots()}
      {renderPageInfo()}
      {renderNavigationButtons()}
    </div>
  );
};

export default MultiStepNavigator;
