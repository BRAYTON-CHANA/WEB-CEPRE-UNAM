import React, { useState, useMemo } from 'react';
import LayoutWithSidebar from '@/shared/components/layout/LayoutWithSidebar';
import ReferenceSelectInput from '@/shared/components/ui/inputs/ReferenceSelectInput';
import { useTableData } from '@/features/crud/hooks/useTableData';
import ExportOptionsModal from '../shared/ExportOptionsModal';
import { exportDocenteToExcel, exportAllDocentesToExcel } from './utils/exportDocenteToExcel';
import { exportDocenteToPdf, exportAllDocentesToPdf } from './utils/exportDocenteToPdf';

const ITEMS_PER_PAGE = 15;

const Badge = ({ text }) => (
  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800 font-medium">
    {text}
  </span>
);

const StatItem = ({ label, value }) => (
  <div className="flex flex-col">
    <span className="text-xs text-gray-500">{label}</span>
    <span className="text-sm font-semibold text-gray-800">{value ?? 0}</span>
  </div>
);

function DocenteCard({ row, onExportExcel, onExportPdf, exportingExcel, exportingPdf }) {
  const sedes = Array.isArray(row.SEDES) ? row.SEDES : (row.SEDES ? [row.SEDES] : []);
  const cursos = Array.isArray(row.CURSOS) ? row.CURSOS : (row.CURSOS ? [row.CURSOS] : []);
  const ids = Array.isArray(row.IDENTIFICADORES_DOCENTE) ? row.IDENTIFICADORES_DOCENTE : (row.IDENTIFICADORES_DOCENTE ? [row.IDENTIFICADORES_DOCENTE] : []);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="p-4 border-b border-gray-100 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-gray-900 leading-tight truncate">
            {row.NOMBRE_COMPLETO || 'Sin nombre'}
          </h3>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
            {row.DNI && <span className="text-xs text-gray-500">DNI: <span className="font-medium text-gray-700">{row.DNI}</span></span>}
            {row.TIPO_DOCENTE && <span className="text-xs text-gray-500 capitalize">{row.TIPO_DOCENTE}</span>}
            {sedes.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {sedes.map((s, i) => <Badge key={i} text={s} />)}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={onExportExcel}
            disabled={exportingExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-green-200 text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {exportingExcel ? 'Exportando...' : 'Excel'}
          </button>
          <button
            onClick={onExportPdf}
            disabled={exportingPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            {exportingPdf ? 'Exportando...' : 'PDF'}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {ids.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">Plazas</p>
            <div className="flex flex-wrap gap-1">
              {ids.map((id, i) => <Badge key={i} text={id} />)}
            </div>
          </div>
        )}
        {cursos.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">Cursos</p>
            <div className="flex flex-wrap gap-1">
              {cursos.map((c, i) => <Badge key={i} text={c} />)}
            </div>
          </div>
        )}
        <div className="flex gap-6 pt-1 border-t border-gray-100">
          <StatItem label="Horas programadas" value={row.TOTAL_HORAS_PROGRAMADAS} />
          <StatItem label="Horas realizadas"  value={row.TOTAL_HORAS_REALIZADAS} />
          <StatItem label="Pago estimado"      value={row.PAGO_TOTAL_ESTIMADO ? `S/ ${Number(row.PAGO_TOTAL_ESTIMADO).toLocaleString()}` : 'S/ 0'} />
        </div>
      </div>
    </div>
  );
}

function ReportesDocentes() {
  const [selectedPeriodo, setSelectedPeriodo] = useState('');
  const [search, setSearch]                   = useState('');
  const [page, setPage]                       = useState(1);
  const [exportModalPending, setExportModalPending]         = useState(null);
  const [exportingIndividual, setExportingIndividual]       = useState(null);
  const [exportingIndividualPdf, setExportingIndividualPdf] = useState(null);
  const [exportingAll, setExportingAll]                     = useState(false);
  const [exportAllProgress, setExportAllProgress]           = useState({ current: 0, total: 0 });
  const [exportingPdf, setExportingPdf]                     = useState(false);
  const [exportPdfProgress, setExportPdfProgress]           = useState(null);

  const filters = useMemo(() => selectedPeriodo ? { ID_PERIODO: selectedPeriodo } : {}, [selectedPeriodo]);

  const { records, loading, error } = useTableData(
    selectedPeriodo ? 'VW_HORAS_POR_DOCENTE' : null,
    filters
  );

  const filtered = useMemo(() => {
    if (!records) return [];
    if (!search.trim()) return records;
    const q = search.toLowerCase();
    return records.filter(r =>
      (r.NOMBRE_COMPLETO || '').toLowerCase().includes(q) ||
      (r.DNI || '').includes(q)
    );
  }, [records, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handlePeriodoChange = (_, value) => { setSelectedPeriodo(value); setPage(1); setSearch(''); };
  const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };

  const handleModalConfirm = async () => {
    const pending = exportModalPending;
    setExportModalPending(null);
    if (!pending) return;
    const isPdf = pending.format === 'pdf';

    if (pending.type === 'docente') {
      const row = pending.row;
      if (isPdf) {
        setExportingIndividualPdf(row.ID_DOCENTE);
        try { await exportDocenteToPdf(row.ID_DOCENTE, row.NOMBRE_COMPLETO); }
        finally { setExportingIndividualPdf(null); }
      } else {
        setExportingIndividual(row.ID_DOCENTE);
        try { await exportDocenteToExcel(row.ID_DOCENTE, row.NOMBRE_COMPLETO); }
        finally { setExportingIndividual(null); }
      }
    } else if (pending.type === 'all') {
      if (isPdf) {
        setExportingPdf(true);
        setExportPdfProgress({ current: 0, total: 0 });
        try {
          await exportAllDocentesToPdf(selectedPeriodo, (current, total) => setExportPdfProgress({ current, total }));
        } finally { setExportingPdf(false); setExportPdfProgress(null); }
      } else {
        setExportingAll(true);
        setExportAllProgress({ current: 0, total: 0 });
        try {
          await exportAllDocentesToExcel(selectedPeriodo, (current, total) => setExportAllProgress({ current, total }));
        } finally { setExportingAll(false); setExportAllProgress({ current: 0, total: 0 }); }
      }
    }
  };

  return (
    <LayoutWithSidebar>
      <div className="px-4 py-6 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reporte de Docentes</h1>
            <p className="text-sm text-gray-600 mt-1">
              Seleccione un período para ver los docentes con plazas asignadas
            </p>
          </div>
          {selectedPeriodo && records && records.length > 0 && (
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setExportModalPending({ type: 'all', format: 'excel' })}
                disabled={exportingAll}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {exportingAll ? `Exportando ${exportAllProgress.current}/${exportAllProgress.total}...` : 'Exportar Todo (Excel)'}
              </button>
              <button
                onClick={() => setExportModalPending({ type: 'all', format: 'pdf' })}
                disabled={exportingPdf}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {exportingPdf ? `Exportando ${exportPdfProgress?.current ?? 0}/${exportPdfProgress?.total ?? 0}...` : 'Exportar Todo (PDF)'}
              </button>
            </div>
          )}
        </div>

        {/* ── Selector de período ── */}
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

        {/* ── Estado vacío ── */}
        {!selectedPeriodo && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-4 text-gray-500 font-medium">Seleccione un período</p>
            <p className="mt-2 text-sm text-gray-400 max-w-md mx-auto">
              Elija un período académico para ver los docentes con plazas asignadas.
            </p>
          </div>
        )}

        {/* ── Cargando ── */}
        {selectedPeriodo && loading && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500 font-medium">Cargando docentes...</p>
          </div>
        )}

        {/* ── Error ── */}
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

        {/* ── Lista de docentes ── */}
        {selectedPeriodo && !loading && !error && records && (
          <div className="space-y-4">
            {/* Barra superior: total + buscador */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-sm text-gray-600 font-medium">
                {filtered.length} docente{filtered.length !== 1 ? 's' : ''}
                {search ? ` encontrado${filtered.length !== 1 ? 's' : ''}` : ' con plaza asignada'}
              </p>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar por nombre o DNI..."
                  value={search}
                  onChange={handleSearch}
                  className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                />
              </div>
            </div>

            {/* Cards */}
            {paginated.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center text-gray-400 text-sm">
                No se encontraron docentes{search ? ` para "${search}"` : ''}.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {paginated.map((row) => (
                  <DocenteCard
                    key={row.ID_DOCENTE}
                    row={row}
                    exportingExcel={exportingIndividual === row.ID_DOCENTE}
                    exportingPdf={exportingIndividualPdf === row.ID_DOCENTE}
                    onExportExcel={() => setExportModalPending({ type: 'docente', format: 'excel', row })}
                    onExportPdf={() => setExportModalPending({ type: 'docente', format: 'pdf', row })}
                  />
                ))}
              </div>
            )}

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-gray-500">
                  Página {page} de {totalPages} · mostrando {paginated.length} de {filtered.length}
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ‹ Anterior
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${p === page ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Siguiente ›
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      <ExportOptionsModal
        isOpen={!!exportModalPending}
        title={
          exportModalPending?.type === 'all'
            ? `Exportar todos los docentes (${exportModalPending?.format === 'pdf' ? 'PDF' : 'Excel'})`
            : `Exportar — ${exportModalPending?.row?.NOMBRE_COMPLETO || 'Docente'} (${exportModalPending?.format === 'pdf' ? 'PDF' : 'Excel'})`
        }
        onConfirm={handleModalConfirm}
        onCancel={() => setExportModalPending(null)}
      />
    </LayoutWithSidebar>
  );
}

export default ReportesDocentes;
