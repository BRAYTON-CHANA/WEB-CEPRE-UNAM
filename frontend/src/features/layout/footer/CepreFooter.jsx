import React from 'react';

const CepreFooter = () => {
  return (
    <footer className="bg-gray-900 text-white border-t border-gray-800">
      <div className="container mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">CEPRE – UNAM </h2>
            <p className="text-sm text-gray-300 mb-3">
              Centro Pre-Universitario de la Universidad Nacional de Moquegua
            </p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Formando estudiantes con excelencia académica para el ingreso a la universidad.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white mb-4">Contacto</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span>Calle Ancash S/N, Moquegua – Perú</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <span>cepre@unam.edu.pe</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span>Ciudad Jardín, Ilo – Filial Ilo</span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white mb-4">Institución</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>Universidad Nacional de Moquegua</li>
              <li>Moquegua – Perú</li>
              <li>
                <a href="https://www.unam.edu.pe" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                  www.unam.edu.pe
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-2 text-xs text-gray-500">
          <p>© 2026 CEPRE – Universidad Nacional de Moquegua. Todos los derechos reservados.</p>
          <p>Sistema de Gestión Académica</p>
        </div>
      </div>
    </footer>
  );
};

export default CepreFooter;
