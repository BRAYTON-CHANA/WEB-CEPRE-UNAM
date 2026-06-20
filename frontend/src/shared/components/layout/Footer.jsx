import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container">
        <div className="py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* Identidad */}
            <div className="col-span-1 md:col-span-1">
              <h3 className="text-xl font-bold text-white mb-2">
                CEPRE – UNAM Moquegua
              </h3>
              <p className="text-sm text-gray-400 mb-1">
                Centro Pre-Universitario de la
              </p>
              <p className="text-sm text-gray-400 mb-4">
                Universidad Nacional de Moquegua
              </p>
              <p className="text-xs text-gray-500">
                Formando estudiantes con excelencia académica para el ingreso a la universidad.
              </p>
            </div>

            {/* Contacto */}
            <div>
              <h4 className="text-sm font-semibold text-gray-200 uppercase tracking-wider mb-4">
                Contacto
              </h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <svg className="h-4 w-4 mt-0.5 shrink-0 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  Calle Ancash S/N, Moquegua – Perú
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 shrink-0 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                  cepre@unam.edu.pe
                </li>
                <li className="flex items-start gap-2">
                  <svg className="h-4 w-4 mt-0.5 shrink-0 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  Ciudad Jardín, Ilo – Filial Ilo
                </li>
              </ul>
            </div>

            {/* Institución */}
            <div>
              <h4 className="text-sm font-semibold text-gray-200 uppercase tracking-wider mb-4">
                Institución
              </h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Universidad Nacional de Moquegua</li>
                <li>Moquegua – Perú</li>
                <li>
                  <a
                    href="https://www.unam.edu.pe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    www.unam.edu.pe
                  </a>
                </li>
              </ul>
            </div>

          </div>
        </div>

        {/* Barra inferior */}
        <div className="border-t border-gray-700 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <span>© {currentYear} CEPRE – Universidad Nacional de Moquegua. Todos los derechos reservados.</span>
          <span>Sistema de Gestión Académica</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
