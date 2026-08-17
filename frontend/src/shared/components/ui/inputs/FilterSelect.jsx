import React from 'react';

/**
 * FilterSelect — select nativo con appearance-none + botón clear (X) + botón refresh.
 * Reutilizable para barras de filtros dependientes.
 *
 * @param {string} value - valor seleccionado
 * @param {Function} onChange - handler change (recibe event)
 * @param {Function} onClear - handler clear (X)
 * @param {Function} onRefresh - handler refresh
 * @param {Array} options - [{ value, label }]
 * @param {string} placeholder - texto del option vacío
 * @param {string} label - etiqueta del campo
 * @param {boolean} required - muestra asterisco rojo
 * @param {boolean} disabled - deshabilita el select
 * @param {boolean} loading - muestra spinner en refresh + oculta clear
 * @param {boolean} disableRefresh - deshabilita solo el botón refresh
 * @param {string} minWidth - clase tailwind para ancho mínimo (default: min-w-[220px])
 * @param {string} refreshTitle - tooltip del botón refresh
 */
function FilterSelect({
  value,
  onChange,
  onClear,
  onRefresh,
  options = [],
  placeholder = 'Seleccionar...',
  label,
  required = false,
  disabled = false,
  loading = false,
  disableRefresh = false,
  minWidth = 'min-w-[220px]',
  refreshTitle = 'Actualizar',
}) {
  const showClear = value && !loading && onClear;
  const refreshDisabled = disableRefresh || loading;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative inline-flex items-center">
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`appearance-none pl-3 pr-24 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#25346A] focus:border-transparent ${minWidth} transition-all hover:border-gray-400 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed ${
            value ? 'border-[#25346A]/40' : 'border-gray-300'
          }`}
        >
          <option value="">{placeholder}</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {showClear && (
          <button
            type="button"
            onClick={onClear}
            title="Limpiar selección"
            className="absolute right-11 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshDisabled}
            title={refreshTitle}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-[#25346A] hover:bg-gray-100 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default FilterSelect;
