import React, { useState } from 'react';
import LayoutWithSidebar from '@/shared/components/layout/LayoutWithSidebar';
import { exportarBDJson } from '@/shared/utils/exportDB';

/**
 * Dashboard de Configuración
 * Página principal de configuración
 */
function Configuracion() {
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState(null);

  const handleExport = async () => {
    setExporting(true);
    setExportResult(null);
    try {
      const result = await exportarBDJson();
      setExportResult(result);
    } catch (err) {
      setExportResult({ success: false, errors: [err.message] });
    } finally {
      setExporting(false);
    }
  };

  return (
    <LayoutWithSidebar>
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Configuración</h1>
        <p className="text-gray-600 mb-8">Selecciona una opción del menú lateral para comenzar.</p>

        <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm max-w-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-1">Exportar base de datos</h2>
          <p className="text-sm text-gray-500 mb-4">
            Descarga un archivo <code className="bg-gray-100 px-1 rounded text-xs">.json</code> con todos los datos de todas las tablas del sistema.
          </p>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {exporting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Exportando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Exportar BD
              </>
            )}
          </button>

          {exportResult && (
            <div className={`mt-4 text-sm rounded-lg px-3 py-2 ${exportResult.errors?.length > 0 ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' : 'bg-green-50 text-green-800 border border-green-200'}`}>
              {exportResult.errors?.length > 0 ? (
                <>
                  <p className="font-medium">Exportado con advertencias:</p>
                  <ul className="mt-1 list-disc list-inside text-xs">
                    {exportResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </>
              ) : (
                <p>✓ Descarga completada exitosamente.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </LayoutWithSidebar>
  );
}

export default Configuracion;
