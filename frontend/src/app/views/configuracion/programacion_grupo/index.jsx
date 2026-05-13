import React from 'react';
import LayoutWithSidebar from '@/shared/components/layout/LayoutWithSidebar';
import ScheduleTemplate from '@/features/schedule/components/ScheduleTemplate';
import GrupoSelector from './components/GrupoSelector';
import PlantillaToolbar from './components/PlantillaToolbar';
import EstadisticasModal from './components/EstadisticasModal';
import { ConflictErrorDisplay } from './components/ConflictErrorDisplay';
import { useProgramacionGrupo } from './hooks/useProgramacionGrupo';

function ProgramacionGrupoConfig() {
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
    selectedCurso,
    showTemplate,
    stableFormData,
    conflictError,
    estadisticasOpen,
    setSelectedCurso,
    handleSelectorChange,
    handleStartAdd,
    handleCancelAdd,
    handleStartDelete,
    handleCancelDelete,
    handleCellToggle,
    handleConfirmAdd,
    handleCellDelete,
    handleClearConflict,
    handleOpenEstadisticas,
    handleCloseEstadisticas,
    idGrupo
  } = useProgramacionGrupo();

  return (
    <LayoutWithSidebar>
      <div className="px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Programación de Grupo</h1>
          <p className="text-sm text-gray-600 mt-1">Visualiza y asigna cursos a la plantilla horaria del grupo</p>
        </div>

        <GrupoSelector
          selectorValues={selectorValues}
          stableFormData={stableFormData}
          onSelectorChange={handleSelectorChange}
        />

        {loading ? (
          <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Cargando plantilla...</p>
          </div>
        ) : showTemplate ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            <PlantillaToolbar
              grupoNombre={grupoNombre}
              selectionMode={selectionMode}
              deleteMode={deleteMode}
              selectedCells={selectedCells}
              selectedCurso={selectedCurso}
              saving={saving}
              idGrupo={selectorValues.ID_GRUPO}
              stableFormData={stableFormData}
              onSetSelectedCurso={setSelectedCurso}
              onStartAdd={handleStartAdd}
              onCancelAdd={handleCancelAdd}
              onConfirmAdd={handleConfirmAdd}
              onStartDelete={handleStartDelete}
              onCancelDelete={handleCancelDelete}
              onShowEstadisticas={handleOpenEstadisticas}
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
        ) : (
          <div className="p-12 bg-white rounded-xl border border-gray-200 shadow-sm text-center">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-3 text-gray-500 font-medium">Seleccione un grupo</p>
            <p className="mt-1 text-sm text-gray-400">Elija periodo, sede, turno y grupo para ver su plantilla horaria.</p>
          </div>
        )}
      </div>
      {conflictError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={handleClearConflict} />
          <div className="relative bg-white rounded-xl shadow-2xl p-8 w-full max-w-6xl border border-red-200 mx-4">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-red-100">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-bold text-red-700">
                  ⚠️ Solapamiento Detectado
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  No se puede asignar - ya existe uso en otro grupo
                </p>
              </div>
            </div>
            <div className="rounded-lg border overflow-hidden bg-red-50/50 border-red-200">
              <ConflictErrorDisplay error={conflictError} />
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={handleClearConflict}
                className="px-6 py-2.5 text-sm font-semibold rounded-lg text-white transition-colors bg-red-600 hover:bg-red-700"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      <EstadisticasModal
        isOpen={estadisticasOpen}
        onClose={handleCloseEstadisticas}
        idGrupo={selectorValues.ID_GRUPO}
        grupoNombre={grupoNombre}
      />

    </LayoutWithSidebar>
  );
}

export default ProgramacionGrupoConfig;
