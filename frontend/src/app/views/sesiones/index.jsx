import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { CepreLayout } from '@/features/layout';
import { useAuthContext } from '@/shared/context/AuthContext';
import { usePeriodos } from '@/features/asistencias/grupos/hooks/usePeriodos';
import { useSesiones } from '@/features/sesiones/hooks/useSesiones';
import { TablaSesionesAdmin } from '@/features/sesiones/components/TablaSesionesAdmin';
import { ModalMarcarAsistencia } from '@/features/asistencias/grupos/components/vista-grupo/ModalMarcarAsistencia';
import { ModalAsistenciaEstudiantes } from '@/features/asistencias/shared/components';
import { useVaciarAsistencia } from '@/features/asistencias/shared/hooks/useVaciarAsistencia';
import { sedeKey, SEDE_VIRTUAL } from '@/features/asistencias/shared/utils/sedeVirtual';

const PAGE_SIZE = 50;

const norm = (v) =>
  (v ?? '').toString().normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().trim();

const ESTADOS = [
  { key: 'todos', label: 'Todos los estados' },
  { key: 'pendiente', label: 'Pendientes' },
  { key: 'asistio', label: 'Asistió' },
  { key: 'falto', label: 'Faltó' },
];

const estadoDe = (s) =>
  s.ASISTIO === null || s.ASISTIO === undefined ? 'pendiente' : s.ASISTIO ? 'asistio' : 'falto';

export default function Sesiones() {
  const { user } = useAuthContext();
  const idUsuario = user?.ID_USUARIO ?? user?.id_usuario ?? null;

  const { periodos, periodoActivo, setPeriodoActivo, loading: loadingPeriodos } = usePeriodos();
  const { sesiones, loading, error, refetch } = useSesiones(periodoActivo);

  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [sedeActiva, setSedeActiva] = useState('todas');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);

  const [sesionModal, setSesionModal] = useState(null);
  const [sesionEstudiantes, setSesionEstudiantes] = useState(null);
  const { vaciarAsistencia, loading: vaciando } = useVaciarAsistencia();

  // Sedes únicas — Moquegua primero, resto alfabético
  const sedes = useMemo(() => {
    const map = new Map();
    sesiones.forEach(s => {
      // key como string: los <option> de <select> siempre devuelven string
      const key = String(sedeKey(s.ID_SEDE));
      if (!map.has(key)) map.set(key, { key, NOMBRE_SEDE: s.NOMBRE_SEDE });
    });
    return [...map.values()].sort((a, b) => {
      const aMoq = a.NOMBRE_SEDE?.toLowerCase().includes('moquegua');
      const bMoq = b.NOMBRE_SEDE?.toLowerCase().includes('moquegua');
      if (aMoq && !bMoq) return -1;
      if (!aMoq && bMoq) return 1;
      return (a.NOMBRE_SEDE || '').localeCompare(b.NOMBRE_SEDE || '');
    });
  }, [sesiones]);

  const sesionesFiltradas = useMemo(() => {
    const q = norm(busqueda);
    return sesiones.filter(s => {
      if (filtroEstado !== 'todos' && estadoDe(s) !== filtroEstado) return false;
      if (sedeActiva !== 'todas' && String(sedeKey(s.ID_SEDE)) !== sedeActiva) return false;
      if (fechaDesde && (s.FECHA || '') < fechaDesde) return false;
      if (fechaHasta && (s.FECHA || '') > fechaHasta) return false;
      if (q) {
        const texto = norm(`${s.DOCENTE_PROGRAMADO_NOMBRE} ${s.DOCENTE_ASISTIO_NOMBRE}`);
        if (!texto.includes(q)) return false;
      }
      return true;
    });
  }, [sesiones, filtroEstado, sedeActiva, fechaDesde, fechaHasta, busqueda]);

  const conteos = useMemo(() => {
    const c = { todos: sesiones.length, pendiente: 0, asistio: 0, falto: 0 };
    sesiones.forEach(s => { c[estadoDe(s)]++; });
    return c;
  }, [sesiones]);

  const totalPaginas = Math.max(1, Math.ceil(sesionesFiltradas.length / PAGE_SIZE));
  const paginaSesiones = sesionesFiltradas.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE);

  // Reset de página/filtros al cambiar período
  useEffect(() => {
    setPagina(1);
    setSedeActiva('todas');
    setFiltroEstado('todos');
    setFechaDesde('');
    setFechaHasta('');
    setBusqueda('');
  }, [periodoActivo]);

  useEffect(() => {
    setPagina(1);
  }, [filtroEstado, sedeActiva, fechaDesde, fechaHasta, busqueda]);

  const handleVaciar = useCallback(async (s) => {
    const ok = window.confirm(
      '¿Vaciar la asistencia de esta sesión?\n\nSe limpiará el marcado del docente (entrada, salida, observaciones) y la asistencia de los estudiantes. No se elimina ningún registro.'
    );
    if (!ok) return;
    try {
      await vaciarAsistencia(s.ID_SESION);
      refetch();
    } catch (err) {
      alert(`No se pudo vaciar la asistencia: ${err.message}`);
    }
  }, [vaciarAsistencia, refetch]);

  return (
    <CepreLayout showSidebar>
      <div className="min-h-screen py-6 sm:py-10" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">

          {/* Header */}
          <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight">Sesiones</h1>
              <p className="text-gray-400 mt-1 text-sm">Todas las sesiones del período en una sola tabla</p>
            </div>

            {/* Selector de período */}
            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm w-full sm:w-auto">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">Período</label>
              {loadingPeriodos ? (
                <div className="h-5 w-36 bg-gray-100 rounded animate-pulse" />
              ) : (
                <select
                  value={periodoActivo ?? ''}
                  onChange={e => setPeriodoActivo(Number(e.target.value))}
                  className="text-base sm:text-sm font-medium text-gray-800 bg-transparent focus:outline-none cursor-pointer"
                >
                  {periodos.map(p => (
                    <option key={p.ID_PERIODO} value={p.ID_PERIODO}>{p.NOMBRE_PERIODO}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-500">Cargando sesiones...</p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="text-center py-8">
              <div className="text-red-500 mb-4">⚠️ {error}</div>
              <button onClick={refetch} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                Reintentar
              </button>
            </div>
          )}

          {periodoActivo && !loading && !error && (
            <div className="space-y-4">
              {/* Filtros */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {/* Estado */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Estado</label>
                    <select
                      value={filtroEstado}
                      onChange={e => setFiltroEstado(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-base sm:text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {ESTADOS.map(e => (
                        <option key={e.key} value={e.key}>
                          {e.label}{e.key !== 'todos' ? ` (${conteos[e.key]})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sede */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Sede</label>
                    <select
                      value={sedeActiva}
                      onChange={e => setSedeActiva(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-base sm:text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="todas">Todas las sedes</option>
                      {sedes.map(s => (
                        <option key={s.key} value={s.key}>{s.NOMBRE_SEDE}</option>
                      ))}
                    </select>
                  </div>

                  {/* Fecha desde */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Desde</label>
                    <input
                      type="date"
                      value={fechaDesde}
                      onChange={e => setFechaDesde(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-base sm:text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Fecha hasta */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Hasta</label>
                    <input
                      type="date"
                      value={fechaHasta}
                      onChange={e => setFechaHasta(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-base sm:text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Buscar docente */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Docente</label>
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      <input
                        type="text"
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        placeholder="Buscar docente..."
                        className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-base sm:text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabla */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-800">{sesionesFiltradas.length}</span> sesiones
                  </span>
                  {totalPaginas > 1 && (
                    <span className="text-xs text-gray-400">
                      Página {pagina} de {totalPaginas}
                    </span>
                  )}
                </div>
                <TablaSesionesAdmin
                  sesiones={paginaSesiones}
                  onMarcar={setSesionModal}
                  onMarcarEstudiantes={setSesionEstudiantes}
                  onVaciar={handleVaciar}
                  vaciando={vaciando}
                />
                {totalPaginas > 1 && (
                  <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPagina(p => Math.max(1, p - 1))}
                      disabled={pagina === 1}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      ← Anterior
                    </button>
                    <button
                      onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                      disabled={pagina === totalPaginas}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Siguiente →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Modales */}
      <ModalMarcarAsistencia
        sesion={sesionModal}
        onClose={() => setSesionModal(null)}
        onSuccess={refetch}
        idUsuario={idUsuario}
      />
      <ModalAsistenciaEstudiantes
        sesion={sesionEstudiantes}
        onClose={() => setSesionEstudiantes(null)}
        onSuccess={refetch}
        regularizar
      />
    </CepreLayout>
  );
}
