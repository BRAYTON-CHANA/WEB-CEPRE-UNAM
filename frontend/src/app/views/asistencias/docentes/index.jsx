import React from 'react';
import Layout from '@/shared/components/layout/Layout';
import { Link } from 'react-router-dom';

function AsistenciasDocentes() {
  return (
    <Layout>
      <div className="min-h-screen py-10" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
        <div className="max-w-screen-2xl mx-auto px-6">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-1">
              <Link to="/asistencias" className="text-xs font-semibold text-violet-400 hover:text-violet-600 uppercase tracking-widest transition-colors">Asistencias</Link>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              <span className="text-xs font-semibold text-violet-600 uppercase tracking-widest">Docentes</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Asistencias Docentes</h1>
            <p className="text-gray-400 mt-1 text-sm">Registro de asistencia de la plana docente</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mb-5">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-700 mb-2">Módulo en construcción</h2>
            <p className="text-gray-400 text-sm max-w-sm leading-relaxed">
              Aquí se gestionará el registro de asistencia de docentes de forma independiente, incluyendo reportes por docente, períodos y cursos asignados.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default AsistenciasDocentes;
