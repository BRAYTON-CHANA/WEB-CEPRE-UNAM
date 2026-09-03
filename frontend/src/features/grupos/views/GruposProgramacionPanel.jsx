import React, { useMemo, useState, useEffect, useCallback } from 'react';
import ReferenceSelectInput from '@/shared/components/ui/inputs/ReferenceSelectInput';
import ScheduleTemplate from '@/shared/components/schedule/components/ScheduleTemplate';
import PlantillaToolbar from '@/features/grupos/components/PlantillaToolbar';
import EstadisticasModal from '@/features/grupos/components/EstadisticasModal';
import { ConflictErrorDisplay } from '@/features/grupos/components/ConflictErrorDisplay';
import { useProgramacionGrupo } from '@/features/grupos/hooks/useProgramacionGrupo';
import { useSesionesManual } from '@/features/grupos/hooks/useSesionesManual';
import SesionesHorarioView from '@/features/grupos/components/SesionesHorarioView';
import SesionesManualToolbar from '@/features/grupos/components/SesionesManualToolbar';
import SesionesManualGrid from '@/features/grupos/components/SesionesManualGrid';
import MergeDecisionDialog from '@/features/grupos/components/MergeDecisionDialog';
import { db } from '@/shared/api';

/**
 * GruposProgramacionPanel — tab 3: Programación (plantilla horaria).
 * Muestra la misma cascada de filtros que Cursos por Grupo (compartida).
 *
 * Props:
 *   sharedPeriodo, onSharedPeriodoChange
 *   sharedModalidad, onSharedModalidadChange
 *   sharedSede, onSharedSedeChange
 *   sharedGrupo, onSharedGrupoChange
 */
function GruposProgramacionPanel({
  sharedPeriodo, onSharedPeriodoChange,
  sharedModalidad, onSharedModalidadChange,
  sharedSede, onSharedSedeChange,
  sharedGrupo, onSharedGrupoChange
}) {
  const selectedModalidad = sharedModalidad || '';
  const selectedSede = sharedSede || '';
  const isVirtual = selectedModalidad === 'VIRTUAL';

  const {
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
    conflictError,
    advertenciaHoras,
    estadisticasOpen,
    setSelectedCurso,
    handleStartAdd,
    handleCancelAdd,
    handleStartDelete,
    handleCancelDelete,
    handleCellToggle,
    handleConfirmAdd,
    handleCellDelete,
    handleClearConflict,
    handleClearAdvertencia,
    handleOpenEstadisticas,
    handleCloseEstadisticas,
    // Estado de activación (solo lectura)
    grupoActivo
  } = useProgramacionGrupo({ sharedGrupo });

  // ===== Estado de sesiones (cuando grupo está activo) =====
  const [sesiones, setSesiones] = useState([]);
  const [snapshotBloques, setSnapshotBloques] = useState([]);
  const [sesionesLoading, setSesionesLoading] = useState(false);
  const [grupoCursosData, setGrupoCursosData] = useState([]);
  const [viewMode, setViewMode] = useState(() => {
    try { return localStorage.getItem('sesiones-view-mode') || 'plano'; }
    catch { return 'plano'; }
  });
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroCurso, setFiltroCurso] = useState('');
  const [sesionEliminar, setSesionEliminar] = useState(null); // { id, fecha, curso } | null

  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
    try { localStorage.setItem('sesiones-view-mode', mode); } catch {}
  }, []);

  // Sesiones filtradas para el Plano
  const sesionesFiltradas = useMemo(() => {
    if (!filtroFecha && !filtroCurso) return sesiones;
    return sesiones.filter(s => {
      let matchFecha = true;
      let matchCurso = true;
      if (filtroFecha) {
        let fStr = s.FECHA;
        if (typeof fStr === 'string' && fStr.includes('T')) fStr = fStr.split('T')[0];
        matchFecha = fStr === filtroFecha;
      }
      if (filtroCurso) {
        matchCurso = String(s.ID_GRUPO_CURSO) === String(filtroCurso);
      }
      return matchFecha && matchCurso;
    });
  }, [sesiones, filtroFecha, filtroCurso]);

  const loadSesiones = useCallback(async (idGrupo) => {
    if (!idGrupo) { setSesiones([]); setSnapshotBloques([]); return; }
    setSesionesLoading(true);
    try {
      const [data, bloquesData] = await Promise.all([
        db.select('VW_SESIONES_GRUPO', { ID_GRUPO: idGrupo }),
        db.select('VW_SESION_HORARIO_BLOQUES', { ID_GRUPO: idGrupo })
      ]);
      const arr = Array.isArray(data) ? data : [];
      // Ordenar por FECHA y HORA_INICIO
      arr.sort((a, b) => {
        const fa = a.FECHA || '';
        const fb = b.FECHA || '';
        if (fa < fb) return -1;
        if (fa > fb) return 1;
        const ha = a.HORA_INICIO || '';
        const hb = b.HORA_INICIO || '';
        if (ha < hb) return -1;
        if (ha > hb) return 1;
        return 0;
      });
      setSesiones(arr);
      setSnapshotBloques(Array.isArray(bloquesData) ? bloquesData : []);
    } catch (err) {
      console.error('Error al cargar sesiones:', err);
      setSesiones([]);
      setSnapshotBloques([]);
    } finally {
      setSesionesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (grupoActivo && sharedGrupo) {
      loadSesiones(sharedGrupo);
    } else {
      setSesiones([]);
      setSnapshotBloques([]);
    }
  }, [grupoActivo, sharedGrupo, loadSesiones]);

  // Cargar datos de cursos del grupo (para contador de horas en toolbar)
  useEffect(() => {
    if (!sharedGrupo) {
      setGrupoCursosData([]);
      return;
    }
    let cancelled = false;
    const loadCursos = async () => {
      try {
        const data = await db.executeFunction('fn_grupo_cursos', { p_id_grupo: Number(sharedGrupo) });
        if (!cancelled) setGrupoCursosData(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error al cargar cursos del grupo:', err);
        if (!cancelled) setGrupoCursosData([]);
      }
    };
    loadCursos();
    return () => { cancelled = true; };
  }, [sharedGrupo]);

  const stableFormData = useMemo(() => ({
    ID_GRUPO: sharedGrupo || ''
  }), [sharedGrupo]);

  // ===== Hook de sesiones manuales (modo activado) =====
  const sesionesManual = useSesionesManual({
    sharedGrupo,
    snapshotBloques,
    sesiones,
    onSesionesChange: () => sharedGrupo ? loadSesiones(sharedGrupo) : Promise.resolve()
  });

  // Handlers de la cascada (igual que GruposCursosPanel)
  const handlePeriodoChange = (name, value) => {
    onSharedPeriodoChange(value);
    onSharedModalidadChange?.('');
    onSharedSedeChange?.('');
    onSharedGrupoChange?.('');
  };

  const handleModalidadChange = (e) => {
    onSharedModalidadChange?.(e.target.value);
    onSharedSedeChange?.('');
    onSharedGrupoChange?.('');
  };

  const handleSedeChange = (name, value) => {
    onSharedSedeChange?.(value);
    onSharedGrupoChange?.('');
  };

  const handleGrupoChange = (name, value) => {
    onSharedGrupoChange?.(value);
  };

  // Filtros dinámicos para el selector de grupos
  const grupoFilters = useMemo(() => {
    if (!sharedPeriodo || !selectedModalidad) return null;
    const filters = [
      { field: 'ID_PERIODO', op: 'eq', value: String(sharedPeriodo) },
      { field: 'MODALIDAD', op: 'eq', value: selectedModalidad }
    ];
    if (!isVirtual && selectedSede) {
      filters.push({ field: 'ID_SEDE', op: 'eq', value: String(selectedSede) });
    }
    return filters;
  }, [sharedPeriodo, selectedModalidad, isVirtual, selectedSede]);

  const canSelectGrupo = sharedPeriodo && selectedModalidad && (isVirtual || selectedSede);

  return (
    <div className="px-6 py-6 space-y-6 max-w-7xl mx-auto">
      {/* ===== Filtros en cascada: período → modalidad → sede → grupo ===== */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 space-y-4">
          {/* Fila 1: Período + Modalidad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                Período <span className="text-red-500">*</span>
              </label>
              <ReferenceSelectInput
                name="id_periodo_prog"
                referenceTable="PERIODOS"
                referenceField="ID_PERIODO"
                referenceLabelField="NOMBRE_PERIODO"
                placeholder="Seleccione un período..."
                searchable={true}
                showRefreshButton={true}
                value={sharedPeriodo}
                onChange={handlePeriodoChange}
                formData={{}}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                Modalidad <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedModalidad}
                onChange={handleModalidadChange}
                disabled={!sharedPeriodo}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">{sharedPeriodo ? 'Seleccione una modalidad...' : 'Seleccione un período primero'}</option>
                <option value="PRESENCIAL">Presencial</option>
                <option value="VIRTUAL">Virtual</option>
              </select>
            </div>
          </div>

          {/* Fila 2: Sede + Grupo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                Sede {isVirtual ? '' : <span className="text-red-500">*</span>}
              </label>
              {isVirtual ? (
                <div className="px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500 text-sm italic">
                  Virtual (sin sede física)
                </div>
              ) : (
                <ReferenceSelectInput
                  name="id_sede_prog"
                  referenceTable="SEDES"
                  referenceField="ID_SEDE"
                  referenceQuery="{NOMBRE_SEDE}"
                  placeholder={selectedModalidad ? 'Seleccione una sede...' : 'Seleccione una modalidad primero'}
                  searchable={true}
                  showRefreshButton={true}
                  value={selectedSede}
                  onChange={handleSedeChange}
                  formData={{ MODALIDAD: selectedModalidad }}
                  blocked={{ and: [{ field: 'MODALIDAD', op: 'empty' }] }}
                  disabled={!selectedModalidad}
                  referenceFilters={[{ field: 'ACTIVO', op: 'eq', value: 'true' }]}
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                Grupo <span className="text-red-500">*</span>
              </label>
              <ReferenceSelectInput
                name="id_grupo_prog"
                referenceTable="VW_GRUPOS"
                referenceField="ID_GRUPO"
                referenceQuery="{CODIGO_GRUPO} — {NOMBRE_GRUPO}"
                placeholder={canSelectGrupo ? 'Seleccione un grupo...' : 'Complete los filtros previos'}
                searchable={true}
                showRefreshButton={true}
                value={sharedGrupo || ''}
                onChange={handleGrupoChange}
                formData={{ MODALIDAD: selectedModalidad, ID_SEDE: selectedSede }}
                blocked={isVirtual
                  ? { and: [{ field: 'MODALIDAD', op: 'empty' }] }
                  : { or: [{ field: 'MODALIDAD', op: 'empty' }, { field: 'ID_SEDE', op: 'empty' }] }
                }
                disabled={!canSelectGrupo}
                referenceFilters={grupoFilters || []}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ===== Estados vacíos ===== */}
      {!sharedPeriodo && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="mt-4 text-gray-500 font-medium">Seleccione un período</p>
          <p className="mt-2 text-sm text-gray-400">Elija un período académico para comenzar.</p>
        </div>
      )}

      {sharedPeriodo && !selectedModalidad && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="mt-4 text-gray-500 font-medium">Seleccione una modalidad</p>
          <p className="mt-2 text-sm text-gray-400">Elija presencial o virtual para continuar.</p>
        </div>
      )}

      {sharedPeriodo && selectedModalidad === 'PRESENCIAL' && !selectedSede && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="mt-4 text-gray-500 font-medium">Seleccione una sede</p>
          <p className="mt-2 text-sm text-gray-400">Elija la sede física del grupo.</p>
        </div>
      )}

      {canSelectGrupo && !sharedGrupo && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.121 4.738 7.677 4 5.25 4c-2.121 0-3.879.612-5.25 1.5v13C1.629 17.612 3.387 17 5.25 17c2.427 0 4.871.738 6.75 2.253m0-13C13.879 4.738 16.323 4 18.75 4c2.121 0 3.879.612 5.25 1.5v13C21.879 17.612 20.121 17 18.75 17c-2.427 0-4.871.738-6.75 2.253" />
          </svg>
          <p className="mt-4 text-gray-500 font-medium">Seleccione un grupo</p>
          <p className="mt-2 text-sm text-gray-400">Elija un grupo para ver su plantilla horaria.</p>
        </div>
      )}

      {/* ===== Contenido: grupo seleccionado ===== */}
      {canSelectGrupo && sharedGrupo && (
        <>
          {grupoActivo ? (
            /* ===== MODO ACTIVADO: Tabla de sesiones agrupadas ===== */
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Sesiones del Grupo</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {grupoNombre ? grupoNombre : 'Grupo activo'} · Modo manual
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Botón Añadir (solo si no está en modo add) */}
                  {!sesionesManual.modoAdd && (
                    <button
                      onClick={sesionesManual.handleStartAdd}
                      disabled={sesionesManual.saving}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors disabled:opacity-40"
                    >
                      {sesionesManual.saving ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-white" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      )}
                      Añadir
                    </button>
                  )}
                  {/* Toggle Plano / Horario (oculto en modo add) */}
                  {!sesionesManual.modoAdd && (
                    <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                      <button
                        onClick={() => handleViewModeChange('plano')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                          viewMode === 'plano'
                            ? 'bg-white text-[#2D366F] shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Plano
                      </button>
                      <button
                        onClick={() => handleViewModeChange('horario')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                          viewMode === 'horario'
                            ? 'bg-white text-[#2D366F] shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Horario
                      </button>
                    </div>
                  )}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-100 text-green-700 border border-green-200">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Grupo Activado
                  </span>
                </div>
              </div>

              {/* ===== MODO ADD: toolbar + grilla de un día ===== */}
              {sesionesManual.modoAdd ? (
                <div className="p-6 space-y-4">
                  <SesionesManualToolbar
                    modoAdd={sesionesManual.modoAdd}
                    fechaSeleccionada={sesionesManual.fechaSeleccionada}
                    selectedCurso={sesionesManual.selectedCurso}
                    selectedBloques={sesionesManual.selectedBloques}
                    saving={sesionesManual.saving}
                    idGrupo={sharedGrupo}
                    stableFormData={stableFormData}
                    grupoCursosData={grupoCursosData}
                    sesiones={sesiones}
                    onSetSelectedCurso={sesionesManual.setSelectedCurso}
                    onStartAdd={sesionesManual.handleStartAdd}
                    onCancelAdd={sesionesManual.handleCancelAdd}
                    onSelectFecha={sesionesManual.handleSelectFecha}
                    onConfirmAdd={sesionesManual.handleConfirmAdd}
                  />

                  {/* Error de solapamiento */}
                  {sesionesManual.error && (
                    <div className={`rounded-lg border p-4 ${
                      sesionesManual.error.tipo === 'SOLAPAMIENTO'
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-start gap-3">
                        <svg className={`w-5 h-5 mt-0.5 ${
                          sesionesManual.error.tipo === 'SOLAPAMIENTO' ? 'text-amber-600' : 'text-red-600'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            sesionesManual.error.tipo === 'SOLAPAMIENTO' ? 'text-amber-800' : 'text-red-800'
                          }`}>
                            {sesionesManual.error.tipo === 'SOLAPAMIENTO' ? 'Conflicto de horario' : 'Error'}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">{sesionesManual.error.message}</p>
                        </div>
                        <button
                          onClick={sesionesManual.handleClearError}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Grilla de bloques del día (solo seleccionable si curso elegido) */}
                  {sesionesManual.fechaSeleccionada ? (
                    <SesionesManualGrid
                      bloquesDelDia={sesionesManual.bloquesDelDia}
                      selectedBloques={sesionesManual.selectedBloques}
                      onBloqueToggle={sesionesManual.handleBloqueToggle}
                      selectionMode={!!sesionesManual.selectedCurso}
                    />
                  ) : (
                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center text-gray-400 text-sm">
                      Selecciona un día para ver sus bloques disponibles
                    </div>
                  )}

                  {/* Dialog de decisión de unión */}
                  {sesionesManual.pendienteDecision && (
                    <MergeDecisionDialog
                      sesionesAdyacentes={sesionesManual.pendienteDecision.sesiones_adyacentes}
                      onConfirm={sesionesManual.handleConfirmDecision}
                      onCancel={sesionesManual.handleCancelDecision}
                      saving={sesionesManual.saving}
                    />
                  )}
                </div>
              ) : sesionesLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Cargando sesiones...</p>
                </div>
              ) : sesiones.length === 0 ? (
                <div className="p-12 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="mt-3 text-gray-500 font-medium">Sin sesiones</p>
                  <p className="mt-1 text-sm text-gray-400">No se encontraron sesiones para este grupo.</p>
                </div>
              ) : viewMode === 'horario' ? (
                <SesionesHorarioView sesiones={sesiones} snapshotBloques={snapshotBloques} />
              ) : (
                <div className="space-y-3">
                  {/* Filtros del Plano */}
                  <div className="flex items-end gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-gray-500">Filtrar por fecha</label>
                      <input
                        type="date"
                        value={filtroFecha}
                        onChange={e => setFiltroFecha(e.target.value)}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-gray-500">Filtrar por curso</label>
                      <select
                        value={filtroCurso}
                        onChange={e => setFiltroCurso(e.target.value)}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[180px]"
                      >
                        <option value="">Todos los cursos</option>
                        {grupoCursosData.map(gc => (
                          <option key={gc.ID_GRUPO_CURSO} value={gc.ID_GRUPO_CURSO}>
                            {gc.NOMBRE_CURSO}
                          </option>
                        ))}
                      </select>
                    </div>
                    {(filtroFecha || filtroCurso) && (
                      <button
                        onClick={() => { setFiltroFecha(''); setFiltroCurso(''); }}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        Limpiar filtros
                      </button>
                    )}
                    <span className="ml-auto text-xs text-gray-400 pb-1.5">
                      {sesionesFiltradas.length} de {sesiones.length} sesiones
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Fecha</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Hora Inicio</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Hora Fin</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Duración</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Curso</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Docente</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Estado</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-600 whitespace-nowrap">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sesionesFiltradas.map((s, idx) => {
                        const fechaRaw = s.FECHA;
                        let fechaStr = '';
                        if (fechaRaw) {
                          const [y, m, d] = String(fechaRaw).split('-').map(Number);
                          const dt = new Date(y, m - 1, d);
                          fechaStr = dt.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
                        }
                        const horaIni = s.HORA_INICIO ? String(s.HORA_INICIO).slice(0, 5) : '';
                        const horaFin = s.HORA_FIN ? String(s.HORA_FIN).slice(0, 5) : '';
                        const duracion = s.DURACION_TOTAL_MINUTOS ? `${s.DURACION_TOTAL_MINUTOS} min` : '';
                        const estadoColors = {
                          'programado': 'bg-blue-100 text-blue-700 border-blue-200',
                          'realizado': 'bg-green-100 text-green-700 border-green-200',
                          'cancelado': 'bg-red-100 text-red-700 border-red-200',
                          'reprogramado': 'bg-amber-100 text-amber-700 border-amber-200'
                        };
                        const estadoClass = estadoColors[s.ESTADO] || 'bg-gray-100 text-gray-700 border-gray-200';
                        const puedeEliminar = !s.ASISTIO && s.ESTADO === 'programado';

                        return (
                          <tr key={s.ID_SESION || idx} className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap text-gray-900 capitalize">{fechaStr}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-700">{horaIni}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-700">{horaFin}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-500">{duracion}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="inline-flex items-center gap-2">
                                {s.CURSO_COLOR && (
                                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.CURSO_COLOR }} />
                                )}
                                <span className="font-medium text-gray-900">{s.NOMBRE_CURSO || '—'}</span>
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-700">{s.DOCENTE_ASIGNADO || '—'}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${estadoClass}`}>
                                {s.ESTADO || '—'}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center">
                              <button
                                onClick={() => setSesionEliminar({ id: s.ID_SESION, fecha: fechaStr, curso: s.NOMBRE_CURSO })}
                                disabled={!puedeEliminar || sesionesManual.saving}
                                title={puedeEliminar ? 'Eliminar sesión' : 'No se puede eliminar (asistencia registrada o estado no programado)'}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-md text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                              >
                                {sesionesManual.saving ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-200 border-t-red-500" />
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  </div>
                </div>
              )}

              {/* Dialog de confirmación de eliminación */}
              {sesionEliminar && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                  <div className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900">¿Eliminar sesión?</h3>
                        <p className="mt-1 text-sm text-gray-600">
                          Se eliminará la sesión de <span className="font-medium text-gray-900">{sesionEliminar.curso}</span> del <span className="font-medium text-gray-900">{sesionEliminar.fecha}</span>.
                        </p>
                        <p className="mt-1 text-xs text-gray-400">Esta acción no se puede deshacer.</p>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => setSesionEliminar(null)}
                        disabled={sesionesManual.saving}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={async () => {
                          const id = sesionEliminar.id;
                          setSesionEliminar(null);
                          await sesionesManual.handleEliminarSesion(id);
                        }}
                        disabled={sesionesManual.saving}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {sesionesManual.saving ? 'Eliminando...' : 'Sí, eliminar'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : loading ? (
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
                idGrupo={sharedGrupo}
                stableFormData={stableFormData}
                cellEvents={cellEvents}
                grupoCursosData={grupoCursosData}
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
              <p className="mt-3 text-gray-500 font-medium">Sin plantilla</p>
              <p className="mt-1 text-sm text-gray-400">El grupo no tiene plantilla horaria o no se pudo cargar.</p>
            </div>
          )}
        </>
      )}

      {conflictError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClearConflict} />
          <div className={`relative bg-white rounded-2xl shadow-2xl overflow-hidden mx-4 transition-all duration-300 ${
            typeof conflictError === 'object' && conflictError?.tipo
              ? 'w-full max-w-3xl'
              : 'w-full max-w-6xl'
          }`}>
            <div className={`p-6 border-b ${
              typeof conflictError === 'object' && conflictError?.tipo === 'SOLAPAMIENTO_DOCENTE'
                ? 'bg-red-50 border-red-200'
                : typeof conflictError === 'object' && conflictError?.tipo === 'SOLAPAMIENTO_PLAZA'
                  ? 'bg-orange-50 border-orange-200'
                  : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                  typeof conflictError === 'object' && conflictError?.tipo === 'SOLAPAMIENTO_DOCENTE'
                    ? 'bg-red-100'
                    : typeof conflictError === 'object' && conflictError?.tipo === 'SOLAPAMIENTO_PLAZA'
                      ? 'bg-orange-100'
                      : 'bg-red-100'
                }`}>
                  <svg className={`w-6 h-6 ${
                    typeof conflictError === 'object' && conflictError?.tipo === 'SOLAPAMIENTO_DOCENTE'
                      ? 'text-red-600'
                      : typeof conflictError === 'object' && conflictError?.tipo === 'SOLAPAMIENTO_PLAZA'
                        ? 'text-orange-600'
                        : 'text-red-600'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-bold ${
                    typeof conflictError === 'object' && conflictError?.tipo === 'SOLAPAMIENTO_DOCENTE'
                      ? 'text-red-700'
                      : typeof conflictError === 'object' && conflictError?.tipo === 'SOLAPAMIENTO_PLAZA'
                        ? 'text-orange-700'
                        : 'text-red-700'
                  }`}>
                    {typeof conflictError === 'object' && conflictError?.titulo
                      ? `⚠️ ${conflictError.titulo}`
                      : '⚠️ Solapamiento Detectado'
                    }
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {typeof conflictError === 'object' && conflictError?.tipo === 'SOLAPAMIENTO_DOCENTE'
                      ? 'El docente ya está asignado a otro grupo en este horario'
                      : typeof conflictError === 'object' && conflictError?.tipo === 'SOLAPAMIENTO_PLAZA'
                        ? 'La plaza ya está asignada a otro grupo en este horario'
                        : 'No se puede asignar - ya existe uso en otro grupo'
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className={`rounded-lg border overflow-hidden ${
              typeof conflictError === 'object' && conflictError?.tipo === 'SOLAPAMIENTO_PLAZA'
                ? 'bg-orange-50/30 border-orange-200'
                : 'bg-red-50/30 border-red-200'
            }`}>
              <ConflictErrorDisplay error={conflictError} />
            </div>

            <div className={`p-4 border-t flex justify-end ${
              typeof conflictError === 'object' && conflictError?.tipo === 'SOLAPAMIENTO_PLAZA'
                ? 'bg-orange-50 border-orange-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <button
                onClick={handleClearConflict}
                className={`px-6 py-2.5 text-sm font-semibold rounded-lg text-white transition-colors ${
                  typeof conflictError === 'object' && conflictError?.tipo === 'SOLAPAMIENTO_PLAZA'
                    ? 'bg-orange-500 hover:bg-orange-600'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {advertenciaHoras && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={handleClearAdvertencia} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="p-6 border-b border-amber-200 bg-amber-50">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-amber-100">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-amber-700">Advertencia de Horas</h3>
                  <p className="text-sm text-gray-600 mt-1">El curso excede las horas académicas planificadas</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-3">
              {advertenciaHoras.excede_ciclo && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <span className="text-sm font-medium text-gray-700">Horas Ciclo</span>
                  <span className="text-sm font-bold text-amber-700">
                    {advertenciaHoras.horas_ciclo_asignadas} / {advertenciaHoras.horas_ciclo_requeridas} req.
                  </span>
                </div>
              )}
              {advertenciaHoras.excede_totales && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-200">
                  <span className="text-sm font-medium text-gray-700">Horas Totales</span>
                  <span className="text-sm font-bold text-red-700">
                    {advertenciaHoras.horas_totales_asignadas} / {advertenciaHoras.horas_totales_requeridas} req.
                  </span>
                </div>
              )}
              <p className="text-xs text-gray-500">
                La asignación se realizó correctamente, pero revise las estadísticas para verificar.
              </p>
            </div>
            <div className="p-4 border-t border-amber-200 bg-amber-50 flex justify-end">
              <button
                onClick={handleClearAdvertencia}
                className="px-5 py-2 text-sm font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors"
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
        idGrupo={sharedGrupo}
        grupoNombre={grupoNombre}
      />
    </div>
  );
}

export default GruposProgramacionPanel;
