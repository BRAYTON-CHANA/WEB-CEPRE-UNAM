import { useState, useCallback, useEffect } from 'react';

/**
 * Hook para manejar formularios multi-step (multipágina)
 * @param {Object} options - Opciones de configuración
 * @param {number} options.totalPages - Total de páginas
 * @param {Array} options.validatedPages - Array de páginas ya validadas
 * @param {boolean} options.persistData - Si debe persistir en localStorage
 * @param {string} options.storageKey - Clave para localStorage
 * @param {Function} options.onPageChange - Callback cuando cambia de página
 * @returns {Object} - Estado y funciones de navegación
 */
export const useMultiStepForm = ({
  totalPages = 1,
  validatedPages = [],
  persistData = false,
  storageKey = 'multistep_form',
  onPageChange = null
}) => {
  // Estado de página actual (1-based)
  const [currentPage, setCurrentPage] = useState(() => {
    if (persistData) {
      const saved = localStorage.getItem(`${storageKey}_page`);
      return saved ? parseInt(saved, 10) : 1;
    }
    return 1;
  });

  // Páginas que han sido completadas/validadas
  const [completedPages, setCompletedPages] = useState(() => {
    if (persistData) {
      const saved = localStorage.getItem(`${storageKey}_completed`);
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Persistir estado
  useEffect(() => {
    if (persistData) {
      localStorage.setItem(`${storageKey}_page`, currentPage.toString());
    }
  }, [currentPage, persistData, storageKey]);

  useEffect(() => {
    if (persistData) {
      localStorage.setItem(`${storageKey}_completed`, JSON.stringify(completedPages));
    }
  }, [completedPages, persistData, storageKey]);

  /**
   * Navegar a página específica
   */
  const goToPage = useCallback((pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) {
      console.warn(`[useMultiStepForm] Página ${pageNumber} inválida. Rango: 1-${totalPages}`);
      return false;
    }

    // Solo permitir navegar a páginas completadas o la siguiente inmediata
    if (pageNumber > currentPage + 1 && !completedPages.includes(pageNumber)) {
      console.warn(`[useMultiStepForm] No puedes saltar a página ${pageNumber}. Completa las páginas anteriores primero.`);
      return false;
    }

    setCurrentPage(pageNumber);
    
    if (onPageChange) {
      onPageChange(pageNumber);
    }

    return true;
  }, [currentPage, totalPages, completedPages, onPageChange]);

  /**
   * Avanzar a la siguiente página
   */
  const goToNextPage = useCallback(() => {
    if (currentPage >= totalPages) {
      return false;
    }

    // Marcar página actual como completada antes de avanzar
    setCompletedPages(prev => {
      if (!prev.includes(currentPage)) {
        return [...prev, currentPage];
      }
      return prev;
    });

    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    
    if (onPageChange) {
      onPageChange(nextPage);
    }

    return true;
  }, [currentPage, totalPages, onPageChange]);

  /**
   * Retroceder a la página anterior
   */
  const goToPrevPage = useCallback(() => {
    if (currentPage <= 1) {
      return false;
    }

    const prevPage = currentPage - 1;
    setCurrentPage(prevPage);
    
    if (onPageChange) {
      onPageChange(prevPage);
    }

    return true;
  }, [currentPage, onPageChange]);

  /**
   * Marcar una página como completada
   */
  const markPageComplete = useCallback((pageNumber) => {
    setCompletedPages(prev => {
      if (!prev.includes(pageNumber)) {
        return [...prev, pageNumber];
      }
      return prev;
    });
  }, []);

  /**
   * Verificar si una página está completada
   */
  const isPageCompleted = useCallback((pageNumber) => {
    return completedPages.includes(pageNumber);
  }, [completedPages]);

  /**
   * Verificar si estamos en la última página
   */
  const isLastPage = currentPage === totalPages;

  /**
   * Verificar si estamos en la primera página
   */
  const isFirstPage = currentPage === 1;

  /**
   * Verificar si puede avanzar (hay más páginas)
   */
  const canGoNext = currentPage < totalPages;

  /**
   * Verificar si puede retroceder
   */
  const canGoPrev = currentPage > 1;

  /**
   * Resetear el estado del formulario multi-step
   */
  const resetMultiStep = useCallback(() => {
    setCurrentPage(1);
    setCompletedPages([]);
    
    if (persistData) {
      localStorage.removeItem(`${storageKey}_page`);
      localStorage.removeItem(`${storageKey}_completed`);
    }
  }, [persistData, storageKey]);

  /**
   * Limpiar datos persistidos
   */
  const clearPersistedData = useCallback(() => {
    if (persistData) {
      localStorage.removeItem(`${storageKey}_page`);
      localStorage.removeItem(`${storageKey}_completed`);
    }
  }, [persistData, storageKey]);

  return {
    // Estado
    currentPage,
    totalPages,
    completedPages,
    isLastPage,
    isFirstPage,
    canGoNext,
    canGoPrev,
    
    // Navegación
    goToPage,
    goToNextPage,
    goToPrevPage,
    
    // Utilidades
    markPageComplete,
    isPageCompleted,
    resetMultiStep,
    clearPersistedData
  };
};

export default useMultiStepForm;
