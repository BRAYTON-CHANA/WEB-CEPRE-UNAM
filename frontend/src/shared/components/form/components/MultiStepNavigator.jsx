import React from 'react';

/**
 * MultiStepNavigator - Indicador de progreso y navegación para formularios multi-step
 */
const MultiStepNavigator = ({
  currentPage,
  totalPages,
  completedPages = [],
  isLastPage,
  isFirstPage,
  canGoNext,
  canGoPrev,
  onNext,
  onPrev,
  goToPage,
  showDots = true,
  nextText = 'Siguiente',
  prevText = 'Atrás',
  submitText = 'Confirmar',
  loading = false,
  currentPageTitle = '',
  part = 'full'
}) => {
  const progressPercent = totalPages > 1
    ? Math.round(((currentPage - 1) / (totalPages - 1)) * 100)
    : 100;

  const showHeader = part === 'full' || part === 'header';
  const showFooter = part === 'full' || part === 'footer';

  return (
    <div className={part === 'header' ? 'multi-step-navigator-header' : part === 'footer' ? 'multi-step-navigator-footer' : 'multi-step-navigator mt-2'}>

      {/* ── Encabezado del paso ─────────────────────────────────── */}
      {showHeader && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-widest text-blue-500">
              Paso {currentPage} de {totalPages}
            </span>
            <span className="text-xs text-gray-400">{progressPercent}% completado</span>
          </div>

          {/* Barra de progreso */}
          <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Título del paso */}
          {currentPageTitle && (
            <h3 className="mt-3 text-base font-semibold text-gray-800 tracking-tight">
              {currentPageTitle}
            </h3>
          )}
        </div>
      )}


      {/* ── Dots de navegación ──────────────────────────────────── */}
      {showHeader && showDots && (
        <div className="flex items-center gap-2 mb-6">
          {Array.from({ length: totalPages }, (_, i) => {
            const pageNum = i + 1;
            const isActive    = pageNum === currentPage;
            const isCompleted = completedPages.includes(pageNum);
            const canClick    = isCompleted || pageNum <= currentPage;

            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => canClick && goToPage(pageNum)}
                disabled={!canClick}
                title={`Paso ${pageNum}${isCompleted ? ' ✓' : ''}`}
                className={`
                  flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                  transition-all duration-200 border
                  ${isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : isCompleted
                      ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100 cursor-pointer'
                      : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                  }
                `}
              >
                {isCompleted && !isActive ? (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span>{pageNum}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Botones de navegación ───────────────────────────────── */}
      {showFooter && <div className="flex justify-between items-center pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPrev(e); }}
          disabled={!canGoPrev || loading}
          className={`
            inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
            transition-all duration-150
            ${isFirstPage
              ? 'invisible'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed'
            }
          `}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {prevText}
        </button>

        {isLastPage ? (
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 shadow-sm"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Enviando...
              </>
            ) : (
              <>
                {submitText}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onNext(e); }}
            disabled={!canGoNext || loading}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 shadow-sm"
          >
            {nextText}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>}
    </div>
  );
};

export default MultiStepNavigator;
