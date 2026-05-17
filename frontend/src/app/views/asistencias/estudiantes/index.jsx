import React from 'react';
import Layout from '@/shared/components/layout/Layout';
import { Link } from 'react-router-dom';

function AsistenciasEstudiantes() {
  return (
    <Layout>
      <div className="min-h-screen py-10" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
        <div className="max-w-screen-2xl mx-auto px-6">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-1">
              <Link to="/asistencias" className="text-xs font-semibold text-emerald-400 hover:text-emerald-600 uppercase tracking-widest transition-colors">Asistencias</Link>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-widest">Estudiantes</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Asistencias Estudiantes</h1>
            <p className="text-gray-400 mt-1 text-sm">Seguimiento de asistencia del alumnado por grupo y sesión</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-5">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-700 mb-2">Módulo en construcción</h2>
            <p className="text-gray-400 text-sm max-w-sm leading-relaxed">
              Aquí se gestionará el seguimiento de asistencia de estudiantes, incluyendo control por sesión, porcentajes de asistencia y alertas por inasistencia.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default AsistenciasEstudiantes;
