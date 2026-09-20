import React from 'react';
import { CepreLayout } from '@/features/layout';

function AsistenciasNuevo() {
  return (
    <CepreLayout showSidebar>
      <div className="min-h-screen py-5 sm:py-10" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">

          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <span className="text-xs font-semibold text-[#25346A] uppercase tracking-widest">Nueva versión</span>
            <h1 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight">Asistencias</h1>
            <p className="text-gray-400 mt-1 text-xs sm:text-sm">Control de asistencia</p>
          </div>

        </div>
      </div>
    </CepreLayout>
  );
}

export default AsistenciasNuevo;
