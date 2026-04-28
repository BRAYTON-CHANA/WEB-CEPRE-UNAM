import React, { useState, useMemo, useCallback } from 'react';
import Layout from '@/shared/components/layout/Layout';
import Calendar from '@/features/schedule/components/Calendar';
import { headerProps } from './config/headerFooterConfig';
import GrupoSelectors from './components/GrupoSelectors';
import CursoSelectWrapper from './components/CursoSelectWrapper';
import AsignacionConfirmModal from './components/AsignacionConfirmModal';
import MatrizHorarioModal from './components/MatrizHorarioModal';
import LimpiarConfirmModal from './components/LimpiarConfirmModal';
import EstadisticasModal from './components/EstadisticasModal';
import { useAsignacionHorarioHandlers } from './hooks/useAsignacionHorarioHandlers';
import { exportHorarioToExcel } from './utils/exportToExcel';
import functionService from '@/shared/services/functionService';

/**
 * Asignación de Horario por Grupo
 * Selectores cascada (Periodo, Sede, Grupo). Al elegir Grupo se carga el horario automáticamente.
 */
function AsignacionHorarioGrupo() {
  const [selectorValues, setSelectorValues] = useState({
    ID_PERIODO: '',
    ID_SEDE: '',
    ID_TURNO: '',
    ID_GRUPO: ''
  });

  const [selectedIdGrupo, setSelectedIdGrupo] = useState(null);
  const [selectedGrupoNombre, setSelectedGrupoNombre] = useState(null);
  const [customBlocks, setCustomBlocks] = useState(null);
  const [calendarStartHour, setCalendarStartHour] = useState(7);
  const [calendarFinalHour, setCalendarFinalHour] = useState(19);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [asignacionHorarioData, setAsignacionHorarioData] = useState(null);
  const [events, setEvents] = useState(null);
  const [selectedBlocks, setSelectedBlocks] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [idHorario, setIdHorario] = useState(null);
  const [selectedCurso, setSelectedCurso] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState(null);
  const [isInserting, setIsInserting] = useState(false);
  const [showMatrizModal, setShowMatrizModal] = useState(false);
  const [showLimpiarModal, setShowLimpiarModal] = useState(false);
  const [showEstadisticasModal, setShowEstadisticasModal] = useState(false);
  const [estadisticasData, setEstadisticasData] = useState(null);

  const {
    loadHorarioByGrupoId,
    resetHorario,
    toggleSelectionMode,
    handleConfirm,
    handleInsertAsignaciones,
    handleDeleteAsignacion,
    handleClearAsignaciones
  } = useAsignacionHorarioHandlers(
    setSelectedIdGrupo,
    setSelectedGrupoNombre,
    setLoadingCalendar,
    setCustomBlocks,
    setCalendarStartHour,
    setCalendarFinalHour,
    setAsignacionHorarioData,
    setEvents,
    setIdHorario,
    setSelectedBlocks,
    setSelectionMode,
    setSelectedCurso,
    setShowConfirmModal,
    setConfirmModalData,
    selectedBlocks,
    selectedCurso,
    idHorario,
    selectedGrupoNombre,
    setDeleteMode
  );

  const toggleDeleteMode = useCallback(() => {
    setDeleteMode(prev => {
      if (prev) {
        return false;
      } else {
        setSelectionMode(false);
        setSelectedBlocks([]);
        setSelectedCurso(null);
        setShowConfirmModal(false);
        setConfirmModalData(null);
        return true;
      }
    });
  }, [setSelectionMode, setSelectedBlocks, setSelectedCurso, setShowConfirmModal, setConfirmModalData, setDeleteMode]);

  const functionParams = useMemo(() => ({
    ID_GRUPO: selectedIdGrupo
  }), [selectedIdGrupo]);

  const formData = useMemo(() => ({
    ID_GRUPO: selectedIdGrupo
  }), [selectedIdGrupo]);

  // Manejador cascada 4 niveles: al cambiar padre, limpiar hijos + resetear horario
  const handleSelectorChange = useCallback((name, value) => {
    setSelectorValues(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'ID_PERIODO') {
        next.ID_SEDE = '';
        next.ID_TURNO = '';
        next.ID_GRUPO = '';
        resetHorario();
      } else if (name === 'ID_SEDE') {
        next.ID_TURNO = '';
        next.ID_GRUPO = '';
        resetHorario();
      } else if (name === 'ID_TURNO') {
        next.ID_GRUPO = '';
        resetHorario();
      } else if (name === 'ID_GRUPO') {
        if (value) {
          loadHorarioByGrupoId(value);
        } else {
          resetHorario();
        }
      }
      return next;
    });
  }, [resetHorario, loadHorarioByGrupoId]);

  const handleModalConfirm = async () => {
    if (!confirmModalData?.asignaciones) return;
    setIsInserting(true);
    try {
      await handleInsertAsignaciones(confirmModalData.asignaciones);
      setShowConfirmModal(false);
      setConfirmModalData(null);
      // Recargar eventos del calendario
      if (selectedIdGrupo) {
        const asignacionFilters = JSON.stringify([{ field: 'ID_GRUPO', op: '=', value: selectedIdGrupo }]);
        const asignacionResponse = await fetch(`http://localhost:3001/api/tables/VW_ASIGNACION_HORARIO?filters=${encodeURIComponent(asignacionFilters)}`);
        const asignacionData = await asignacionResponse.json();
        setAsignacionHorarioData(asignacionData);
        const { transformToEvents } = await import('./utils/transformers');
        const transformedEvents = transformToEvents(asignacionData);
        setEvents(transformedEvents);
      }
      setSelectedBlocks([]);
      setSelectionMode(false);
      setSelectedCurso(null);
    } catch (error) {
      console.error('Error al insertar asignaciones:', error);
      alert('Error al insertar asignaciones. Por favor, intente nuevamente.');
    } finally {
      setIsInserting(false);
    }
  };

  const handleEventDelete = async (eventId) => {
    if (!window.confirm('¿Eliminar esta asignación?')) return;
    try {
      await handleDeleteAsignacion(eventId);
      if (selectedIdGrupo) {
        const asignacionFilters = JSON.stringify([{ field: 'ID_GRUPO', op: '=', value: selectedIdGrupo }]);
        const asignacionResponse = await fetch(`http://localhost:3001/api/tables/VW_ASIGNACION_HORARIO?filters=${encodeURIComponent(asignacionFilters)}`);
        const asignacionData = await asignacionResponse.json();
        setAsignacionHorarioData(asignacionData);
        const { transformToEvents } = await import('./utils/transformers');
        const transformedEvents = transformToEvents(asignacionData);
        setEvents(transformedEvents);
      }
    } catch (error) {
      console.error('Error al eliminar asignación:', error);
      alert('Error al eliminar asignación');
    }
  };

  const handleLimpiarConfirm = async () => {
    try {
      await handleClearAsignaciones(selectedIdGrupo);
      setAsignacionHorarioData(null);
      setEvents(null);
      setShowLimpiarModal(false);
    } catch (error) {
      console.error('Error al limpiar asignaciones:', error);
      alert('Error al limpiar asignaciones');
    }
  };

  const handleOpenEstadisticas = async () => {
    console.log('🔍 [Estadisticas] ID_GRUPO:', selectorValues.ID_GRUPO);
    if (!selectorValues.ID_GRUPO) {
      console.log('❌ [Estadisticas] No ID_GRUPO');
      return;
    }
    try {
      console.log('📡 [Estadisticas] Fetching...');
      const data = await functionService.execute('fn_estadisticas_cursos_grupo', {
        ID_GRUPO: selectorValues.ID_GRUPO
      });
      console.log(' [Estadisticas] Data loaded:', data);
      setEstadisticasData(data);
      setShowEstadisticasModal(true);
    } catch (error) {
      console.error('❌ [Estadisticas] Error:', error);
      alert('Error al cargar estadísticas');
    }
  };

  const showCalendar = !!selectedIdGrupo && !!customBlocks;

  return (
    <Layout>
      <div className="px-4 py-6 space-y-6">
        {/* Header manual */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{headerProps.headerTitle}</h1>
          {headerProps.headerDescription && (
            <p className="text-sm text-gray-600 mt-1">{headerProps.headerDescription}</p>
          )}
        </div>

        {/* Selectores cascada */}
        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
          <GrupoSelectors values={selectorValues} onChange={handleSelectorChange} />
        </div>

        {/* Contenido: mensaje, loading o calendario */}
        {loadingCalendar ? (
          <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Cargando horario...</p>
          </div>
        ) : showCalendar ? (
          <div className="p-6 bg-gradient-to-br from-white via-gray-50 to-blue-50/30 rounded-2xl shadow-xl shadow-blue-900/10 border border-gray-200/60">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-semibold text-gray-800">
                  Horario del Grupo: {selectedGrupoNombre}
                </h3>
                {!selectionMode && !deleteMode && events && events.length > 0 && (
                  <>
                    <button
                      onClick={() => exportHorarioToExcel(asignacionHorarioData, customBlocks, calendarStartHour, selectedGrupoNombre)}
                      className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-[#2D366F] to-[#57C7C2] text-white rounded-lg shadow-md shadow-[#2D366F]/10 border border-[#2D366F]/20 hover:shadow-lg hover:shadow-[#2D366F]/20 transition-all tracking-wide flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      EXPORTAR EXCEL
                    </button>
                    <button
                      onClick={handleOpenEstadisticas}
                      className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg shadow-md shadow-purple-500/10 border border-purple-400/20 hover:shadow-lg hover:shadow-purple-500/20 transition-all tracking-wide flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      ESTADÍSTICAS
                    </button>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectionMode && selectedBlocks.length > 0 && selectedCurso && (
                  <button
                    onClick={handleConfirm}
                    className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg shadow-md shadow-emerald-500/10 border border-emerald-400/20 hover:shadow-lg hover:shadow-emerald-500/20 transition-all tracking-wide flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    CONFIRMAR
                  </button>
                )}
                <button
                  onClick={deleteMode ? toggleDeleteMode : toggleSelectionMode}
                  className={`
                    px-4 py-2 text-sm font-semibold rounded-lg shadow-md transition-all flex items-center gap-2 tracking-wide
                    ${(selectionMode || deleteMode)
                      ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-orange-500/10 border border-orange-400/20 hover:shadow-lg hover:shadow-orange-500/20'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/10 border border-emerald-400/20 hover:shadow-lg hover:shadow-emerald-500/20'}
                  `}
                >
                  {(selectionMode || deleteMode) ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      CANCELAR
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      AÑADIR
                    </>
                  )}
                </button>
                {!selectionMode && !deleteMode && (
                  <button
                    onClick={() => setShowMatrizModal(true)}
                    className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg shadow-md shadow-violet-500/10 border border-violet-400/20 hover:shadow-lg hover:shadow-violet-500/20 transition-all tracking-wide flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    GENERAR
                  </button>
                )}
                {!selectionMode && !deleteMode && (
                  <button
                    onClick={toggleDeleteMode}
                    className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-lg shadow-md shadow-rose-500/10 border border-rose-400/20 hover:shadow-lg hover:shadow-rose-500/20 transition-all tracking-wide flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    ELIMINAR
                  </button>
                )}
                {!selectionMode && !deleteMode && (
                  <button
                    onClick={() => setShowLimpiarModal(true)}
                    className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-slate-500 to-slate-600 text-white rounded-lg shadow-md shadow-slate-500/10 border border-slate-400/20 hover:shadow-lg hover:shadow-slate-500/20 transition-all tracking-wide flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    LIMPIAR
                  </button>
                )}
              </div>
            </div>

            {deleteMode && (
              <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200 relative z-50">
                <p className="text-sm text-red-800 font-medium">
                  Modo eliminar: haga clic en la X de cada asignación para eliminarla.
                </p>
              </div>
            )}

            {selectionMode && (
              <div className="mb-6 p-4 bg-emerald-50 rounded-lg border border-emerald-200 relative z-50">
                <CursoSelectWrapper
                  selectedCurso={selectedCurso}
                  setSelectedCurso={setSelectedCurso}
                  functionParams={functionParams}
                  formData={formData}
                />
              </div>
            )}

            <Calendar
              customBlocks={customBlocks}
              events={events}
              startHour={calendarStartHour}
              finalHour={calendarFinalHour}
              disableSelectionHighlight={true}
              initialView='week'
              enableBlockSelection={selectionMode}
              onBlockSelectionChange={setSelectedBlocks}
              enableEventDelete={deleteMode}
              onEventDelete={handleEventDelete}
            />
          </div>
        ) : (
          <div className="p-12 bg-gradient-to-br from-white via-gray-50 to-blue-50/30 rounded-2xl shadow-xl shadow-blue-900/10 border border-gray-200/60 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-3 text-gray-600 font-medium">Seleccione un grupo</p>
            <p className="mt-1 text-sm text-gray-500">Elija periodo, sede, turno y grupo para ver su horario.</p>
          </div>
        )}
      </div>

      <LimpiarConfirmModal
        isOpen={showLimpiarModal}
        onClose={() => setShowLimpiarModal(false)}
        onConfirm={handleLimpiarConfirm}
        grupoNombre={selectedGrupoNombre}
      />

      <MatrizHorarioModal
        isOpen={showMatrizModal}
        onClose={() => setShowMatrizModal(false)}
        customBlocks={customBlocks}
        selectedGrupoNombre={selectedGrupoNombre}
        idGrupo={selectedIdGrupo}
        idHorario={idHorario}
        formData={formData}
        calendarStartHour={calendarStartHour}
      />

      <AsignacionConfirmModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setConfirmModalData(null);
        }}
        onConfirm={handleModalConfirm}
        asignaciones={confirmModalData?.asignaciones || []}
        nombreCurso={confirmModalData?.nombreCurso || ''}
        nombreGrupo={confirmModalData?.nombreGrupo || ''}
        loading={isInserting}
      />

      <EstadisticasModal
        isOpen={showEstadisticasModal}
        onClose={() => setShowEstadisticasModal(false)}
        estadisticas={estadisticasData}
      />
    </Layout>
  );
}

export default AsignacionHorarioGrupo;
