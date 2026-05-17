import React from 'react';
import Layout from '@/shared/components/layout/Layout';
import { Link } from 'react-router-dom';

const MODULES = [
  {
    to: '/asistencias/grupos',
    title: 'Asistencias Grupos',
    description: 'Control de asistencia de docentes por grupo y sesión académica. Visualiza sesiones, cursos y marcado de presencia.',
    accent: 'from-blue-400 to-indigo-500',
    iconBg: 'bg-blue-50',
    iconStroke: '#3b82f6',
    labelColor: 'text-blue-600',
    borderHover: 'hover:border-blue-300',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    to: '/asistencias/docentes',
    title: 'Asistencias Docentes',
    description: 'Registro y seguimiento de asistencia de la plana docente. Reportes por docente, período y curso asignado.',
    accent: 'from-violet-400 to-purple-500',
    iconBg: 'bg-violet-50',
    iconStroke: '#7c3aed',
    labelColor: 'text-violet-600',
    borderHover: 'hover:border-violet-300',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
  {
    to: '/asistencias/estudiantes',
    title: 'Asistencias Estudiantes',
    description: 'Seguimiento de asistencia del alumnado por grupo y sesión. Porcentajes, alertas y control por período.',
    accent: 'from-emerald-400 to-teal-500',
    iconBg: 'bg-emerald-50',
    iconStroke: '#059669',
    labelColor: 'text-emerald-600',
    borderHover: 'hover:border-emerald-300',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
];

function Asistencias() {
  return (
    <Layout>
      <div className="min-h-screen py-14" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
        <div className="max-w-4xl mx-auto px-6">

          {/* Header */}
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Panel de control</p>
            <h1 className="text-5xl font-black text-gray-900 tracking-tight mb-3">Asistencias</h1>
            <p className="text-gray-400 text-base max-w-md mx-auto">
              Selecciona el módulo de asistencia que deseas gestionar
            </p>
          </div>

          {/* 3 tarjetas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {MODULES.map(m => (
              <Link
                key={m.to}
                to={m.to}
                className={`group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 ${m.borderHover}`}
              >
                {/* Accent bar */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${m.accent} opacity-60 group-hover:opacity-100 transition-opacity`} />

                <div className="p-6">
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-2xl ${m.iconBg} flex items-center justify-center mb-5 group-hover:scale-105 transition-transform`}>
                    {m.icon}
                  </div>

                  {/* Text */}
                  <h2 className={`text-lg font-bold text-gray-900 mb-2 group-hover:${m.labelColor} transition-colors`}>
                    {m.title}
                  </h2>
                  <p className="text-sm text-gray-400 leading-relaxed mb-5">
                    {m.description}
                  </p>

                  {/* CTA */}
                  <div className={`inline-flex items-center gap-1.5 text-xs font-semibold ${m.labelColor}`}>
                    Ir al módulo
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 transition-transform"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Asistencias;
  