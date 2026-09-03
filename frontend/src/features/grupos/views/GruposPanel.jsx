import React, { useState, useEffect, useMemo } from 'react';
import { CrudMultiLevelManager } from '@/shared/components/crud';
import TableMultiLevelEditable from '@/shared/components/table/views/TableMultiLevelEditable';
import DatabaseTableEditable from '@/shared/components/table/views/DatabaseTableEditable';
import ReferenceSelectInput from '@/shared/components/ui/inputs/ReferenceSelectInput';
import FilterSelect from '@/shared/components/ui/inputs/FilterSelect';
import { useGrupos } from '@/features/grupos/hooks/useGrupos';
import { GRUPOS_LEVEL_STYLES } from '@/features/grupos/config/levelStyles';
import GruposBatchModal from '@/features/grupos/components/GruposBatchModal';

const GRUPOS_VIEW_MODE_KEY = 'grupos-view-mode';

/**
 * GruposPanel — toda la lógica de UI del tab de Grupos.
 * CRUD 3 niveles con lazy loading + selector de período.
 * Nivel 1: Sedes (incl. virtual, async) → Nivel 2: Áreas (sync) → Nivel 3: Grupos (editable).
 * Toggle Compacto/Plano: modo plano con filtros por sede, modalidad y búsqueda.
 * Botón "Crear Grupos" abre modal batch con grid Sede x Área.
 *
 * Props:
 *   sharedPeriodo, onSharedPeriodoChange — período compartido entre tabs
 *   onVerCursos — callback al presionar "Ver Cursos" (navega al tab 2)
 */
function GruposPanel({ sharedPeriodo, onSharedPeriodoChange, onVerCursos, onVerProgramacion }) {
  const {
    selectedPeriodo, selectedPeriodoNombre, handlePeriodoChange,
    records, loading, error,
    onExpand, childrenData, childrenLoading, updateRecord,
    gruposCrud, tableLevelConfigs, crudLevels,
    isBatchOpen, batchSubmitting, batchError,
    handleBatchOpen, handleBatchClose, handleBatchSubmit,
    handleAddGrupoFlat,
    // Modo plano
    gruposAll, gruposAllLoading, gruposAllError,
    flatTableConfig, refreshGruposAll, updateRecordFlat
  } = useGrupos({
    externalPeriodo: sharedPeriodo,
    onExternalPeriodoChange: onSharedPeriodoChange,
    onVerCursos,
    onVerProgramacion
  });

  // Persistencia del modo de vista
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem(GRUPOS_VIEW_MODE_KEY) || 'compact';
    } catch {
      return 'compact';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(GRUPOS_VIEW_MODE_KEY, viewMode);
    } catch {}
  }, [viewMode]);

  // ── Filtros del modo plano ────────────────────────────────────────
  const [flatFilters, setFlatFilters] = useState({ sede: '', modalidad: '', buscar: '' });
  const clearFlatFilter = (key) => setFlatFilters(prev => ({ ...prev, [key]: '' }));
  const resetFlatFilters = () => setFlatFilters({ sede: '', modalidad: '', buscar: '' });

  // Opciones únicas derivadas de gruposAll
  const flatFilterOptions = useMemo(() => {
    const sedesMap = new Map();
    const modalidadesSet = new Set();
    (gruposAll || []).forEach(g => {
      if (g.NOMBRE_SEDE) sedesMap.set(g.NOMBRE_SEDE, g.NOMBRE_SEDE);
      if (g.MODALIDAD) modalidadesSet.add(g.MODALIDAD);
    });
    return {
      sedes: Array.from(sedesMap.entries()).map(([value, label]) => ({ value, label })),
      modalidades: Array.from(modalidadesSet).map(m => ({ value: m, label: m }))
    };
  }, [gruposAll]);

  // gruposAll filtrado en cliente
  const gruposAllFiltered = useMemo(() => {
    if (!gruposAll) return [];
    const { sede, modalidad, buscar } = flatFilters;
    if (!sede && !modalidad && !buscar) return gruposAll;
    const q = buscar.trim().toLowerCase();
    return gruposAll.filter(g => {
      if (sede && g.NOMBRE_SEDE !== sede) return false;
      if (modalidad && g.MODALIDAD !== modalidad) return false;
      if (q && !((g.NOMBRE_GRUPO || '').toLowerCase().includes(q) || (g.CODIGO_GRUPO || '').toLowerCase().includes(q))) return false;
      return true;
    });
  }, [gruposAll, flatFilters]);

  const hasActiveFlatFilters = !!(flatFilters.sede || flatFilters.modalidad || flatFilters.buscar);
  const flatFilteredCount = gruposAllFiltered.length;

  return (
    <>
      <div className="px-6 py-6 space-y-6">
        {/* ===== Header unificado: título + selector de período + acción ===== */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-6 py-5">
            {/* Título + descripción */}
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-gray-900 tracking-tight leading-tight">
                Grupos
              </h1>
              <p className="text-gray-500 text-sm leading-relaxed">
                Gestión de grupos por período y sede
              </p>
            </div>

            {/* Selector de período + botón crear */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 shrink-0">
              <div className="w-full sm:w-64">
                <ReferenceSelectInput
                  name="id_periodo"
                  label="Período Académico"
                  referenceTable="PERIODOS"
                  referenceField="ID_PERIODO"
                  referenceLabelField="NOMBRE_PERIODO"
                  placeholder="Seleccione un período..."
                  searchable={true}
                  showRefreshButton={true}
                  value={selectedPeriodo}
                  onChange={handlePeriodoChange}
                  formData={{}}
                />
              </div>
              <button
                onClick={handleBatchOpen}
                disabled={!selectedPeriodo}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow disabled:opacity-40 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap h-[42px]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Crear Grupos
              </button>
            </div>
          </div>
        </div>

        {/* ===== Toggle de modo de vista (solo si hay periodo) ===== */}
        {selectedPeriodo && (
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg w-fit">
            <button
              type="button"
              onClick={() => setViewMode('compact')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                viewMode === 'compact'
                  ? 'bg-white text-[#25346A] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Vista agrupada por sedes y áreas"
            >
              <span className="inline-flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                Compacto
              </span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('flat')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                viewMode === 'flat'
                  ? 'bg-white text-[#25346A] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Vista plana con todos los grupos"
            >
              <span className="inline-flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                Plano
              </span>
            </button>
          </div>
        )}

        {/* ===== Estado: sin periodo seleccionado ===== */}
        {!selectedPeriodo && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 mx-auto">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-gray-900 font-medium text-sm mb-1">Seleccione un período</h3>
            <p className="text-gray-400 text-sm">Elija un período académico para ver los grupos disponibles.</p>
          </div>
        )}

        {/* ===== Modo compacto: 3 niveles con lazy loading ===== */}
        {selectedPeriodo && viewMode === 'compact' && (
          <>
            {loading && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
                <div className="inline-block w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-3" />
                <p className="text-gray-500 text-sm">Cargando sedes...</p>
              </div>
            )}

            {error && !loading && (
              <div className="bg-red-50 rounded-xl border border-red-100 p-6">
                <p className="text-red-700 text-sm"><strong>Error:</strong> {error.message || error}</p>
              </div>
            )}

            {!loading && !error && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
                <TableMultiLevelEditable
                  key={gruposCrud.refreshTrigger}
                  data={records}
                  levelConfigs={tableLevelConfigs}
                  saveMode="auto"
                  onSaveSuccess={(recordId, field, newValue, primaryKey) => updateRecord(recordId, primaryKey, field, newValue)}
                  formatToastMessage={(recordId, field, newValue, primaryKey, rowData, header) =>
                    `${rowData?.NOMBRE_GRUPO || 'Grupo'}: ${header?.label || field} → ${newValue ? 'Activo' : 'No activo'}`
                  }
                  toastProps={{ fontFamily: 'inherit', backgroundColor: '#2E3A68' }}
                  tableProps={{ onExpand, childrenData, childrenLoading, levelStyles: GRUPOS_LEVEL_STYLES, autoExpand: true }}
                />
              </div>
            )}
          </>
        )}

        {/* ===== Modo plano: tabla plana con filtros ===== */}
        {selectedPeriodo && viewMode === 'flat' && (
          <>
            {gruposAllLoading && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
                <div className="inline-block w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-3" />
                <p className="text-gray-500 text-sm">Cargando grupos...</p>
              </div>
            )}

            {gruposAllError && !gruposAllLoading && (
              <div className="bg-red-50 rounded-xl border border-red-100 p-6">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-red-700 text-sm"><strong>Error:</strong> {gruposAllError.message || gruposAllError}</p>
                  <button
                    onClick={() => refreshGruposAll()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-white border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reintentar
                  </button>
                </div>
              </div>
            )}

            {!gruposAllLoading && !gruposAllError && (
              <>
                {/* Filtros modo plano */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#25346A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                      <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Filtros de grupos</h4>
                      {hasActiveFlatFilters && (
                        <span className="text-xs text-gray-400">· {flatFilteredCount} resultado{flatFilteredCount !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {hasActiveFlatFilters && (
                        <button
                          onClick={resetFlatFilters}
                          className="text-xs text-gray-500 hover:text-red-600 transition-colors"
                        >
                          Limpiar todo
                        </button>
                      )}
                      <button
                        onClick={handleAddGrupoFlat}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap shadow-sm hover:shadow"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        Añadir Grupo
                      </button>
                    </div>
                  </div>
                  <div className="flex items-end gap-3 flex-wrap">
                    <FilterSelect
                      label="Sede"
                      value={flatFilters.sede}
                      onChange={(e) => setFlatFilters(prev => ({ ...prev, sede: e.target.value }))}
                      onClear={() => clearFlatFilter('sede')}
                      options={flatFilterOptions.sedes}
                      placeholder="Todas las sedes"
                      minWidth="min-w-[180px]"
                    />
                    <FilterSelect
                      label="Modalidad"
                      value={flatFilters.modalidad}
                      onChange={(e) => setFlatFilters(prev => ({ ...prev, modalidad: e.target.value }))}
                      onClear={() => clearFlatFilter('modalidad')}
                      options={flatFilterOptions.modalidades}
                      placeholder="Todas las modalidades"
                      minWidth="min-w-[160px]"
                    />
                    <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
                      <label className="text-xs font-medium text-gray-600">Buscar grupo</label>
                      <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                          type="text"
                          value={flatFilters.buscar}
                          onChange={(e) => setFlatFilters(prev => ({ ...prev, buscar: e.target.value }))}
                          placeholder="Buscar por nombre o código..."
                          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors"
                        />
                        {flatFilters.buscar && (
                          <button
                            onClick={() => clearFlatFilter('buscar')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                            title="Limpiar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
                  <DatabaseTableEditable
                    key={`flat-${gruposCrud.refreshTrigger}`}
                    data={gruposAllFiltered}
                    headers={flatTableConfig.headers}
                    actions={flatTableConfig.actions}
                    primaryKey="ID_GRUPO"
                    externalLoading={gruposAllLoading}
                    saveMode="auto"
                    onSaveSuccess={(recordId, field, newValue, primaryKey) => {
                      updateRecordFlat(recordId, primaryKey, field, newValue);
                    }}
                    formatToastMessage={(recordId, field, newValue, primaryKey, rowData, header) =>
                      `${rowData?.NOMBRE_GRUPO || 'Grupo'}: ${header?.label || field} → ${newValue ? 'Activo' : 'No activo'}`
                    }
                    toastProps={{ fontFamily: 'inherit', backgroundColor: '#2E3A68' }}
                    tableProps={{ emptyMessage: hasActiveFlatFilters ? 'No hay grupos que coincidan con los filtros' : 'No hay grupos para este período' }}
                  />
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* ===== Modal batch de creación ===== */}
      <GruposBatchModal
        isOpen={isBatchOpen}
        onClose={handleBatchClose}
        selectedPeriodo={selectedPeriodo}
        periodoNombre={selectedPeriodoNombre}
        onSubmit={handleBatchSubmit}
        submitting={batchSubmitting}
        submitError={batchError}
      />

      {/* ===== Modales CRUD individuales (gestionados por CrudMultiLevelManager) ===== */}
      <CrudMultiLevelManager crudLevels={crudLevels} />
    </>
  );
}

export default GruposPanel;
