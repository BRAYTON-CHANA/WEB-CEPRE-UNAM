import React, { useState, useMemo, useEffect } from 'react';
import Layout from '@/shared/components/layout/Layout';
import { Link } from 'react-router-dom';
import { usePeriodos } from './hooks/usePeriodos';
import { useDocentes } from './hooks/useDocentes';
import { SedeTabs } from '../grupos/components/SedeTabs';
import { DocentesGrid } from './components/DocentesGrid';
import { VistaDocente } from './components/VistaDocente';
import { db } from '@/shared/api';

function AsistenciasDocentes() {
  const { periodos, periodoActivo, setPeriodoActivo, loading: loadingPeriodos } = usePeriodos();
  const [sedeActiva, setSedeActiva] = useState(null);
  const [docenteSeleccionado, setDocenteSeleccionado] = useState(null);
  const [sedes, setSedes] = useState([]);
  const [loadingSedes, setLoadingSedes] = useState(false);

  const { docentes, loading: loadingDocentes, error: errorDocentes } = useDocentes(periodoActivo, sedeActiva);
  const [conteoPorSede, setConteoPorSede] = useState({});

  // Cargar sedes y contar docentes por sede
  useEffect(() => {
    if (!periodoActivo) {
      setSedes([]);
      setSedeActiva(null);
      setConteoPorSede({});
      return;
    }

    setLoadingSedes(true);
    Promise.all([
      db.select('SEDES', { ACTIVO: true }),
      db.select('PLAZA_DOCENTE', { ID_PERIODO: periodoActivo, ACTIVO: true })
    ])
      .then(([sedesData, plazasData]) => {
        const sedesList = sedesData || [];
        const plazas = plazasData || [];

        setSedes(sedesList);

        // Calcular docentes únicos por sede
        const docentesPorSede = {};
        sedesList.forEach(sede => {
          const docentesUnicos = new Set();
          plazas
            .filter(p => p.ID_SEDE === sede.ID_SEDE && p.ID_DOCENTE)
            .forEach(p => docentesUnicos.add(p.ID_DOCENTE));
          docentesPorSede[sede.ID_SEDE] = docentesUnicos.size;
        });
        setConteoPorSede(docentesPorSede);

        if (sedesList.length > 0 && !sedeActiva) {
          setSedeActiva(sedesList[0].ID_SEDE);
        }
      })
      .catch(() => {
        setSedes([]);
        setConteoPorSede({});
      })
      .finally(() => setLoadingSedes(false));
  }, [periodoActivo]);

  // Resetear docente seleccionado cuando cambia período o sede
  useEffect(() => {
    setDocenteSeleccionado(null);
  }, [periodoActivo, sedeActiva]);

  const periodoNombre = periodos.find(p => p.ID_PERIODO === periodoActivo)?.NOMBRE_PERIODO ?? '';

  return (
    <Layout>
      <div className="min-h-screen py-10" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
        <div className="max-w-screen-2xl mx-auto px-6">

          <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link to="/asistencias" className="text-xs font-semibold text-violet-400 hover:text-violet-600 uppercase tracking-widest transition-colors">Asistencias</Link>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                <span className="text-xs font-semibold text-violet-600 uppercase tracking-widest">Docentes</span>
              </div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">Asistencias por Docente</h1>
              <p className="text-gray-400 mt-1 text-sm">Control de asistencia de docentes por período y sede</p>
            </div>

            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">Período</label>
              {loadingPeriodos ? (
                <div className="h-5 w-36 bg-gray-100 rounded animate-pulse" />
              ) : (
                <select
                  value={periodoActivo ?? ''}
                  onChange={e => {
                    setPeriodoActivo(Number(e.target.value));
                    setDocenteSeleccionado(null);
                  }}
                  className="text-sm font-medium text-gray-800 bg-transparent focus:outline-none cursor-pointer"
                >
                  {periodos.map(p => (
                    <option key={p.ID_PERIODO} value={p.ID_PERIODO}>{p.NOMBRE_PERIODO}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {docenteSeleccionado ? (
            <VistaDocente
              docente={docenteSeleccionado}
              idPeriodo={periodoActivo}
              idSede={sedeActiva}
              onVolver={() => setDocenteSeleccionado(null)}
            />
          ) : (
            <div>
              {periodoNombre && (
                <p className="text-sm text-gray-500 mb-4">
                  <span className="font-semibold text-gray-700">{periodoNombre}</span>
                  <span className="mx-2 text-gray-300">·</span>
                  Selecciona un docente para ver sus asistencias
                </p>
              )}

              {/* Tabs por Sede */}
              {sedes.length > 0 && (
                <div className="mb-5">
                  <SedeTabs
                    sedes={sedes}
                    sedeActiva={sedeActiva}
                    onChange={setSedeActiva}
                    totalPorSede={conteoPorSede}
                  />
                </div>
              )}

              {errorDocentes ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{errorDocentes}</div>
              ) : (
                <DocentesGrid
                  docentes={docentes}
                  loading={loadingDocentes || loadingSedes}
                  onSeleccionar={setDocenteSeleccionado}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default AsistenciasDocentes;
