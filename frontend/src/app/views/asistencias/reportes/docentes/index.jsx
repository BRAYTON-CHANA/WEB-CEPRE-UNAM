import React, { useState, useEffect } from 'react';
import Layout from '@/shared/components/layout/Layout';
import { Link } from 'react-router-dom';
import { usePeriodos } from '@/features/asistencias/grupos/hooks/usePeriodos';
import { SedeTabs } from '@/features/asistencias/grupos/components/SedeTabs';
import { db } from '@/shared/api';
import { exportRegistroDocente, exportRegistroSede } from '@/features/asistencias/reportes/docentes/utils/exportRegistroDocente';

function AsistenciasReportesDocentes() {
  const { periodos, periodoActivo, setPeriodoActivo, loading: loadingPeriodos } = usePeriodos();
  const [sedeActiva, setSedeActiva] = useState(null);
  const [sedes, setSedes] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conteoPorSede, setConteoPorSede] = useState({});
  const [exportandoDocente, setExportandoDocente] = useState(null);
  const [exportandoSede, setExportandoSede] = useState(false);
  const [progresoSede, setProgresoSede] = useState({ current: 0, total: 0 });

  // Cargar sedes y docentes por período
  useEffect(() => {
    if (!periodoActivo) {
      setSedes([]);
      setSedeActiva(null);
      setDocentes([]);
      setConteoPorSede({});
      return;
    }

    setLoading(true);
    Promise.all([
      db.select('SEDES', { ACTIVO: true }),
      db.select('VW_HORAS_POR_DOCENTE', { ID_PERIODO: periodoActivo })
    ])
      .then(([sedesData, docentesData]) => {
        const sedesList = sedesData || [];
        const docs = docentesData || [];
        
        // Ordenar sedes: Moquegua primero
        const sedesOrdenadas = sedesList.sort((a, b) => {
          const aMoq = a.NOMBRE_SEDE?.toLowerCase().includes('moquegua');
          const bMoq = b.NOMBRE_SEDE?.toLowerCase().includes('moquegua');
          if (aMoq && !bMoq) return -1;
          if (!aMoq && bMoq) return 1;
          return a.NOMBRE_SEDE.localeCompare(b.NOMBRE_SEDE);
        });
        
        setSedes(sedesOrdenadas);
        setDocentes(docs);

        // Contar docentes por sede
        const conteo = {};
        sedesOrdenadas.forEach(sede => {
          const sedesDeDocente = docs.flatMap(d => d.SEDES || []);
          conteo[sede.ID_SEDE] = docs.filter(d => {
            const docSedes = d.SEDES || [];
            return docSedes.includes(sede.NOMBRE_SEDE);
          }).length;
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
  const docentesFiltrados = docentes.filter(d => {
    const docSedes = d.SEDES || [];
    return sedeActual && docSedes.includes(sedeActual.NOMBRE_SEDE);
  });

  const handleExportDocente = async (docente) => {
    const nombre = docente.NOMBRE_COMPLETO || `${docente.APELLIDOS} ${docente.NOMBRES}`;
    setExportandoDocente(docente.ID_DOCENTE);
    try {
      await exportRegistroDocente(docente.ID_DOCENTE, nombre, periodoActivo);
    } finally {
      setExportandoDocente(null);
    }
  };

  const handleExportSede = async () => {
    if (!sedeActual || docentesFiltrados.length === 0) return;
    setExportandoSede(true);
    setProgresoSede({ current: 0, total: docentesFiltrados.length });
    try {
      await exportRegistroSede(
        sedeActual,
        periodoActivo,
        docentesFiltrados,
        (current, total) => setProgresoSede({ current, total })
      );
    } finally {
      setExportandoSede(false);
      setProgresoSede({ current: 0, total: 0 });
    }
  };

  return (
    <Layout>
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
                <span className="text-xs font-semibold text-violet-600 uppercase tracking-widest">Docentes</span>
              </div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">Reporte Docentes</h1>
              <p className="text-gray-400 mt-1 text-sm">Reportes de asistencia y horas de docentes por período y sede</p>
            </div>

            {/* Period selector + Download buttons */}
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

              {/* Download Total button */}
              <button
                onClick={handleExportSede}
                disabled={exportandoSede || !periodoActivo || docentesFiltrados.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
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
              <p className="text-gray-500">Elige un período académico para ver los docentes.</p>
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

              {/* Docentes Grid */}
              <div className="mt-6">
                {loading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="h-36 bg-white border border-gray-100 rounded-2xl animate-pulse" />
                    ))}
                  </div>
                ) : docentesFiltrados.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-gray-200">
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                    <p className="text-gray-400 font-medium text-sm">No hay docentes en esta sede para el período seleccionado</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {docentesFiltrados.map(docente => (
                      <div key={docente.ID_DOCENTE} className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md hover:border-violet-200 transition-all cursor-pointer">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-lg">
                            {docente.NOMBRES?.[0]}{docente.APELLIDOS?.[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-sm truncate">{docente.APELLIDOS} {docente.NOMBRES}</h3>
                            <p className="text-xs text-gray-500">{docente.TIPO_DOCENTE}</p>
                          </div>
                        </div>
                        <div className="space-y-1 mb-3">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Horas:</span>
                            <span className="font-medium text-gray-700">{docente.TOTAL_HORAS_REALIZADAS ?? 0}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Plazas:</span>
                            <span className="font-medium text-gray-700">{docente.TOTAL_PLAZAS ?? 0}</span>
                          </div>
                        </div>
                        {/* Download button per docente */}
                        <button
                          onClick={() => handleExportDocente(docente)}
                          disabled={exportandoDocente === docente.ID_DOCENTE}
                          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {exportandoDocente === docente.ID_DOCENTE ? (
                            <>
                              <span className="animate-spin h-3.5 w-3.5 border-2 border-emerald-600 border-t-transparent rounded-full" />
                              Generando...
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

export default AsistenciasReportesDocentes;
