import React, { useState, useMemo, useEffect } from 'react';
import Layout from '@/shared/components/layout/Layout';
import { Link } from 'react-router-dom';
import { FechaCard } from './components/FechaCard';
import { VistaFecha } from './VistaFecha';
import { useFechasConClases } from './hooks/useFechasConClases';
import { usePeriodos } from '../grupos/hooks/usePeriodos';
import { SedeTabs } from '../grupos/components/SedeTabs';

export default function AsistenciasPorFecha() {
  const { periodos, periodoActivo, setPeriodoActivo, loading: loadingPeriodos } = usePeriodos();
  const { fechas, loading, error, recargar } = useFechasConClases(periodoActivo);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [sedeActiva, setSedeActiva] = useState(null);

  // Extraer sedes únicas — Moquegua primero, resto alfabético
  const sedes = useMemo(() => {
    const map = new Map();
    fechas.forEach(f => {
      (f.sesiones || []).forEach(s => {
        if (s.ID_SEDE && !map.has(s.ID_SEDE)) {
          map.set(s.ID_SEDE, { ID_SEDE: s.ID_SEDE, NOMBRE_SEDE: s.NOMBRE_SEDE });
        }
      });
    });
    return [...map.values()].sort((a, b) => {
      const aMoq = a.NOMBRE_SEDE?.toLowerCase().includes('moquegua');
      const bMoq = b.NOMBRE_SEDE?.toLowerCase().includes('moquegua');
      if (aMoq && !bMoq) return -1;
      if (!aMoq && bMoq) return 1;
      return a.NOMBRE_SEDE.localeCompare(b.NOMBRE_SEDE);
    });
  }, [fechas]);

  // Resetear sede al cambiar período
  useEffect(() => {
    setSedeActiva(null);
    setFechaSeleccionada(null);
  }, [periodoActivo]);

  // Auto-seleccionar primera sede
  useEffect(() => {
    if (sedes.length > 0 && !sedeActiva) {
      setSedeActiva(sedes[0].ID_SEDE);
    }
  }, [sedes, sedeActiva]);

  // Contar fechas por sede
  const totalPorSede = useMemo(() => {
    const counts = {};
    sedes.forEach(sede => {
      counts[sede.ID_SEDE] = fechas.filter(f =>
        (f.sesiones || []).some(s => s.ID_SEDE === sede.ID_SEDE)
      ).length;
    });
    return counts;
  }, [fechas, sedes]);

  // Filtrar fechas por sede activa
  const fechasFiltradas = useMemo(() => {
    if (!sedeActiva) return [];
    return fechas
      .map(f => {
        const sesionesFiltered = (f.sesiones || []).filter(s => s.ID_SEDE === sedeActiva);
        if (sesionesFiltered.length === 0) return null;
        const grupos = new Set(sesionesFiltered.map(s => s.ID_GRUPO));
        return {
          ...f,
          sesiones: sesionesFiltered,
          totalClases: sesionesFiltered.length,
          totalGrupos: grupos.size,
        };
      })
      .filter(Boolean);
  }, [fechas, sedeActiva]);

  if (fechaSeleccionada) {
    return (
      <Layout>
        <div className="min-h-screen py-10" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
          <div className="max-w-screen-2xl mx-auto px-6">
            <VistaFecha
              fecha={fechaSeleccionada}
              idSede={sedeActiva}
              onVolver={() => setFechaSeleccionada(null)}
            />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen py-10" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
        <div className="max-w-screen-2xl mx-auto px-6">

          {/* Header */}
          <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link to="/asistencias" className="text-xs font-semibold text-blue-400 hover:text-blue-600 uppercase tracking-widest transition-colors">Asistencias</Link>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest">Fechas</span>
              </div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">Asistencias por Fecha</h1>
              <p className="text-gray-400 mt-1 text-sm">Selecciona un período, sede y fecha para ver las clases programadas</p>
            </div>

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

          {/* Sin período */}
          {!loadingPeriodos && !periodoActivo && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <div className="text-gray-400 text-5xl mb-4">📅</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Selecciona un período</h3>
              <p className="text-gray-500">Elige un período académico para continuar.</p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-500">Cargando fechas...</p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="text-center py-8">
              <div className="text-red-500 mb-4">⚠️ {error}</div>
              <button onClick={recargar} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                Reintentar
              </button>
            </div>
          )}

          {/* Contenido principal */}
          {periodoActivo && !loading && !error && (
            <>
              {/* Período nombre + hint */}
              {periodos.find(p => p.ID_PERIODO === periodoActivo) && (
                <p className="text-sm text-gray-500 mb-4">
                  <span className="font-semibold text-gray-700">
                    {periodos.find(p => p.ID_PERIODO === periodoActivo)?.NOMBRE_PERIODO}
                  </span>
                  <span className="mx-2 text-gray-300">·</span>
                  Selecciona una sede y fecha
                </p>
              )}

              {/* Tabs de sede */}
              {sedes.length > 0 && (
                <div className="mb-5">
                  <SedeTabs
                    sedes={sedes}
                    sedeActiva={sedeActiva}
                    onChange={(id) => {
                      setSedeActiva(id);
                      setFechaSeleccionada(null);
                    }}
                    totalPorSede={totalPorSede}
                  />
                </div>
              )}

              {/* Grid de fechas */}
              {!sedeActiva ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                  <div className="text-gray-400 text-5xl mb-4">🏫</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Selecciona una sede</h3>
                  <p className="text-gray-500">Elige una sede para ver las fechas disponibles.</p>
                </div>
              ) : fechasFiltradas.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                  <div className="text-gray-400 text-5xl mb-4">📅</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay fechas programadas</h3>
                  <p className="text-gray-500">No se encontraron clases programadas para esta sede en este período.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {fechasFiltradas.map((fechaInfo) => (
                    <FechaCard
                      key={fechaInfo.fecha}
                      fechaInfo={fechaInfo}
                      seleccionada={false}
                      onClick={() => setFechaSeleccionada(fechaInfo.fecha)}
                    />
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </Layout>
  );
}
