import React, { useState, useMemo } from 'react';
import LayoutWithSidebar from '@/shared/components/layout/LayoutWithSidebar';
import ReferenceSelectInput from '@/shared/components/ui/inputs/ReferenceSelectInput';
import TableMultiLevelRender from '@/shared/components/table/views/TableMultiLevelRender';
import { useTableData } from '@/shared/components/crud/hooks/useTableData';
import { exportSesionesToExcel, exportAllSesionesToExcel } from '@/features/configuracion/reportes/grupos/utils/exportSesionesToExcel';
import { exportSesionesToPdf, exportAllSesionesToPdf } from '@/features/configuracion/reportes/grupos/utils/exportSesionesToPdf';
import ExportOptionsModal from '@/features/configuracion/reportes/shared/ExportOptionsModal';
import { levelConfigs } from '@/features/configuracion/reportes/grupos/config';

function ReportesGrupos() {
  const [selectedPeriodo, setSelectedPeriodo] = useState('');
  const [exportingAll, setExportingAll] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });
  const [exportingIndividual, setExportingIndividual] = useState(null);
  const [exportingAllPdf, setExportingAllPdf] = useState(false);
  const [exportingIndividualPdf, setExportingIndividualPdf] = useState(null);
  const [exportModalPending, setExportModalPending] = useState(null);

  const filters = useMemo(() => {
    return selectedPeriodo ? { ID_PERIODO: selectedPeriodo } : {};
  }, [selectedPeriodo]);

  const { records, loading, error } = useTableData(
    selectedPeriodo ? 'VW_GRUPOS' : null,
    filters
  );

  const handlePeriodoChange = (_, value) => {
    setSelectedPeriodo(value);
  };

  const handleExportIndividual = (row) => {
    setExportModalPending({ type: 'individual', row });
  };

  const handleExportAllExcel = () => {
    if (!records || records.length === 0) return;
    setExportModalPending({ type: 'all' });
  };

  const handleModalConfirm = async (opts) => {
    const pending = exportModalPending;
    setExportModalPending(null);
    if (!pending) return;
    const isPdf = pending.format === 'pdf';

    if (pending.type === 'individual') {
      const row = pending.row;
      const nombre = row.NOMBRE_GRUPO || row.CODIGO_GRUPO;
      if (isPdf) {
        setExportingIndividualPdf(nombre);
        try { await exportSesionesToPdf(row.ID_GRUPO, nombre, opts); }
        finally { setExportingIndividualPdf(null); }
      } else {
        setExportingIndividual(nombre);
        try { await exportSesionesToExcel(row.ID_GRUPO, nombre, opts); }
        finally { setExportingIndividual(null); }
      }
    } else if (pending.type === 'all') {
      if (isPdf) {
        setExportingAllPdf(true);
        try { await exportAllSesionesToPdf(records, opts); }
        finally { setExportingAllPdf(false); }
      } else {
        setExportingAll(true);
        setExportProgress({ current: 0, total: records.length });
        const processExport = async () => {
          for (let i = 0; i < records.length; i++) {
            setExportProgress({ current: i + 1, total: records.length });
            if (i % 3 === 0) await new Promise(resolve => setTimeout(resolve, 10));
          }
        };
        processExport();
        try { await exportAllSesionesToExcel(records, opts); }
        finally { setExportingAll(false); setExportProgress({ current: 0, total: 0 }); }
      }
    }
  };

  const tableLevelConfigs = levelConfigs.map(config => ({
    ...config,
    actions: {
      exportExcel: {
        enabled: true,
        icon: 'download',
        label: 'Exportar Excel',
        className: 'text-green-600 hover:bg-green-100',
        onClick: (row) => handleExportIndividual(row),
      },
      exportPdf: {
        enabled: true,
        icon: 'file-text',
        label: 'Exportar PDF',
        className: 'text-red-600 hover:bg-red-50',
        onClick: (row) => setExportModalPending({ type: 'individual', format: 'pdf', row })
      }
    }
  }));

  return (
    <LayoutWithSidebar>
      <ExportOptionsModal
        isOpen={!!exportModalPending}
        title={
          exportModalPending?.format === 'pdf'
            ? (exportModalPending?.type === 'all' ? 'Opciones — Exportar Todo PDF' : 'Opciones — Exportar PDF')
            : (exportModalPending?.type === 'all' ? 'Opciones — Exportar Todo Excel' : 'Opciones — Exportar Excel')
        }
        onConfirm={handleModalConfirm}
        onCancel={() => setExportModalPending(null)}
      />
      <div className="px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reportes de Grupos</h1>
            <p className="text-sm text-gray-600 mt-1">
              Seleccione un período para ver los grupos asignados
            </p>
          </div>
          {selectedPeriodo && !loading && !error && records && records.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportAllExcel}
                disabled={exportingAll || exportingAllPdf}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exportingAll ? (
                  <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>Exportando...</>
                ) : (
                  <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>Exportar Todo Excel</>
                )}
              </button>
              <button
                onClick={() => setExportModalPending({ type: 'all', format: 'pdf' })}
                disabled={exportingAll || exportingAllPdf}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exportingAllPdf ? (
                  <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>Generando PDF...</>
                ) : (
                  <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>Exportar Todo PDF</>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="w-full max-w-md">
            <ReferenceSelectInput
              name="id_periodo"
              label="Período Académico"
              referenceTable="PERIODOS"
              referenceField="ID_PERIODO"
              referenceLabelField="NOMBRE_PERIODO"
              referenceFilters={[{ field: 'ACTIVO', op: '=', value: true }]}
              placeholder="Seleccione un período..."
              searchable={true}
              value={selectedPeriodo}
              onChange={handlePeriodoChange}
              formData={{}}
            />
          </div>
        </div>

        {!selectedPeriodo && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-4 text-gray-500 font-medium">Seleccione un período</p>
            <p className="mt-2 text-sm text-gray-400 max-w-md mx-auto">
              Elija un período académico para cargar y visualizar los grupos.
            </p>
          </div>
        )}

        {selectedPeriodo && loading && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500 font-medium">Cargando grupos...</p>
          </div>
        )}

        {selectedPeriodo && error && (
          <div className="bg-red-50 rounded-xl border border-red-200 shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-red-800 font-medium">Error al cargar datos</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {selectedPeriodo && !loading && !error && records && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800">
                Grupos del Período
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Total: {records.length} grupo{records.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="overflow-x-auto">
              <TableMultiLevelRender
                data={records}
                levelConfigs={tableLevelConfigs}
              />
            </div>
          </div>
        )}

        {exportingIndividual && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Exportando Excel...</h3>
              <p className="text-gray-500 text-sm">{exportingIndividual}</p>
            </div>
          </div>
        )}

        {exportingIndividualPdf && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Generando PDF...</h3>
              <p className="text-gray-500 text-sm">{exportingIndividualPdf}</p>
            </div>
          </div>
        )}

        {exportingAllPdf && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Generando PDF todos los grupos...</h3>
              <p className="text-gray-500 text-sm">Por favor espere...</p>
            </div>
          </div>
        )}

        {exportingAll && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-green-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Exportando grupos...</h3>
                <p className="text-gray-600 text-center mb-4">
                  Esto puede tomar un momento.<br/>
                  Generando hojas de Excel para cada grupo.
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(exportProgress.current / exportProgress.total) * 100}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500">
                  Procesando {exportProgress.current} de {exportProgress.total} grupos
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </LayoutWithSidebar>
  );
}

export default ReportesGrupos;
