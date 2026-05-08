import React, { useState, useMemo } from 'react';
import LayoutWithSidebar from '@/shared/components/layout/LayoutWithSidebar';
import ReferenceSelectInput from '@/shared/components/ui/inputs/ReferenceSelectInput';
import TableMultiLevelRender from '@/features/table/views/TableMultiLevelRender';
import { useTableData } from '@/features/crud/hooks/useTableData';
import { exportPlazaToExcel, exportSedeToExcel, exportAllPlazasToExcel } from './utils/exportPlazaToExcel';
import { exportPlazaToPdf, exportSedeToPdf, exportAllPlazasToPdf } from './utils/exportPlazaToPdf';

function ReportesPlazas() {
  const [selectedPeriodo, setSelectedPeriodo] = useState('');
  const [exportProgress, setExportProgress] = useState(null);
  const [exportingIndividual, setExportingIndividual] = useState(null);
  const [exportingAll, setExportingAll] = useState(false);
  const [exportAllProgress, setExportAllProgress] = useState({ current: 0, total: 0 });
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportPdfProgress, setExportPdfProgress] = useState(null);
  const [exportingIndividualPdf, setExportingIndividualPdf] = useState(null);

  const handleExportSede = async (row) => {
    setExportProgress({ current: 0, total: 0, nombre: row.NOMBRE_SEDE });
    await exportSedeToExcel(
      row.ID_SEDE,
      row.NOMBRE_SEDE,
      selectedPeriodo,
      (current, total) => setExportProgress({ current, total, nombre: row.NOMBRE_SEDE })
    );
    setExportProgress(null);
  };

  const handleExportSedePdf = async (row) => {
    setExportPdfProgress({ current: 0, total: 0, nombre: row.NOMBRE_SEDE });
    await exportSedeToPdf(
      row.ID_SEDE,
      row.NOMBRE_SEDE,
      selectedPeriodo,
      (current, total) => setExportPdfProgress({ current, total, nombre: row.NOMBRE_SEDE })
    );
    setExportPdfProgress(null);
  };

  const levelConfigs = [
    {
      level: 1,
      headers: [
        { title: 'NOMBRE_SEDE', type: 'string' }
      ],
      boundColumn: 'ID_SEDE',
      actions: {
        exportExcel: {
          enabled: true,
          icon: 'download',
          label: 'Exportar Excel',
          className: 'text-green-600 hover:bg-green-100',
          onClick: (row) => handleExportSede(row)
        },
        exportPdf: {
          enabled: true,
          icon: 'file-text',
          label: 'Exportar PDF',
          className: 'text-red-600 hover:bg-red-50',
          onClick: (row) => handleExportSedePdf(row)
        }
      }
    },
    {
      level: 2,
      headers: [
        { title: 'IDENTIFICADOR_DOCENTE', type: 'string' },
        { title: 'PAGO_POR_HORA', type: 'number' }
      ],
      boundColumn: 'ID_PLAZA_DOCENTE',
      actions: {
        exportExcel: {
          enabled: true,
          icon: 'download',
          label: 'Exportar Excel',
          className: 'text-green-600 hover:bg-green-100',
          onClick: async (row) => {
            setExportingIndividual(row.IDENTIFICADOR_DOCENTE);
            try {
              await exportPlazaToExcel(row.ID_PLAZA_DOCENTE, row.IDENTIFICADOR_DOCENTE);
            } finally {
              setExportingIndividual(null);
            }
          }
        },
        exportPdf: {
          enabled: true,
          icon: 'file-text',
          label: 'Exportar PDF',
          className: 'text-red-600 hover:bg-red-50',
          onClick: async (row) => {
            setExportingIndividualPdf(row.IDENTIFICADOR_DOCENTE);
            try {
              await exportPlazaToPdf(row.ID_PLAZA_DOCENTE, row.IDENTIFICADOR_DOCENTE);
            } finally {
              setExportingIndividualPdf(null);
            }
          }
        }
      }
    }
  ];

  const filters = useMemo(() => {
    return selectedPeriodo ? { ID_PERIODO: selectedPeriodo } : {};
  }, [selectedPeriodo]);

  const { records, loading, error } = useTableData(
    selectedPeriodo ? 'VW_PERIODOS_SEDES_PLAZAS' : null,
    filters
  );

  const handlePeriodoChange = (_, value) => {
    setSelectedPeriodo(value);
  };

  const handleExportAll = async () => {
    setExportingAll(true);
    setExportAllProgress({ current: 0, total: 0 });
    try {
      await exportAllPlazasToExcel(
        selectedPeriodo,
        (current, total) => setExportAllProgress({ current, total })
      );
    } finally {
      setExportingAll(false);
      setExportAllProgress({ current: 0, total: 0 });
    }
  };

  const handleExportAllPdf = async () => {
    setExportingPdf(true);
    setExportPdfProgress({ current: 0, total: 0 });
    try {
      await exportAllPlazasToPdf(
        selectedPeriodo,
        (current, total) => setExportPdfProgress({ current, total })
      );
    } finally {
      setExportingPdf(false);
      setExportPdfProgress(null);
    }
  };

  return (
    <LayoutWithSidebar>
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

      {exportingPdf && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Generando PDF todas las plazas...</h3>
            <p className="text-gray-500 text-sm mb-4">
              {exportPdfProgress?.total > 0
                ? `Plaza ${exportPdfProgress.current} de ${exportPdfProgress.total}`
                : 'Cargando datos...'}
            </p>
            {exportPdfProgress?.total > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.round((exportPdfProgress.current / exportPdfProgress.total) * 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {exportingAll && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Exportando todas las plazas...</h3>
            <p className="text-gray-500 text-sm mb-4">
              {exportAllProgress.total > 0
                ? `Plaza ${exportAllProgress.current} de ${exportAllProgress.total}`
                : 'Cargando plazas...'}
            </p>
            {exportAllProgress.total > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.round((exportAllProgress.current / exportAllProgress.total) * 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {exportProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-96 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-800 font-semibold text-lg mb-1">Exportando {exportProgress.nombre}</p>
            <p className="text-gray-500 text-sm mb-4">
              {exportProgress.total > 0
                ? `Plaza ${exportProgress.current} de ${exportProgress.total}`
                : 'Cargando plazas...'}
            </p>
            {exportProgress.total > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.round((exportProgress.current / exportProgress.total) * 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}
      <div className="px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reportes de Plazas Docentes</h1>
            <p className="text-sm text-gray-600 mt-1">
              Seleccione un período para ver las plazas docentes asignadas
            </p>
          </div>
          {selectedPeriodo && records && records.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportAll}
                disabled={exportingAll || exportingPdf}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exportingAll ? (
                  <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>Exportando...</>
                ) : (
                  <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>Exportar Todo Excel</>
                )}
              </button>
              <button
                onClick={handleExportAllPdf}
                disabled={exportingAll || exportingPdf}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exportingPdf ? (
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
              Elija un período académico para cargar y visualizar las plazas docentes.
            </p>
          </div>
        )}

        {selectedPeriodo && loading && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500 font-medium">Cargando plazas...</p>
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
                Plazas Docentes del Período
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Total: {records.length} plaza{records.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="overflow-x-auto">
              <TableMultiLevelRender
                data={records}
                levelConfigs={levelConfigs}
              />
            </div>
          </div>
        )}
      </div>
    </LayoutWithSidebar>
  );
}

export default ReportesPlazas;
