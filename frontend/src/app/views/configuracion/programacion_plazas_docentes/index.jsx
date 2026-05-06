import React from 'react';
import LayoutWithSidebar from '@/shared/components/layout/LayoutWithSidebar';
import ScheduleTemplate from '@/features/schedule/components/ScheduleTemplate';
import PlazaSelector from './components/PlazaSelector';
import PlazaToolbar from './components/PlazaToolbar';
import { useProgramacionPlaza } from './hooks/useProgramacionPlaza';

function ProgramacionPlazasDocentes() {
  const {
    selectorValues,
    customBlocks,
    matrix,
    grupoNombre,
    cellEvents,
    columnDates,
    loading,
    saving,
    selectionMode,
    deleteMode,
    selectedCells,
    idGrupoPlanCurso,
    showTemplate,
    stableFormData,
    conflictError,
    handleSelectorChange,
    handleStartAdd,
    handleCancelAdd,
    handleStartDelete,
    handleCancelDelete,
    handleCellToggle,
    handleConfirmAdd,
    handleCellDelete,
    handleClearConflict
  } = useProgramacionPlaza();

  return (
    <LayoutWithSidebar>
      <div className="px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Programación por Plaza Docente</h1>
          <p className="text-sm text-gray-600 mt-1">
            Selecciona una plaza docente y asigna sus sesiones a la plantilla horaria del grupo
          </p>
        </div>

        <PlazaSelector
          selectorValues={selectorValues}
          stableFormData={stableFormData}
          onSelectorChange={handleSelectorChange}
        />

        {loading ? (
          <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            <p className="mt-2 text-sm text-gray-600">Cargando plantilla...</p>
          </div>
        ) : showTemplate ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            <PlazaToolbar
              grupoNombre={grupoNombre}
              selectionMode={selectionMode}
              deleteMode={deleteMode}
              selectedCells={selectedCells}
              idGrupoPlanCurso={idGrupoPlanCurso}
              saving={saving}
              onStartAdd={handleStartAdd}
              onCancelAdd={handleCancelAdd}
              onConfirmAdd={handleConfirmAdd}
              onStartDelete={handleStartDelete}
              onCancelDelete={handleCancelDelete}
            />
            <ScheduleTemplate
              blocks={customBlocks}
              matrix={matrix}
              cellEvents={cellEvents}
              columnDates={columnDates}
              selectionMode={selectionMode}
              deleteMode={deleteMode}
              selectedCells={selectedCells}
              onCellToggle={handleCellToggle}
              onCellDelete={handleCellDelete}
            />
          </div>
        ) : selectorValues.ID_GRUPO ? (
          <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm text-center">
            <p className="text-sm text-gray-500">No se encontró plantilla para este grupo.</p>
          </div>
        ) : (
          <div className="p-12 bg-white rounded-xl border border-gray-200 shadow-sm text-center">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <p className="mt-3 text-gray-500 font-medium">Seleccione una plaza docente</p>
            <p className="mt-1 text-sm text-gray-400">
              Elija periodo, sede, turno, plaza docente y grupo para ver la plantilla.
            </p>
          </div>
        )}
      </div>

      {/* Modal conflicto de horario */}
      {conflictError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={handleClearConflict} />
          <div className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg border border-gray-100 mx-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900">Conflicto de horario</p>
                <p className="text-xs text-gray-500 mt-0.5">No se pudo asignar la sesión</p>
              </div>
            </div>
            <pre className="text-xs font-mono bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-auto max-h-64 whitespace-pre-wrap text-gray-700 leading-relaxed">
              {conflictError}
            </pre>
            <div className="flex justify-end mt-4">
              <button
                onClick={handleClearConflict}
                className="px-5 py-2 text-sm font-semibold rounded-lg bg-gray-900 text-white hover:bg-gray-700 transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </LayoutWithSidebar>
  );
}

export default ProgramacionPlazasDocentes;
