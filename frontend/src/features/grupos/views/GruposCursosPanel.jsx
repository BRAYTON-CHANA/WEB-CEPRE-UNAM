import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DatabaseTableEditable from '@/shared/components/table/views/DatabaseTableEditable';
import ReferenceSelectInput from '@/shared/components/ui/inputs/ReferenceSelectInput';
import { db } from '@/shared/api';
import cacheService from '@/shared/services/cacheService';

/**
 * GruposCursosPanel — tab 2: Cursos por Grupo.
 * Cascada de filtros: período → modalidad → sede (si presencial) → grupo.
 * Muestra la tabla editable de cursos del grupo con asignación de plaza docente (guardado manual).
 *
 * Props:
 *   sharedPeriodo, onSharedPeriodoChange — período compartido entre tabs
 *   initialGrupo — grupo pre-seleccionado al navegar desde tab 1
 */
function GruposCursosPanel({ sharedPeriodo, onSharedPeriodoChange, sharedModalidad, onSharedModalidadChange, sharedSede, onSharedSedeChange, sharedGrupo, onSharedGrupoChange, initialGrupo }) {
  const selectedModalidad = sharedModalidad || '';
  const selectedSede = sharedSede || '';
  const selectedGrupo = sharedGrupo || (initialGrupo?.ID_GRUPO ? String(initialGrupo.ID_GRUPO) : '');
  const [grupoData, setGrupoData] = useState(initialGrupo || null);
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isVirtual = selectedModalidad === 'VIRTUAL';

  // Cuando cambia el período, limpiar toda la cascada
  useEffect(() => {
    if (!sharedPeriodo) {
      onSharedModalidadChange?.('');
      onSharedSedeChange?.('');
      onSharedGrupoChange?.('');
      setGrupoData(null);
      setCursos([]);
    }
  }, [sharedPeriodo]); // eslint-disable-line react-hooks/exhaustive-deps

  // Si viene initialGrupo, preseleccionar y derivar modalidad/sede
  useEffect(() => {
    if (initialGrupo?.ID_GRUPO) {
      onSharedGrupoChange?.(String(initialGrupo.ID_GRUPO));
      setGrupoData(initialGrupo);
      if (initialGrupo.MODALIDAD) onSharedModalidadChange?.(initialGrupo.MODALIDAD);
      if (initialGrupo.MODALIDAD === 'PRESENCIAL' && initialGrupo.ID_SEDE) {
        onSharedSedeChange?.(String(initialGrupo.ID_SEDE));
      }
    }
  }, [initialGrupo]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cargar cursos del grupo seleccionado
  const fetchCursos = useCallback(async () => {
    if (!selectedGrupo) {
      setCursos([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await db.select('VW_GRUPO_CURSO', { ID_GRUPO: selectedGrupo });
      setCursos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Error al cargar los cursos del grupo');
      setCursos([]);
    } finally {
      setLoading(false);
    }
  }, [selectedGrupo]);

  useEffect(() => {
    fetchCursos();
  }, [fetchCursos]);

  // Cargar datos del grupo seleccionado (para el hero card)
  useEffect(() => {
    if (!selectedGrupo) {
      setGrupoData(null);
      return;
    }
    if (initialGrupo?.ID_GRUPO && String(initialGrupo.ID_GRUPO) === String(selectedGrupo)) {
      setGrupoData(initialGrupo);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await db.select('VW_GRUPOS', { ID_GRUPO: selectedGrupo });
        if (!cancelled) setGrupoData(Array.isArray(data) && data[0] ? data[0] : null);
      } catch {
        if (!cancelled) setGrupoData(null);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedGrupo, initialGrupo]);

  const handlePeriodoChange = (name, value) => {
    onSharedPeriodoChange(value);
    onSharedModalidadChange?.('');
    onSharedSedeChange?.('');
    onSharedGrupoChange?.('');
    setGrupoData(null);
  };

  const handleModalidadChange = (e) => {
    onSharedModalidadChange?.(e.target.value);
    onSharedSedeChange?.('');
    onSharedGrupoChange?.('');
    setGrupoData(null);
  };

  const handleSedeChange = (name, value) => {
    onSharedSedeChange?.(value);
    onSharedGrupoChange?.('');
    setGrupoData(null);
  };

  const handleGrupoChange = (name, value) => {
    onSharedGrupoChange?.(value);
  };

  const handleSaveSuccess = useCallback((recordId, field, newValue) => {
    setCursos(prev => prev.map(r =>
      String(r.ID_GRUPO_CURSO) === String(recordId)
        ? { ...r, [field]: newValue }
        : r
    ));
    cacheService.invalidateAll();
  }, []);

  // Filtros dinámicos para el selector de grupos según la cascada
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

  // ¿Está listo para seleccionar grupo?
  const canSelectGrupo = sharedPeriodo && selectedModalidad && (isVirtual || selectedSede);

  const headers = [
    { field: 'CODIGO_CURSO', title: 'Código', type: 'string' },
    { field: 'NOMBRE_CURSO', title: 'Curso', type: 'string' },
    { field: 'EJE_TEMATICO', title: 'Eje Temático', type: 'string' },
    { field: 'HORAS_ACADEMICAS_CICLO', title: 'H/Ciclo', type: 'number' },
    { field: 'HORAS_ACADEMICAS_TOTALES', title: 'H/Total', type: 'number' },
    {
      field: 'ID_PLAZA_DOCENTE',
      title: 'Plaza / Docente',
      type: 'function-select',
      label: 'Plaza / Docente',
      editable: true,
      functionName: 'fn_plazas_por_grupo_curso',
      functionParams: {
        p_id_grupo: '{ID_GRUPO}',
        p_id_curso: '{ID_CURSO}'
      },
      valueField: 'id_plaza_docente',
      labelField: '{plaza_label}',
      descriptionField: '{plaza_descripcion}',
      placeholder: 'Sin asignar',
      searchable: true,
      freezeParams: true,
      showRefreshButton: true,
      targetTable: 'GRUPO_CURSO',
      targetField: 'ID_PLAZA_DOCENTE',
      render: (value, row) => {
        if (!value) return <span className="text-gray-300 italic">Sin asignar</span>;
        const id = row.IDENTIFICADOR_DOCENTE || '';
        const nombre = row.DOCENTE_NOMBRE || '';
        const sinDocente = !nombre || nombre === 'Sin docente asignado';
        return (
          <span className="text-sm">
            <span className="font-medium text-gray-900">{id}</span>
            {sinDocente ? (
              <span className="text-amber-500 italic"> - Sin docente asignado</span>
            ) : (
              <span className="text-gray-500"> - {nombre}</span>
            )}
          </span>
        );
      }
    }
  ];

  const totalHorasCiclo = cursos.reduce((sum, c) => sum + (Number(c.HORAS_ACADEMICAS_CICLO) || 0), 0);
  const totalHorasTotales = cursos.reduce((sum, c) => sum + (Number(c.HORAS_ACADEMICAS_TOTALES) || 0), 0);
  const asignados = cursos.filter(c => c.ID_PLAZA_DOCENTE).length;

  return (
    <div className="px-6 py-6 space-y-6 max-w-7xl mx-auto">
      {/* ===== Filtros en cascada: período → modalidad → sede → grupo ===== */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 space-y-4">
          {/* Fila 1: Período + Modalidad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Período (obligatorio, compartido) */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                Período <span className="text-red-500">*</span>
              </label>
              <ReferenceSelectInput
                name="id_periodo"
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

            {/* Modalidad (obligatorio) */}
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

          {/* Fila 2: Sede (solo presencial) + Grupo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sede (solo si es presencial) */}
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
                  name="id_sede"
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

            {/* Grupo (obligatorio, con buscador integrado) */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                Grupo <span className="text-red-500">*</span>
              </label>
              <ReferenceSelectInput
                name="id_grupo"
                referenceTable="VW_GRUPOS"
                referenceField="ID_GRUPO"
                referenceQuery="{CODIGO_GRUPO} — {NOMBRE_GRUPO}"
                placeholder={canSelectGrupo ? 'Seleccione un grupo...' : 'Complete los filtros previos'}
                searchable={true}
                showRefreshButton={true}
                value={selectedGrupo}
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

      {/* ===== Estado: sin período ===== */}
      {!sharedPeriodo && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="mt-4 text-gray-500 font-medium">Seleccione un período</p>
          <p className="mt-2 text-sm text-gray-400">Elija un período académico para comenzar.</p>
        </div>
      )}

      {/* ===== Estado: período seleccionado, sin modalidad ===== */}
      {sharedPeriodo && !selectedModalidad && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="mt-4 text-gray-500 font-medium">Seleccione una modalidad</p>
          <p className="mt-2 text-sm text-gray-400">Elija presencial o virtual para continuar.</p>
        </div>
      )}

      {/* ===== Estado: presencial sin sede ===== */}
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

      {/* ===== Estado: filtros completos, sin grupo ===== */}
      {canSelectGrupo && !selectedGrupo && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.121 4.738 7.677 4 5.25 4c-2.121 0-3.879.612-5.25 1.5v13C1.629 17.612 3.387 17 5.25 17c2.427 0 4.871.738 6.75 2.253m0-13C13.879 4.738 16.323 4 18.75 4c2.121 0 3.879.612 5.25 1.5v13C21.879 17.612 20.121 17 18.75 17c-2.427 0-4.871.738-6.75 2.253" />
          </svg>
          <p className="mt-4 text-gray-500 font-medium">Seleccione un grupo</p>
          <p className="mt-2 text-sm text-gray-400">Elija un grupo para ver y asignar sus cursos.</p>
        </div>
      )}

      {/* ===== Contenido: grupo seleccionado ===== */}
      {canSelectGrupo && selectedGrupo && (
        <>
          {/* Hero card del grupo */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#2D366F] via-[#3a4289] to-[#57C7C2] p-5 text-white shadow-lg">
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                backgroundSize: '20px 20px'
              }}
            />
            <div className="relative flex items-start justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.121 4.738 7.677 4 5.25 4c-2.121 0-3.879.612-5.25 1.5v13C1.629 17.612 3.387 17 5.25 17c2.427 0 4.871.738 6.75 2.253m0-13C13.879 4.738 16.323 4 18.75 4c2.121 0 3.879.612 5.25 1.5v13C21.879 17.612 20.121 17 18.75 17c-2.427 0-4.871.738-6.75 2.253" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-white truncate">{grupoData?.NOMBRE_GRUPO || '—'}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-white/20 backdrop-blur-sm border border-white/15">
                      {grupoData?.CODIGO_GRUPO}
                    </span>
                    {grupoData?.MODALIDAD && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${grupoData.MODALIDAD === 'VIRTUAL' ? 'bg-purple-400/30 border-purple-300/20' : 'bg-emerald-400/30 border-emerald-300/20'} border backdrop-blur-sm`}>
                        {grupoData.MODALIDAD}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-3xl font-black text-white leading-none">{cursos.length}</div>
                <div className="text-xs text-white/70 uppercase tracking-wider mt-1">curso{cursos.length !== 1 ? 's' : ''}</div>
              </div>
            </div>
            {(grupoData?.NOMBRE_SEDE || grupoData?.NOMBRE_AREA) && (
              <div className="relative flex items-center gap-2 mt-4 pt-3 border-t border-white/15 text-sm text-white/80">
                {grupoData?.NOMBRE_SEDE && (
                  <span className="inline-flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {grupoData.NOMBRE_SEDE}
                  </span>
                )}
                {grupoData?.NOMBRE_SEDE && grupoData?.NOMBRE_AREA && <span className="text-white/30">·</span>}
                {grupoData?.NOMBRE_AREA && (
                  <span className="inline-flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    {grupoData.NOMBRE_AREA}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Stats cards */}
          {!loading && !error && cursos.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-gray-200 bg-white p-3.5 shadow-sm">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">H. Ciclo</div>
                <div className="text-2xl font-bold text-[#2D366F] font-mono leading-none">{totalHorasCiclo}</div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-3.5 shadow-sm">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">H. Totales</div>
                <div className="text-2xl font-bold text-[#57C7C2] font-mono leading-none">{totalHorasTotales}</div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-3.5 shadow-sm">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Asignados</div>
                <div className="text-2xl font-bold text-emerald-600 font-mono leading-none">{asignados}<span className="text-sm text-gray-400 font-sans">/{cursos.length}</span></div>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-10 h-10 border-3 border-gray-200 border-t-[#2D366F] rounded-full animate-spin" />
              <span className="text-gray-500 text-sm font-medium">Cargando cursos...</span>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-red-50/50 p-5 flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-red-800 text-sm font-semibold">Error al cargar</p>
                <p className="text-red-600 text-sm mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Tabla editable (guardado manual) */}
          {!loading && !error && (
            <>
              {cursos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.121 4.738 7.677 4 5.25 4c-2.121 0-3.879.612-5.25 1.5v13C1.629 17.612 3.387 17 5.25 17c2.427 0 4.871.738 6.75 2.253m0-13C13.879 4.738 16.323 4 18.75 4c2.121 0 3.879.612 5.25 1.5v13C21.879 17.612 20.121 17 18.75 17c-2.427 0-4.871.738-6.75 2.253" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-700 text-sm font-medium">Sin cursos asignados</p>
                    <p className="text-gray-400 text-xs mt-0.5">Este grupo no tiene cursos vinculados todavía.</p>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <DatabaseTableEditable
                    data={cursos}
                    headers={headers}
                    primaryKey="ID_GRUPO_CURSO"
                    externalLoading={loading}
                    saveMode="manual"
                    onSaveSuccess={handleSaveSuccess}
                    formatToastMessage={(recordId, field, newValue, primaryKey, rowData) =>
                      `${rowData?.NOMBRE_CURSO || 'Curso'}: Plaza asignada → ${newValue || 'Sin asignar'}`
                    }
                    toastProps={{ fontFamily: 'inherit', backgroundColor: '#2E3A68' }}
                    tableProps={{ emptyMessage: 'Sin cursos' }}
                  />
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default GruposCursosPanel;
