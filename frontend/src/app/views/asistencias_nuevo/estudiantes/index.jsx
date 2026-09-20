import React, { useState, useMemo, useEffect } from 'react';
import { CepreLayout } from '@/features/layout';
import { useAuthContext } from '@/shared/context/AuthContext';
import { usePeriodos } from '@/features/asistencias_nuevo/estudiantes/hooks/usePeriodos';
import { useGruposHabilitados } from '@/features/asistencias_nuevo/estudiantes/hooks/useGruposHabilitados';
import { usePlazasDocente } from '@/features/asistencias_nuevo/estudiantes/hooks/usePlazasDocente';
import { useGruposDePlaza } from '@/features/asistencias_nuevo/estudiantes/hooks/useGruposDePlaza';
import { useSesionesDeGrupo } from '@/features/asistencias_nuevo/estudiantes/hooks/useSesionesDeGrupo';
import { SedeTabs } from '@/features/asistencias_nuevo/estudiantes/components/SedeTabs';
import { GruposGrid } from '@/features/asistencias_nuevo/estudiantes/components/GruposGrid';
import { SesionesGrid } from '@/features/asistencias_nuevo/estudiantes/components/SesionesGrid';
import { ModalAsistenciaSesion } from '@/features/asistencias_nuevo/estudiantes/components/ModalAsistenciaSesion';

// Sentinela para grupos virtuales (ID_SEDE NULL por CK_GRUPOS_MODALIDAD_SEDE)
const SEDE_VIRTUAL = 'VIRTUAL';
const sedeKey = (g) => g.ID_SEDE ?? SEDE_VIRTUAL;

function AsistenciasNuevoEstudiantes() {
  const { user, activeRole } = useAuthContext();
  const esDocente = activeRole === 'docente';
  const dni = user?.DNI || user?.dni;

  const { periodos, periodoActivo, setPeriodoActivo, loading: loadingPeriodos } = usePeriodos();
  const { grupos, loading: loadingGrupos, error: errorGrupos } = useGruposHabilitados(periodoActivo);
  const { plazas, loading: loadingPlazas, error: errorPlazas } = usePlazasDocente(esDocente ? dni : null, periodoActivo);
  // Docente: grupos de TODAS sus plazas en una sola query (sin paso de selección)
  const idsPlazas = esDocente ? plazas.map(p => p.ID_PLAZA_DOCENTE) : null;
  const { idsGrupos, grupoInfoPorGrupo, loading: loadingIdsGrupos, error: errorIdsGrupos } = useGruposDePlaza(idsPlazas);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);
  const { sesiones, loading: loadingSesiones, error: errorSesiones, refetch: refetchSesiones } = useSesionesDeGrupo(grupoSeleccionado?.ID_GRUPO);
  const [sesionSeleccionada, setSesionSeleccionada] = useState(null);
  const [sedeActiva, setSedeActiva] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  // Reloj para re-evaluar la ventana de tolerancia de las tarjetas de sesión
  // (solo docentes tienen restricción horaria para abrir el modal de asistencia)
  const [ahora, setAhora] = useState(() => new Date());
  useEffect(() => {
    if (!esDocente) return;
    const t = setInterval(() => setAhora(new Date()), 30000);
    return () => clearInterval(t);
  }, [esDocente]);

  // Docente: solo los grupos donde dictan sus plazas
  const gruposVisibles = useMemo(() => {
    if (!esDocente) return grupos;
    if (!idsGrupos) return [];
    return grupos.filter(g => idsGrupos.has(g.ID_GRUPO));
  }, [esDocente, grupos, idsGrupos]);

  // Plazas del docente por grupo → info de plaza en cada card
  const plazaPorId = useMemo(() => new Map(plazas.map(p => [p.ID_PLAZA_DOCENTE, p])), [plazas]);
  const plazasPorGrupo = useMemo(() => {
    if (!esDocente || !grupoInfoPorGrupo) return null;
    const map = new Map();
    grupoInfoPorGrupo.forEach((info, idGrupo) => {
      map.set(idGrupo, [...info.plazas].map(id => plazaPorId.get(id)).filter(Boolean));
    });
    return map;
  }, [esDocente, grupoInfoPorGrupo, plazaPorId]);

  // Sedes únicas derivadas de los grupos visibles (VIRTUAL al final)
  const sedes = useMemo(() => {
    const map = new Map();
    gruposVisibles.forEach(g => {
      const key = sedeKey(g);
      if (!map.has(key)) {
        map.set(key, { ID_SEDE: key, NOMBRE_SEDE: g.NOMBRE_SEDE });
      }
    });
    return [...map.values()].sort((a, b) =>
      (a.ID_SEDE === SEDE_VIRTUAL) - (b.ID_SEDE === SEDE_VIRTUAL)
    );
  }, [gruposVisibles]);

  // Primera sede por defecto
  useEffect(() => {
    if (sedes.length > 0 && !sedeActiva) {
      setSedeActiva(sedes[0].ID_SEDE);
    }
  }, [sedes, sedeActiva]);

  const totalPorSede = useMemo(() => {
    const counts = {};
    sedes.forEach(sede => {
      counts[sede.ID_SEDE] = gruposVisibles.filter(g => sedeKey(g) === sede.ID_SEDE).length;
    });
    return counts;
  }, [gruposVisibles, sedes]);

  // Grupos: sede activa + búsqueda por nombre/código
  const gruposFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return gruposVisibles.filter(g => {
      if (sedeKey(g) !== sedeActiva) return false;
      if (!q) return true;
      return (g.NOMBRE_GRUPO || '').toLowerCase().includes(q)
        || (g.CODIGO_GRUPO || '').toLowerCase().includes(q);
    });
  }, [gruposVisibles, sedeActiva, busqueda]);

  const periodoNombre = periodos.find(p => p.ID_PERIODO === periodoActivo)?.NOMBRE_PERIODO ?? '';

  // Plazas del docente que dictan en el grupo seleccionado
  const plazasDelGrupo = grupoSeleccionado ? (plazasPorGrupo?.get(grupoSeleccionado.ID_GRUPO) || []) : [];

  // Docente: solo las sesiones de los cursos que sus plazas enseñan en ese grupo
  const sesionesFiltradas = useMemo(() => {
    if (esDocente && grupoSeleccionado && grupoInfoPorGrupo) {
      const cursos = grupoInfoPorGrupo.get(grupoSeleccionado.ID_GRUPO)?.cursos;
      if (cursos) return sesiones.filter(s => cursos.has(s.ID_GRUPO_CURSO));
    }
    return sesiones;
  }, [sesiones, esDocente, grupoSeleccionado, grupoInfoPorGrupo]);

  // Niveles de navegación: grupos → sesiones
  const mostrandoGrupos = !grupoSeleccionado;
  const mostrandoSesiones = !!grupoSeleccionado;

  const emptyMessage = esDocente
    ? (!loadingPlazas && plazas.length === 0
        ? 'No tienes plazas asignadas en este período'
        : busqueda.trim()
          ? `Sin resultados para "${busqueda.trim()}" en esta sede`
          : 'No hay grupos en esta sede')
    : !loadingGrupos && grupos.length === 0
      ? 'No hay grupos habilitados en este período'
      : busqueda.trim()
        ? `Sin resultados para "${busqueda.trim()}" en esta sede`
        : 'No hay grupos en esta sede';

  return (
    <CepreLayout showSidebar>
      <div className="min-h-screen py-5 sm:py-10" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">

          {/* Header */}
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4">
            <div>
              <span className="text-xs font-semibold text-[#25346A] uppercase tracking-widest">Estudiantes</span>
              <h1 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight">Asistencia de Estudiantes</h1>
              <p className="text-gray-400 mt-1 text-xs sm:text-sm">
                {mostrandoSesiones
                  ? 'Sesiones programadas del grupo'
                  : 'Selecciona un grupo para tomar asistencia'}
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
              {/* Buscador (solo en vista de grupos) */}
              {mostrandoGrupos && (
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm flex-1 sm:flex-none">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input
                    type="text"
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    placeholder="Buscar por nombre o código"
                    className="text-base sm:text-sm font-medium text-gray-800 bg-transparent focus:outline-none flex-1 sm:w-52 min-w-0 placeholder:text-gray-400"
                  />
                </div>
              )}

              {/* Selector de período */}
              <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm w-full sm:w-auto justify-between sm:justify-start">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">Período</label>
                {loadingPeriodos ? (
                  <div className="h-5 w-36 bg-gray-100 rounded animate-pulse" />
                ) : (
                  <select
                    value={periodoActivo ?? ''}
                    onChange={e => {
                      setPeriodoActivo(Number(e.target.value));
                      setSedeActiva(null);
                      setGrupoSeleccionado(null);
                    }}
                    className="text-base sm:text-sm font-medium text-gray-800 bg-transparent focus:outline-none cursor-pointer flex-1 sm:flex-none"
                  >
                    {periodos.map(p => (
                      <option key={p.ID_PERIODO} value={p.ID_PERIODO}>{p.NOMBRE_PERIODO}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Nivel 3: sesiones del grupo seleccionado */}
          {mostrandoSesiones ? (
            <div>
              <div className="mb-5 flex items-center gap-3 flex-wrap min-w-0">
                <button
                  onClick={() => setGrupoSeleccionado(null)}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#25346A] hover:text-[#1a2545] bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                  Grupos
                </button>
                <span className="text-sm text-gray-500">
                  <span className="font-semibold text-gray-700">{grupoSeleccionado.CODIGO_GRUPO}</span>
                  {grupoSeleccionado.NOMBRE_GRUPO && (
                    <span className="ml-2 text-gray-400">· {grupoSeleccionado.NOMBRE_GRUPO}</span>
                  )}
                  {plazasDelGrupo.length > 0 && (
                    <span className="ml-2 text-gray-400">· {plazasDelGrupo.map(p => p.NOMBRE_CURSO || p.CODIGO_CURSO).join(' · ')}</span>
                  )}
                  <span className="mx-2 text-gray-300">·</span>
                  {sesionesFiltradas.length} sesione{sesionesFiltradas.length === 1 ? '' : 's'}
                </span>
              </div>

              {errorSesiones ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{errorSesiones}</div>
              ) : (
                <SesionesGrid
                  sesiones={sesionesFiltradas}
                  loading={loadingSesiones}
                  onSeleccionar={setSesionSeleccionada}
                  restringirHorario={esDocente}
                  ahora={ahora}
                />
              )}
            </div>
          ) : (
            <div>
              {periodoNombre && (
                <p className="text-sm text-gray-500 mb-4">
                  <span className="font-semibold text-gray-700">{periodoNombre}</span>
                  <span className="mx-2 text-gray-300">·</span>
                  {gruposVisibles.length} grupo{gruposVisibles.length === 1 ? '' : 's'} {esDocente ? 'asignado' : 'habilitado'}{gruposVisibles.length === 1 ? '' : 's'}
                </p>
              )}

              {/* Tabs por sede */}
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

              {errorGrupos || errorIdsGrupos || errorPlazas ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{errorGrupos || errorIdsGrupos || errorPlazas}</div>
              ) : (
                <GruposGrid
                  grupos={gruposFiltrados}
                  loading={loadingGrupos || (esDocente && (loadingPlazas || loadingIdsGrupos))}
                  onSeleccionar={setGrupoSeleccionado}
                  plazasPorGrupo={plazasPorGrupo}
                  emptyMessage={emptyMessage}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {sesionSeleccionada && (
        <ModalAsistenciaSesion
          sesion={sesionSeleccionada}
          idDocente={esDocente ? (plazas[0]?.ID_DOCENTE ?? null) : null}
          onClose={() => setSesionSeleccionada(null)}
          onSuccess={refetchSesiones}
        />
      )}
    </CepreLayout>
  );
}

export default AsistenciasNuevoEstudiantes;
