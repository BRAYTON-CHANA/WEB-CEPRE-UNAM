import React from 'react';

export default function PlazaToolbar({
  grupoNombre,
  selectionMode,
  deleteMode,
  selectedCells,
  idGrupoPlanCurso,
  saving,
  onStartAdd,
  onCancelAdd,
  onConfirmAdd,
  onStartDelete,
  onCancelDelete
}) {
  const canConfirm = !!idGrupoPlanCurso && selectedCells.size > 0 && !saving;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="text-lg font-semibold text-gray-800">
        Plantilla: {grupoNombre}
      </h3>

      {selectionMode ? (
        <div className="flex items-center gap-3 flex-wrap">
          {/* Info de la plaza ya asignada */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
            </svg>
            {idGrupoPlanCurso
              ? <span>Plaza asignada — haz clic en celdas vacías</span>
              : <span className="text-amber-700">Esta plaza no tiene curso asignado en este grupo</span>
            }
          </div>

          <button
            onClick={onConfirmAdd}
            disabled={!canConfirm}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-[#2D366F] to-[#57C7C2] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:from-[#3a4289] hover:to-[#6dd9d4] transition-all flex items-center gap-2 shadow-md"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            Confirmar ({selectedCells.size})
          </button>

          <button
            onClick={onCancelAdd}
            className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
          >
            Cancelar
          </button>
        </div>
      ) : deleteMode ? (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1 font-medium">
            Haz clic en el × de un evento para eliminarlo
          </span>
          <button
            onClick={onCancelDelete}
            className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {saving && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
          )}
          <button
            onClick={onStartAdd}
            disabled={!idGrupoPlanCurso}
            title={!idGrupoPlanCurso ? 'Esta plaza no tiene curso asignado en este grupo' : 'Añadir sesiones'}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-[#2D366F] to-[#57C7C2] text-white hover:from-[#3a4289] hover:to-[#6dd9d4] transition-all flex items-center gap-2 shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Añadir
          </button>
          <button
            onClick={onStartDelete}
            className="px-4 py-2 text-sm font-semibold rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
}
