import React, { useState, useMemo, useEffect } from 'react';
import { CepreLayout } from '@/features/layout';
import { Link } from 'react-router-dom';
import { usePeriodos } from '@/features/asistencias/grupos/hooks/usePeriodos';
import { useGrupos } from '@/features/asistencias/grupos/hooks/useGrupos';
import { SedeTabs } from '@/features/asistencias/grupos/components/SedeTabs';
import { GruposGrid } from '@/features/asistencias/grupos/components/GruposGrid';
import { VistaGrupo } from '@/features/asistencias/grupos/components/vista-grupo';

function AsistenciasGrupos() {
  const { periodos, periodoActivo, setPeriodoActivo, loading: loadingPeriodos } = usePeriodos();
  const { grupos, loading: loadingGrupos, error: errorGrupos } = useGrupos(periodoActivo);
  const [sedeActiva, setSedeActiva] = useState(null);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);

  // Extraer sedes únicas de los grupos
  const sedes = useMemo(() => {
    const map = new Map();
    grupos.forEach(g => {
      if (g.ID_SEDE && !map.has(g.ID_SEDE)) {
        map.set(g.ID_SEDE, { ID_SEDE: g.ID_SEDE, NOMBRE_SEDE: g.NOMBRE_SEDE });
      }
    });
    return [...map.values()];
  }, [grupos]);

  // Seleccionar primera sede por defecto
  useEffect(() => {
    if (sedes.length > 0 && !sedeActiva) {
      setSedeActiva(sedes[0].ID_SEDE);
    }
  }, [sedes, sedeActiva]);

  // Contar grupos por sede
  const totalPorSede = useMemo(() => {
    const counts = {};
    sedes.forEach(sede => {
      counts[sede.ID_SEDE] = grupos.filter(g => g.ID_SEDE === sede.ID_SEDE).length;
    });
    return counts;
  }, [grupos, sedes]);

  // Filtrar grupos por sede activa
  const gruposFiltrados = useMemo(() => {
    if (!sedeActiva) return [];
    return grupos.filter(g => g.ID_SEDE === sedeActiva);
  }, [grupos, sedeActiva]);

  const periodoNombre = periodos.find(p => p.ID_PERIODO === periodoActivo)?.NOMBRE_PERIODO ?? '';

  return (
    <CepreLayout>
      <div className="min-h-screen py-10" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
        <div className="max-w-screen-2xl mx-auto px-6">

          <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link to="/asistencias" className="text-xs font-semibold text-blue-400 hover:text-blue-600 uppercase tracking-widest transition-colors">Asistencias</Link>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest">Grupos</span>
              </div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">Asistencias por Grupo</h1>
              <p className="text-gray-400 mt-1 text-sm">Control de asistencia de docentes por sesión y grupo</p>
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
                    setSedeActiva(null); // Resetear para que useMemo seleccione la primera
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

          {grupoSeleccionado ? (
            <VistaGrupo grupo={grupoSeleccionado} onVolver={() => setGrupoSeleccionado(null)} />
          ) : (
            <div>
              {periodoNombre && (
                <p className="text-sm text-gray-500 mb-4">
                  <span className="font-semibold text-gray-700">{periodoNombre}</span>
                  <span className="mx-2 text-gray-300">·</span>
                  Selecciona un grupo para ver sus asistencias
                </p>
              )}

              {/* Tabs por Sede */}
              {sedes.length > 0 && (
                <div className="mb-5">
                  <SedeTabs
                    sedes={sedes}
                    sedeActiva={sedeActiva}
                    onChange={setSedeActiva}
                    totalPorSede={totalPorSede}
                  />
                </div>
              )}

              {errorGrupos ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{errorGrupos}</div>
              ) : (
                <GruposGrid
                  grupos={gruposFiltrados}
                  loading={loadingGrupos}
                  onSeleccionar={setGrupoSeleccionado}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </CepreLayout>
  );
}

export default AsistenciasGrupos;
