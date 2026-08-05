import React from 'react';
import { CepreLayout } from '@/features/layout';
import { Link } from 'react-router-dom';
import { usePeriodos } from '@/features/asistencias/grupos/hooks/usePeriodos';

function ReportesAsistencias() {
  const { periodos, periodoActivo, setPeriodoActivo, loading: loadingPeriodos } = usePeriodos();

  return (
    <CepreLayout>
      <div className="min-h-screen py-10" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
        <div className="max-w-screen-2xl mx-auto px-6">
          {/* Header */}
          <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link to="/asistencias" className="text-xs font-semibold text-emerald-400 hover:text-emerald-600 uppercase tracking-widest transition-colors">Asistencias</Link>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                <span className="text-xs font-semibold text-emerald-600 uppercase tracking-widest">Reportes</span>
              </div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">Reportes de Asistencia</h1>
              <p className="text-gray-400 mt-1 text-sm">Generación de reportes y estadísticas de asistencia</p>
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

          {/* Content based on period selection */}
          {!loadingPeriodos && !periodoActivo && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <div className="text-gray-400 text-5xl mb-4">📅</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Selecciona un período</h3>
              <p className="text-gray-500">Elige un período académico para ver las opciones de reportes.</p>
            </div>
          )}

          {periodoActivo && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Reporte Docentes Card */}
              <Link
                to="/asistencias/reportes/docentes"
                className="group bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 hover:border-violet-300"
              >
                <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-violet-600 transition-colors">Reporte Docentes</h2>
                <p className="text-gray-500 mb-5">Reportes de asistencia de docentes por período, plaza y horas realizadas.</p>
                <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600">
                  Ver reporte
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              </Link>

              {/* Reporte Estudiantes Card */}
              <Link
                to="/asistencias/reportes/estudiantes"
                className="group bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 hover:border-emerald-300"
              >
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">Reporte Estudiantes</h2>
                <p className="text-gray-500 mb-5">Reportes de asistencia de estudiantes por grupo, carrera y porcentajes.</p>
                <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                  Ver reporte
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>
    </CepreLayout>
  );
}

export default ReportesAsistencias;
