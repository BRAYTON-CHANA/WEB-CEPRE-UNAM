import React, { useMemo, useCallback, useState } from 'react';
import { CepreLayout } from '@/features/layout';
import { useAuthContext } from '@/shared/context/AuthContext';
import { usePeriodos } from '@/features/asistencias_nuevo/estudiantes/hooks/usePeriodos';
import { usePlazasDocente } from '@/features/asistencias_nuevo/estudiantes/hooks/usePlazasDocente';
import { useHorarioDocente } from '@/features/horario_docente/hooks/useHorarioDocente';
import { exportDocenteToExcel } from '@/features/reportes/docentes/utils/exportDocenteToExcel';
import { exportDocenteToPdf } from '@/features/reportes/docentes/utils/exportDocenteToPdf';
import SesionesHorarioView from '@/features/grupos/components/SesionesHorarioView';

function HorarioDocente() {
  const { user } = useAuthContext();
  const dni = user?.DNI || user?.dni;

  // Período: default = el del navbar (PeriodoContext global vía usePeriodos)
  const { periodos, periodoActivo, setPeriodoActivo, loading: loadingPeriodos } = usePeriodos();

  const { plazas, loading: loadingPlazas, error: errorPlazas } = usePlazasDocente(dni, periodoActivo);
  const idsPlazas = useMemo(() => plazas.map(p => p.ID_PLAZA_DOCENTE), [plazas]);
  const { clusters, sesiones, lookups, loading, error } = useHorarioDocente(idsPlazas);
  const [exporting, setExporting] = useState(null); // 'pdf' | 'excel' | null

  // Celda: curso arriba, grupo · sede como subtexto (la plaza va en el header)
  const getSubtext = useCallback(
    (s) => [s.NOMBRE_GRUPO, s.NOMBRE_SEDE].filter(Boolean).join(' · '),
    []
  );

  const nombreDocente = plazas[0]?.DOCENTE_NOMBRE || user?.NOMBRE_COMPLETO || '';
  const cargando = loadingPlazas || loading;
  const hayError = error || errorPlazas;

  // Descarga: reutiliza las sesiones/lookups YA cargadas (solo plazas de este período → 0 queries)
  const handleExport = async (formato) => {
    if (!sesiones.length || !lookups || exporting) return;
    setExporting(formato);
    const idDocente = plazas[0]?.ID_DOCENTE;
    try {
      if (formato === 'pdf') await exportDocenteToPdf(idDocente, nombreDocente, { sesiones, lookups });
      else await exportDocenteToExcel(idDocente, nombreDocente, { sesiones, lookups });
    } finally {
      setExporting(null);
    }
  };

  return (
    <CepreLayout showSidebar>
      <div className="min-h-screen py-10" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
        <div className="max-w-screen-2xl mx-auto px-6">

          {/* Header — mismo patrón que Asistencia Estudiantes */}
          <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
            <div>
              <span className="text-xs font-semibold text-[#25346A] uppercase tracking-widest">Docente</span>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">Mi Horario</h1>
              <p className="text-gray-400 mt-1 text-sm">
                {nombreDocente
                  ? `${nombreDocente} · ${plazas.length} plaza${plazas.length !== 1 ? 's' : ''} asignada${plazas.length !== 1 ? 's' : ''}`
                  : 'Horario de clases del período seleccionado'}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Descargar horario (usa las sesiones ya cargadas del período) */}
              {clusters.length > 0 && (
                <>
                  <button
                    onClick={() => handleExport('pdf')}
                    disabled={!!exporting}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl px-4 py-2.5 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {exporting === 'pdf' ? (
                      <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                    )}
                    PDF
                  </button>
                  <button
                    onClick={() => handleExport('excel')}
                    disabled={!!exporting}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-xl px-4 py-2.5 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {exporting === 'excel' ? (
                      <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    )}
                    Excel
                  </button>
                </>
              )}

              {/* Selector de período */}
              <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">Período</label>
              {loadingPeriodos ? (
                <div className="h-5 w-36 bg-gray-100 rounded animate-pulse" />
              ) : (
                <select
                  value={periodoActivo ?? ''}
                  onChange={e => setPeriodoActivo(Number(e.target.value))}
                  className="text-sm font-medium text-gray-800 bg-transparent focus:outline-none cursor-pointer"
                >
                  {periodos.map(p => (
                    <option key={p.ID_PERIODO} value={p.ID_PERIODO}>{p.NOMBRE_PERIODO}</option>
                  ))}
                </select>
              )}
              </div>
            </div>
          </div>

          {/* Estados */}
          {!periodoActivo && (
            <EmptyState title="Seleccione un período" text="Elija un período académico para ver su horario de clases." />
          )}

          {periodoActivo && cargando && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-14 text-center">
              <div className="animate-spin rounded-full h-9 w-9 border-[3px] border-[#43B3C1]/25 border-t-[#43B3C1] mx-auto"></div>
              <p className="mt-4 text-sm font-medium text-gray-500">Cargando horario...</p>
            </div>
          )}

          {periodoActivo && !cargando && hayError && (
            <div className="bg-red-50 rounded-xl border border-red-200 shadow-sm p-8 text-center">
              <p className="text-red-800 font-semibold">Error al cargar el horario</p>
              <p className="text-red-600 text-sm mt-1">{error || errorPlazas}</p>
            </div>
          )}

          {periodoActivo && !cargando && !hayError && plazas.length === 0 && (
            <EmptyState title="Sin plazas asignadas" text="No tienes plazas docentes asignadas en este período." />
          )}

          {periodoActivo && !cargando && !hayError && plazas.length > 0 && clusters.length === 0 && (
            <EmptyState title="Sin sesiones programadas" text="Tus plazas aún no tienen sesiones generadas en este período." />
          )}

          {/* Grillas por cluster de turnos compatibles */}
          {periodoActivo && !cargando && clusters.map((cluster, idx) => (
            <section
              key={`cluster-${cluster.repTurnoId}-${idx}`}
              className="animate-fadeInUp bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6"
              style={{ animationDelay: `${idx * 80}ms`, animationFillMode: 'backwards' }}
            >
              <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center gap-x-5 gap-y-2.5">
                <h2 className="text-lg font-bold text-[#25346A] leading-none">
                  Turno {cluster.turnoLabel}
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {cluster.plazas.map(p => (
                    <span
                      key={p.idPlaza}
                      className="inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#43B3C1]/10 text-[#1d7f8c] border border-[#43B3C1]/30"
                    >
                      <svg className="w-3 h-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {p.identificador}
                      {p.curso ? <span className="font-normal text-[#1d7f8c]/80">· {p.curso}</span> : null}
                      {p.sede ? <span className="font-normal text-[#1d7f8c]/80">· {p.sede}</span> : null}
                    </span>
                  ))}
                </div>
              </div>

              <SesionesHorarioView
                sesiones={cluster.sesionesUI}
                turnoBloques={cluster.templateBlocks}
                getSubtext={getSubtext}
                compact
              />
            </section>
          ))}
        </div>
      </div>
    </CepreLayout>
  );
}

const EmptyState = ({ title, text }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-14 text-center">
    <div className="mx-auto h-14 w-14 rounded-2xl bg-[#43B3C1]/10 flex items-center justify-center">
      <svg className="h-7 w-7 text-[#43B3C1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
    <p className="mt-4 text-base font-semibold text-gray-700">{title}</p>
    <p className="mt-1 text-sm text-gray-400">{text}</p>
  </div>
);

export default HorarioDocente;
