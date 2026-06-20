import React, { useState, useMemo, useEffect } from 'react';
import Layout from '@/shared/components/layout/Layout';
import { Link } from 'react-router-dom';
import { usePeriodos } from '@/features/asistencias/grupos/hooks/usePeriodos';
import { useGrupos } from '@/features/asistencias/grupos/hooks/useGrupos';
import { SedeTabs } from '@/features/asistencias/grupos/components/SedeTabs';
import { useEstudiantesPorGrupo } from '@/features/asistencias/estudiantes/hooks/useEstudiantesPorGrupo';
import { useTodosEstudiantes } from '@/features/asistencias/estudiantes/hooks/useTodosEstudiantes';
import { TablaEstudiantes } from '@/features/asistencias/estudiantes/components/TablaEstudiantes';
import { ModalHistorialEstudiante } from '@/features/asistencias/estudiantes/components/ModalHistorialEstudiante';

function AsistenciasEstudiantes() {
  const { periodos, periodoActivo, setPeriodoActivo, loading: loadingPeriodos } = usePeriodos();
  const { grupos, loading: loadingGrupos } = useGrupos(periodoActivo);

  const [sedeActiva, setSedeActiva] = useState(null);
  const [grupoActivo, setGrupoActivo] = useState(null);
  const [modoTodos, setModoTodos] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [faltasCondicion, setFaltasCondicion] = useState('>'); // '>', '<', '='
  const [faltasValor, setFaltasValor] = useState('');
  const [estudianteModal, setEstudianteModal] = useState(null);

  // Extraer sedes — Moquegua primero
  const sedes = useMemo(() => {
    const map = new Map();
    grupos.forEach(g => {
      if (g.ID_SEDE && !map.has(g.ID_SEDE)) {
        map.set(g.ID_SEDE, { ID_SEDE: g.ID_SEDE, NOMBRE_SEDE: g.NOMBRE_SEDE });
      }
    });
    return [...map.values()].sort((a, b) => {
      const aMoq = a.NOMBRE_SEDE?.toLowerCase().includes('moquegua');
      const bMoq = b.NOMBRE_SEDE?.toLowerCase().includes('moquegua');
      if (aMoq && !bMoq) return -1;
      if (!aMoq && bMoq) return 1;
      return a.NOMBRE_SEDE.localeCompare(b.NOMBRE_SEDE);
    });
  }, [grupos]);

  // Reset al cambiar período
  useEffect(() => {
    setSedeActiva(null);
    setGrupoActivo(null);
    setModoTodos(false);
    setBusqueda('');
    setFaltasCondicion('>');
    setFaltasValor('');
  }, [periodoActivo]);

  // Auto-seleccionar primera sede
  useEffect(() => {
    if (sedes.length > 0 && !sedeActiva) {
      setSedeActiva(sedes[0].ID_SEDE);
    }
  }, [sedes, sedeActiva]);

  // Grupos de la sede activa
  const gruposDeSede = useMemo(() => {
    if (!sedeActiva) return [];
    return grupos
      .filter(g => g.ID_SEDE === sedeActiva)
      .sort((a, b) => a.NOMBRE_GRUPO.localeCompare(b.NOMBRE_GRUPO));
  }, [grupos, sedeActiva]);

  // Auto-seleccionar primer grupo
  useEffect(() => {
    if (gruposDeSede.length > 0 && !grupoActivo) {
      setGrupoActivo(gruposDeSede[0].ID_GRUPO);
    }
    if (gruposDeSede.length > 0 && grupoActivo && !gruposDeSede.find(g => g.ID_GRUPO === grupoActivo)) {
      setGrupoActivo(gruposDeSede[0].ID_GRUPO);
    }
  }, [gruposDeSede, grupoActivo]);

  // Contar grupos por sede para SedeTabs
  const totalPorSede = useMemo(() => {
    const counts = {};
    sedes.forEach(s => {
      counts[s.ID_SEDE] = grupos.filter(g => g.ID_SEDE === s.ID_SEDE).length;
    });
    return counts;
  }, [grupos, sedes]);

  const grupoSeleccionado = gruposDeSede.find(g => g.ID_GRUPO === grupoActivo);

  // Hook para estudiantes por grupo (modo normal)
  const { estudiantes: estPorGrupo, loading: loadingEstGrupo, refetch: refetchGrupo } = useEstudiantesPorGrupo(grupoActivo);
  
  // Hook para todos los estudiantes del período y sede (modo Todos)
  const { estudiantes: estTodos, loading: loadingEstTodos, refetch: refetchTodos } = useTodosEstudiantes(periodoActivo, sedeActiva);
  
  // Determinar qué estudiantes mostrar según el modo
  const estudiantesRaw = modoTodos ? estTodos : estPorGrupo;
  const loadingEst = modoTodos ? loadingEstTodos : loadingEstGrupo;
  const refetch = modoTodos ? refetchTodos : refetchGrupo;
  
  // Filtrar por búsqueda y porcentaje de faltas
  const estudiantes = useMemo(() => {
    let resultado = estudiantesRaw;
    
    // Filtro por nombre
    if (busqueda.trim()) {
      const term = busqueda.toLowerCase().trim();
      resultado = resultado.filter(est => 
        `${est.APELLIDOS} ${est.NOMBRES}`.toLowerCase().includes(term)
      );
    }
    
    // Filtro por porcentaje de faltas
    if (faltasValor !== '' && !isNaN(Number(faltasValor))) {
      const valor = Number(faltasValor);
      resultado = resultado.filter(est => {
        const pct = est.porcentajeFaltas ?? 0;
        if (faltasCondicion === '>') return pct > valor;
        if (faltasCondicion === '<') return pct < valor;
        if (faltasCondicion === '=') return pct === valor;
        return true;
      });
    }
    
    return resultado;
  }, [estudiantesRaw, busqueda, faltasCondicion, faltasValor]);

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
                <span className="text-xs font-semibold text-emerald-600 uppercase tracking-widest">Estudiantes</span>
              </div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">Asistencias Estudiantes</h1>
              <p className="text-gray-400 mt-1 text-sm">Seguimiento de asistencia del alumnado por grupo y sesión</p>
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

          {/* Loading grupos */}
          {periodoActivo && loadingGrupos && (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
              <span className="ml-3 text-gray-500 text-sm">Cargando grupos...</span>
            </div>
          )}

          {/* Contenido principal */}
          {periodoActivo && !loadingGrupos && (
            <>
              {/* Período nombre */}
              {periodos.find(p => p.ID_PERIODO === periodoActivo) && (
                <p className="text-sm text-gray-500 mb-4">
                  <span className="font-semibold text-gray-700">
                    {periodos.find(p => p.ID_PERIODO === periodoActivo)?.NOMBRE_PERIODO}
                  </span>
                  <span className="mx-2 text-gray-300">·</span>
                  Selecciona un grupo para ver la asistencia de sus estudiantes
                </p>
              )}

              {/* SedeTabs */}
              {sedes.length > 0 && (
                <div className="mb-5">
                  <SedeTabs
                    sedes={sedes}
                    sedeActiva={sedeActiva}
                    onChange={(id) => {
                      setSedeActiva(id);
                      setGrupoActivo(null);
                    }}
                    totalPorSede={totalPorSede}
                  />
                </div>
              )}

              {/* GrupoTabs + Todos */}
              {gruposDeSede.length > 0 && (
                <div className="mb-5 flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1.5 shadow-sm overflow-x-auto">
                  {gruposDeSede.map(g => (
                    <button
                      key={g.ID_GRUPO}
                      onClick={() => {
                        setGrupoActivo(g.ID_GRUPO);
                        setModoTodos(false);
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                        grupoActivo === g.ID_GRUPO && !modoTodos
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      {g.NOMBRE_GRUPO}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setModoTodos(true);
                      setGrupoActivo(null);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      modoTodos
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    Todos
                  </button>
                </div>
              )}

              {/* Filtros: Buscador + Faltas */}
              {(grupoActivo || modoTodos) && (
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  {/* Buscador por nombre */}
                  <div className="relative max-w-xs">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={busqueda}
                      onChange={e => setBusqueda(e.target.value)}
                      placeholder="Buscar por apellido o nombre..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                    />
                    {busqueda && (
                      <button
                        onClick={() => setBusqueda('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Separador visual */}
                  <div className="h-8 w-px bg-gray-300 hidden sm:block" />

                  {/* Filtro por % de faltas */}
                  <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Faltas</span>
                    <select
                      value={faltasCondicion}
                      onChange={e => setFaltasCondicion(e.target.value)}
                      className="text-sm font-medium text-gray-700 bg-transparent focus:outline-none cursor-pointer"
                    >
                      <option value=">">&gt;</option>
                      <option value="<">&lt;</option>
                      <option value="=">=</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={faltasValor}
                      onChange={e => setFaltasValor(e.target.value)}
                      placeholder="0"
                      className="w-14 text-sm text-center text-gray-700 bg-gray-50 border border-gray-200 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-red-400"
                    />
                    <span className="text-sm text-gray-500">%</span>
                    {faltasValor !== '' && (
                      <button
                        onClick={() => setFaltasValor('')}
                        className="ml-1 text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Tabla */}
              {grupoActivo || modoTodos ? (
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-gray-900">
                        {modoTodos ? 'Todos los estudiantes' : grupoSeleccionado?.NOMBRE_GRUPO}
                      </h2>
                      {!loadingEst && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {estudiantes.length} estudiantes {(busqueda || faltasValor !== '') && '(filtrados)'}
                          {faltasValor !== '' && (
                            <span className="ml-1 text-red-400">
                              · Faltas {faltasCondicion} {faltasValor}%
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  <TablaEstudiantes
                    estudiantes={estudiantes}
                    loading={loadingEst}
                    onVerAsistencia={est => setEstudianteModal(est)}
                    mostrarGrupo={modoTodos}
                  />
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                  <div className="text-gray-400 text-5xl mb-4">👥</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Selecciona un grupo</h3>
                  <p className="text-gray-500">Elige un grupo o presiona "Todos" para ver estudiantes.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal historial */}
      <ModalHistorialEstudiante
        estudiante={estudianteModal}
        idGrupo={modoTodos ? estudianteModal?.ID_GRUPO : grupoActivo}
        nombreGrupo={modoTodos ? estudianteModal?.NOMBRE_GRUPO : grupoSeleccionado?.NOMBRE_GRUPO}
        onClose={() => setEstudianteModal(null)}
        onSuccess={refetch}
      />
    </Layout>
  );
}

export default AsistenciasEstudiantes;
