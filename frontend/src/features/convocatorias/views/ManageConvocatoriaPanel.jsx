import React, { useState, useEffect, useMemo } from 'react';
import { CrudMultiLevelManager } from '@/shared/components/crud';
import CrudHeader from '@/shared/components/crud/views/CrudHeader';
import { TableMultiLevelEditable, DatabaseTableEditable } from '@/shared/components/table';
import { UNAM_MANAGE_LEVEL_STYLES } from '@/features/convocatorias/config/levelStyles';
import { useManageConvocatoria } from '@/features/convocatorias/hooks/useManageConvocatoria';
import { usePlazasFilters } from '@/features/convocatorias/hooks/usePlazasFilters';
import FilterSelect from '@/shared/components/ui/inputs/FilterSelect';

const PLAZAS_VIEW_MODE_KEY = 'plazas-view-mode';

/**
 * ManageConvocatoriaPanel — página 2: Plazas.
 * Filtro por convocatoria con botón clear (x) y refresh.
 * Tabla multi-nivel: sedes → cursos → plazas.
 * Navega a página 3 (Postulantes) via onViewPostulantes.
 */
function ManageConvocatoriaPanel({ initialConvocatoriaId, onViewPostulantes }) {
  const {
    convocatorias,
    selectedIdConvocatoria,
    selectedConvocatoriaRow,
    loadingFilters,
    handleConvocatoriaChange,
    clearConvocatoria,
    refreshConvocatorias,
  } = usePlazasFilters(initialConvocatoriaId);

  const {
    records, loading, error, updateRecord,
    tableLevelConfigs, crudLevels, childrenData, childrenLoading,
    manageHeaderActions, handleExpand,
    plazasAll, plazasAllLoading, plazasAllError,
    flatTableConfig, refreshPlazasAll, updateRecordFlat
  } = useManageConvocatoria({
    convocatoria: selectedConvocatoriaRow || { ID_CONVOCATORIA: selectedIdConvocatoria },
    onViewPostulantes
  });

  const hasConvocatoriaSelected = !!selectedIdConvocatoria;

  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem(PLAZAS_VIEW_MODE_KEY) || 'compact';
    } catch {
      return 'compact';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(PLAZAS_VIEW_MODE_KEY, viewMode);
    } catch {}
  }, [viewMode]);

  // ── Filtros del modo plano ────────────────────────────────────────
  const [flatFilters, setFlatFilters] = useState({ sede: '', curso: '', modalidad: '', buscar: '' });
  const clearFlatFilter = (key) => setFlatFilters(prev => ({ ...prev, [key]: '' }));
  const resetFlatFilters = () => setFlatFilters({ sede: '', curso: '', modalidad: '', buscar: '' });

  // Opciones únicas derivadas de plazasAll
  const flatFilterOptions = useMemo(() => {
    const sedesMap = new Map();
    const cursosMap = new Map();
    const modalidadesSet = new Set();
    (plazasAll || []).forEach(p => {
      if (p.ID_SEDE != null) sedesMap.set(p.ID_SEDE, p.NOMBRE_SEDE || '—');
      if (p.ID_CURSO != null) cursosMap.set(p.ID_CURSO, `${p.CODIGO_CURSO || ''} - ${p.NOMBRE_CURSO || ''}`.trim());
      if (p.MODALIDAD) modalidadesSet.add(p.MODALIDAD);
    });
    return {
      sedes: Array.from(sedesMap.entries()).map(([value, label]) => ({ value, label })),
      cursos: Array.from(cursosMap.entries()).map(([value, label]) => ({ value, label })),
      modalidades: Array.from(modalidadesSet).map(m => ({ value: m, label: m }))
    };
  }, [plazasAll]);

  // plazasAll filtrado
  const plazasAllFiltered = useMemo(() => {
    if (!plazasAll) return [];
    const { sede, curso, modalidad, buscar } = flatFilters;
    if (!sede && !curso && !modalidad && !buscar) return plazasAll;
    const q = buscar.trim().toLowerCase();
    return plazasAll.filter(p => {
      if (sede && String(p.ID_SEDE) !== String(sede)) return false;
      if (curso && String(p.ID_CURSO) !== String(curso)) return false;
      if (modalidad && p.MODALIDAD !== modalidad) return false;
      if (q && !(p.IDENTIFICADOR_DOCENTE || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [plazasAll, flatFilters]);

  const hasActiveFlatFilters = !!(flatFilters.sede || flatFilters.curso || flatFilters.modalidad || flatFilters.buscar);
  const flatFilteredCount = plazasAllFiltered.length;

  return (
    <CrudMultiLevelManager crudLevels={crudLevels}>
      {() => (
        <div className="px-8 py-8 space-y-6 pb-12">
          {/* Barra de filtros */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-5 h-5 text-[#25346A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Filtros</h3>
            </div>
            <div className="flex items-end gap-4 flex-wrap">
              <FilterSelect
                label="Convocatoria"
                required
                value={selectedIdConvocatoria}
                onChange={handleConvocatoriaChange}
                onClear={clearConvocatoria}
                onRefresh={refreshConvocatorias}
                disabled={loadingFilters}
                loading={loadingFilters}
                placeholder="Seleccionar convocatoria..."
                refreshTitle="Actualizar convocatorias"
                minWidth="min-w-[300px]"
                options={convocatorias.map(c => ({
                  value: c.ID_CONVOCATORIA,
                  label: `${c.NOMBRE_PERIODO}${c.DESCRIPCION ? ` · ${c.DESCRIPCION}` : ''}`
                }))}
              />
            </div>
          </div>

          {/* Contenido */}
          {hasConvocatoriaSelected && (
            <>
              <CrudHeader
                headerTitle={`Plazas — ${selectedConvocatoriaRow?.NOMBRE_PERIODO || ''}`}
                headerDescription="Gestión de sedes, cursos y plazas docentes"
                actions={manageHeaderActions}
              />

              {/* Toggle de modo de vista */}
              <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg w-fit">
                <button
                  type="button"
                  onClick={() => setViewMode('compact')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    viewMode === 'compact'
                      ? 'bg-white text-[#25346A] shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="Vista agrupada por sedes y cursos"
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
                  title="Vista plana con todas las plazas"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    Plano
                  </span>
                </button>
              </div>

              {loading && viewMode === 'compact' && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
                  <div className="inline-block w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-3" />
                  <p className="text-gray-500 text-sm">Cargando cursos...</p>
                </div>
              )}

              {plazasAllLoading && viewMode === 'flat' && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
                  <div className="inline-block w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-3" />
                  <p className="text-gray-500 text-sm">Cargando plazas...</p>
                </div>
              )}

              {error && viewMode === 'compact' && (
                <div className="bg-red-50 rounded-xl border border-red-100 p-6">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-red-700 text-sm"><strong>Error:</strong> {error.message}</p>
                    <button
                      onClick={() => { refreshConvocatorias(); }}
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

              {plazasAllError && viewMode === 'flat' && (
                <div className="bg-red-50 rounded-xl border border-red-100 p-6">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-red-700 text-sm"><strong>Error:</strong> {plazasAllError.message}</p>
                    <button
                      onClick={() => { refreshPlazasAll(); }}
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

              {!loading && !error && viewMode === 'compact' && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
                  <TableMultiLevelEditable
                    data={records}
                    levelConfigs={tableLevelConfigs}
                    saveMode="manual"
                    showBatchSaveButton={true}
                    batchSaveButtonText="Guardar cambios"
                    onSaveSuccess={(recordId, field, newValue, primaryKey) => updateRecord(recordId, primaryKey, field, newValue)}
                    formatToastMessage={(recordId, field, newValue, primaryKey, rowData, header) =>
                      `${rowData?.NOMBRE_SEDE || rowData?.NOMBRE_CURSO || 'Registro'}: ${header?.label || field} → ${newValue ? 'Activo' : 'No activo'}`
                    }
                    toastProps={{ fontFamily: 'inherit', backgroundColor: '#2E3A68' }}
                    tableProps={{
                      onExpand: handleExpand,
                      childrenData,
                      childrenLoading,
                      levelStyles: UNAM_MANAGE_LEVEL_STYLES
                    }}
                  />
                </div>
              )}

              {!plazasAllLoading && !plazasAllError && viewMode === 'flat' && (
                <>
                  {/* Filtros modo plano */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#25346A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Filtros de plazas</h4>
                        {hasActiveFlatFilters && (
                          <span className="text-xs text-gray-400">· {flatFilteredCount} resultado{flatFilteredCount !== 1 ? 's' : ''}</span>
                        )}
                      </div>
                      {hasActiveFlatFilters && (
                        <button
                          onClick={resetFlatFilters}
                          className="text-xs text-gray-500 hover:text-red-600 transition-colors"
                        >
                          Limpiar todo
                        </button>
                      )}
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
                        label="Curso"
                        value={flatFilters.curso}
                        onChange={(e) => setFlatFilters(prev => ({ ...prev, curso: e.target.value }))}
                        onClear={() => clearFlatFilter('curso')}
                        options={flatFilterOptions.cursos}
                        placeholder="Todos los cursos"
                        minWidth="min-w-[220px]"
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
                        <label className="text-xs font-medium text-gray-600">Buscar identificador</label>
                        <div className="relative">
                          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          <input
                            type="text"
                            value={flatFilters.buscar}
                            onChange={(e) => setFlatFilters(prev => ({ ...prev, buscar: e.target.value }))}
                            placeholder="Buscar por identificador..."
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
                      data={plazasAllFiltered}
                      headers={flatTableConfig.headers}
                      actions={Object.values(flatTableConfig.actions)}
                      primaryKey="ID_PLAZA_DOCENTE"
                      externalLoading={plazasAllLoading}
                      saveMode="manual"
                      showBatchSaveButton={true}
                      batchSaveButtonText="Guardar cambios"
                      onSaveSuccess={(recordId, field, newValue, primaryKey) => {
                        updateRecordFlat(recordId, primaryKey, field, newValue);
                      }}
                      tableProps={{ emptyMessage: hasActiveFlatFilters ? 'No hay plazas que coincidan con los filtros' : 'No hay plazas para esta convocatoria' }}
                    />
                  </div>
                </>
              )}
            </>
          )}

          {!hasConvocatoriaSelected && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
              <svg className="w-12 h-12 mx-auto text-gray-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-gray-400 text-sm">
                Seleccione una convocatoria para gestionar las plazas.
              </p>
            </div>
          )}
        </div>
      )}
    </CrudMultiLevelManager>
  );
}

export default ManageConvocatoriaPanel;
