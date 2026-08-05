import React from 'react';

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 25, 50, 100, 500, 1000];

const DEFAULT_CONTAINER =
  'px-5 py-3 border-t border-gray-100 bg-gray-50/70 rounded-b-xl flex flex-wrap items-center justify-between gap-3';

const BTN_BASE =
  'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-all duration-150 select-none';
const BTN_ACTIVE =
  'border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-gray-600 disabled:hover:bg-transparent';

/**
 * Componente de paginación con diseño refinado.
 *
 * @prop {boolean} pagination          - Si false, no renderiza nada
 * @prop {Array}   processedData       - Datos totales (para conteo)
 * @prop {number}  itemsPerPage        - Ítems por página actual
 * @prop {number}  currentPage         - Página actual
 * @prop {Function} onPageChange       - Callback de cambio de página
 * @prop {Function} onItemsPerPageChange - Callback de cambio de tamaño
 * @prop {string}  paginationClassName - Override completo del className del contenedor
 */
const TablePagination = ({
  pagination,
  processedData,
  itemsPerPage,
  currentPage,
  onPageChange,
  onItemsPerPageChange,
  paginationClassName,
}) => {
  if (!pagination) return null;

  const total      = processedData.length;
  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));
  const from       = total === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const to         = Math.min(currentPage * itemsPerPage, total);

  const goTo = (page) => onPageChange && onPageChange(page);

  return (
    <div className={paginationClassName || DEFAULT_CONTAINER}>
      {/* Izquierda: info + selector */}
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-xs text-gray-500 tabular-nums">
          {total === 0
            ? 'Sin resultados'
            : <><span className="font-semibold text-gray-700">{from}–{to}</span> de <span className="font-semibold text-gray-700">{total}</span></>
          }
        </span>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400 whitespace-nowrap">Por página</label>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange && onItemsPerPageChange(Number(e.target.value))}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 cursor-pointer"
          >
            {ITEMS_PER_PAGE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Derecha: navegación */}
      {total > 0 && (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => goTo(1)}
            disabled={currentPage === 1}
            className={`${BTN_BASE} ${BTN_ACTIVE}`}
            title="Primera página"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={() => goTo(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`${BTN_BASE} ${BTN_ACTIVE}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Anterior
          </button>

          <span className="px-3 py-1.5 text-xs font-medium text-gray-500 tabular-nums whitespace-nowrap">
            {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => goTo(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={`${BTN_BASE} ${BTN_ACTIVE}`}
          >
            Siguiente
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            onClick={() => goTo(totalPages)}
            disabled={currentPage === totalPages}
            className={`${BTN_BASE} ${BTN_ACTIVE}`}
            title="Última página"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default TablePagination;
