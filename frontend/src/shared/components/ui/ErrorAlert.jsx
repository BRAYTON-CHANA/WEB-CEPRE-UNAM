import React from 'react';

/**
 * ErrorAlert — banner de error de carga con botón de reintento.
 *
 * @param {string|Error} error   - Mensaje u objeto de error a mostrar
 * @param {function}     onRetry - Callback al presionar "Reintentar"
 * @param {boolean}      loading - Deshabilita el botón y muestra "Reintentando..."
 * @param {string}       className - Clases extra para el contenedor
 */
export default function ErrorAlert({ error, onRetry, loading = false, className = '' }) {
  if (!error) return null;

  const message = typeof error === 'string' ? error : (error?.message || 'Error de conexión');

  return (
    <div className={`bg-red-50 rounded-xl border border-red-100 p-4 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-red-700 text-sm"><strong>Error:</strong> {message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-white border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Reintentando...' : 'Reintentar'}
          </button>
        )}
      </div>
    </div>
  );
}
