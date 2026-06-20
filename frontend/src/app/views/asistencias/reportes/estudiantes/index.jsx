import React, { useState, useEffect } from 'react';
import Layout from '@/shared/components/layout/Layout';
import { Link } from 'react-router-dom';
import { usePeriodos } from '@/features/asistencias/grupos/hooks/usePeriodos';
import { SedeTabs } from '@/features/asistencias/grupos/components/SedeTabs';
import { db } from '@/shared/api';
import { exportRegistroGrupo, exportRegistroSedEstudiantes } from '@/features/asistencias/reportes/estudiantes/utils/exportRegistroEstudiantes';
import { ModalSeleccionFechas } from '@/features/asistencias/reportes/estudiantes/components/ModalSeleccionFechas';

const selectAll = async (table, filters = {}) => {
  const PAGE_SIZE = 1000;
  let offset = 0;
  const all = [];
  while (true) {
    const res = await db.selectWithLimit(table, PAGE_SIZE, offset, filters);
    const rows = res?.data?.records || res || [];
    all.push(...rows);
    if (rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return all;
};

function ReportesEstudiantes() {
  const { periodos, periodoActivo, setPeriodoActivo, loading: loadingPeriodos } = usePeriodos();
  const [sedeActiva, setSedeActiva] = useState(null);
  const [sedes, setSedes] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conteoPorSede, setConteoPorSede] = useState({});
  const [exportandoGrupo, setExportandoGrupo] = useState(null);
  const [exportandoSede, setExportandoSede] = useState(false);
  const [progresoSede, setProgresoSede] = useState({ current: 0, total: 0 });
  const [modalGrupo, setModalGrupo] = useState(null);
  const [asistenciasModal, setAsistenciasModal] = useState([]);
  const [loadingModal, setLoadingModal] = useState(false);

  useEffect(() => {
    if (!periodoActivo) {
      setSedes([]);
      setSedeActiva(null);
      setGrupos([]);
      setConteoPorSede({});
      return;
    }

    setLoading(true);
    Promise.all([
      db.select('SEDES', { ACTIVO: true }),
      db.select('GRUPOS', { ID_PERIODO: periodoActivo, ACTIVO: true }),
      db.select('TURNOS', { ACTIVO: true }),
      db.select('AREAS', { ACTIVO: true }),
    ])
      .then(([sedesData, gruposData, turnosData, areasData]) => {
        const sedesList = sedesData || [];
        const gruposList = gruposData || [];

        const turnosMap = new Map((turnosData || []).map(t => [t.ID_TURNO, t]));
        const areasMap  = new Map((areasData  || []).map(a => [a.ID_AREA,  a]));
        const sedesMap  = new Map(sedesList.map(s => [s.ID_SEDE, s]));

        const gruposEnriquecidos = gruposList.map(g => ({
          ...g,
          NOMBRE_SEDE:  sedesMap.get(g.ID_SEDE)?.NOMBRE_SEDE  || `Sede ${g.ID_SEDE}`,
          NOMBRE_TURNO: turnosMap.get(g.ID_TURNO)?.NOMBRE_TURNO || '',
          NOMBRE_AREA:  areasMap.get(g.ID_AREA)?.NOMBRE_AREA   || '',
        }));

        const sedesOrdenadas = sedesList.sort((a, b) => {
          const aMoq = a.NOMBRE_SEDE?.toLowerCase().includes('moquegua');
          const bMoq = b.NOMBRE_SEDE?.toLowerCase().includes('moquegua');
          if (aMoq && !bMoq) return -1;
          if (!aMoq && bMoq) return 1;
          return a.NOMBRE_SEDE.localeCompare(b.NOMBRE_SEDE);
        });

        setSedes(sedesOrdenadas);
        setGrupos(gruposEnriquecidos);

        const conteo = {};
        sedesOrdenadas.forEach(sede => {
          conteo[sede.ID_SEDE] = gruposEnriquecidos.filter(g => g.ID_SEDE === sede.ID_SEDE).length;
        });
        setConteoPorSede(conteo);

        if (sedesOrdenadas.length > 0 && !sedeActiva) {
          setSedeActiva(sedesOrdenadas[0].ID_SEDE);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [periodoActivo]);

  const sedeActual = sedes.find(s => s.ID_SEDE === sedeActiva);
  const gruposFiltrados = grupos.filter(g => g.ID_SEDE === sedeActiva);

  const handleExportGrupo = async (grupo) => {
    setExportandoGrupo(grupo.ID_GRUPO);
    setLoadingModal(true);
    try {
      const asistencias = await selectAll('VW_ASISTENCIAS_POSTULANTE', { ID_GRUPO: grupo.ID_GRUPO });
      setAsistenciasModal(asistencias || []);
      setModalGrupo(grupo);
    } catch (err) {
      console.error(err);
    } finally {
      setExportandoGrupo(null);
      setLoadingModal(false);
    }
  };

  const handleConfirmarExport = async (fechasSeleccionadas) => {
    if (!modalGrupo) return;
    const grupo = modalGrupo;
    setModalGrupo(null);
    setAsistenciasModal([]);
    setExportandoGrupo(grupo.ID_GRUPO);
    try {
      await exportRegistroGrupo(grupo, periodoActivo, fechasSeleccionadas);
    } finally {
      setExportandoGrupo(null);
    }
  };

  const handleCerrarModal = () => {
    setModalGrupo(null);
    setAsistenciasModal([]);
  };

  const handleExportSede = async () => {
    if (!sedeActual || gruposFiltrados.length === 0) return;
    setExportandoSede(true);
    setProgresoSede({ current: 0, total: gruposFiltrados.length });
    try {
      await exportRegistroSedEstudiantes(
        sedeActual,
        periodoActivo,
        gruposFiltrados,
        (current, total) => setProgresoSede({ current, total })
      );
    } finally {
      setExportandoSede(false);
      setProgresoSede({ current: 0, total: 0 });
    }
  };

  return (
    <Layout>
      {modalGrupo && (
        <ModalSeleccionFechas
          grupo={modalGrupo}
          asistencias={asistenciasModal}
          onConfirm={handleConfirmarExport}
          onClose={handleCerrarModal}
        />
      )}
      <div className="min-h-screen py-10" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
        <div className="max-w-screen-2xl mx-auto px-6">

          {/* Header */}
          <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link to="/asistencias" className="text-xs font-semibold text-emerald-400 hover:text-emerald-600 uppercase tracking-widest transition-colors">Asistencias</Link>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                <Link to="/asistencias/reportes" className="text-xs font-semibold text-emerald-400 hover:text-emerald-600 uppercase tracking-widest transition-colors">Reportes</Link>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                <span className="text-xs font-semibold text-emerald-600 uppercase tracking-widest">Estudiantes</span>
              </div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">Reporte Estudiantes</h1>
              <p className="text-gray-400 mt-1 text-sm">Reportes de asistencia de estudiantes por grupo y sede</p>
            </div>

            {/* Period selector + Download Total */}
            <div className="flex items-center gap-3 flex-wrap">
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

              <button
                onClick={handleExportSede}
                disabled={exportandoSede || !periodoActivo || gruposFiltrados.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {exportandoSede ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    {progresoSede.total > 0 ? `${progresoSede.current}/${progresoSede.total}` : 'Generando...'}
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Descargar Total
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sin período */}
          {!loadingPeriodos && !periodoActivo && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <div className="text-gray-400 text-5xl mb-4">📅</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Selecciona un período</h3>
              <p className="text-gray-500">Elige un período académico para ver los grupos.</p>
            </div>
          )}

          {periodoActivo && (
            <>
              {/* Sede Tabs */}
              <SedeTabs
                sedes={sedes}
                sedeActiva={sedeActiva}
                onChange={setSedeActiva}
                totalPorSede={conteoPorSede}
              />

              {/* Grupos Grid */}
              <div className="mt-6">
                {loading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="h-40 bg-white border border-gray-100 rounded-2xl animate-pulse" />
                    ))}
                  </div>
                ) : gruposFiltrados.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-gray-200">
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                    </div>
                    <p className="text-gray-400 font-medium text-sm">No hay grupos en esta sede para el período seleccionado</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {gruposFiltrados.map(grupo => (
                      <div key={grupo.ID_GRUPO} className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md hover:border-emerald-200 transition-all">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 font-black text-sm shrink-0">
                            {(grupo.CODIGO_GRUPO || grupo.NOMBRE_GRUPO || 'G').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 text-sm truncate leading-tight">{grupo.NOMBRE_GRUPO || grupo.CODIGO_GRUPO}</h3>
                            <p className="text-xs text-gray-400 truncate">{grupo.NOMBRE_AREA}</p>
                          </div>
                        </div>
                        <div className="space-y-1 mb-3">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Turno:</span>
                            <span className="font-medium text-gray-700 truncate max-w-[100px] text-right">{grupo.NOMBRE_TURNO || '—'}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Capacidad:</span>
                            <span className="font-medium text-gray-700">{grupo.CAPACIDAD_MAXIMA ?? '—'}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleExportGrupo(grupo)}
                          disabled={exportandoGrupo === grupo.ID_GRUPO}
                          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {exportandoGrupo === grupo.ID_GRUPO ? (
                            <>
                              <span className="animate-spin h-3.5 w-3.5 border-2 border-emerald-600 border-t-transparent rounded-full" />
                              {loadingModal ? 'Cargando...' : 'Generando...'}
                            </>
                          ) : (
                            <>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                              Descargar Excel
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default ReportesEstudiantes;
