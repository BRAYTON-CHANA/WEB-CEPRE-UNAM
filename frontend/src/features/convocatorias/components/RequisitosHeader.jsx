import React from 'react';

/**
 * RequisitosHeader — header unificado para la página de Requisitos Docentes.
 * Incluye título, descripción y breadcrumb sutil.
 */
function RequisitosHeader() {
  return (
    <div className="px-1">
      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
        Requisitos Docentes
      </h1>
      <p className="text-gray-500 text-sm mt-1.5 leading-relaxed">
        Configura las preguntas y documentos que se solicitarán a los docentes según su condición laboral.
      </p>
      {/* Breadcrumb sutil */}
      <nav className="flex items-center gap-1.5 mt-3 text-xs text-gray-400">
        <span>Inicio</span>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span>Configuración</span>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-600 font-medium">Requisitos</span>
      </nav>
    </div>
  );
}

export default RequisitosHeader;
