import React, { useEffect, useState } from 'react';
import ExcelJS from 'exceljs';

const exportToExcel = async (data) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Distribución de plazas', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });
  sheet.columns = [
    { header: 'Plaza', key: 'plaza', width: 28 },
    { header: 'Código curso', key: 'codigoCurso', width: 16 },
    { header: 'Curso', key: 'curso', width: 32 },
    { header: 'Sede', key: 'sede', width: 18 },
    { header: 'Modalidad', key: 'modalidad', width: 16 },
    { header: 'Docente', key: 'docente', width: 38 },
    { header: 'DNI', key: 'dni', width: 14 },
    { header: 'Total grupos', key: 'totalGrupos', width: 15 },
    { header: 'Grupos asignados', key: 'grupos', width: 48 }
  ];
  data.forEach((row) => sheet.addRow({
    plaza: row.IDENTIFICADOR_DOCENTE || '',
    codigoCurso: row.CODIGO_CURSO || '',
    curso: row.NOMBRE_CURSO || '',
    sede: row.NOMBRE_SEDE || '',
    modalidad: row.MODALIDAD || '',
    docente: row.DOCENTE_NOMBRE || '',
    dni: row.DNI || '',
    totalGrupos: Number(row.TOTAL_GRUPOS) || 0,
    grupos: Array.isArray(row.GRUPOS) ? row.GRUPOS.join(', ') : ''
  }));
  sheet.autoFilter = { from: 'A1', to: 'I1' };
  sheet.getRow(1).height = 24;
  sheet.getRow(1).eachCell((cell) => {
    cell.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF25346A' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    row.font = { name: 'Arial', size: 10 };
    row.alignment = { vertical: 'top', wrapText: true };
    if (rowNumber % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F6FA' } };
      });
    }
  });
  const buffer = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `distribucion-plazas-${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export default function PlazasDistribucionModal({ open, data, loading, error, onClose }) {
  const [exporting, setExporting] = useState(false);
  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportToExcel(data);
    } finally {
      setExporting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Cerrar distribución" className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]" onClick={onClose} />
      <section className="relative flex max-h-[88vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-gradient-to-r from-[#25346A] to-[#344888] px-6 py-5 text-white">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">Plazas docentes</p>
            <h2 className="mt-1 text-xl font-bold">Distribución por grupos</h2>
            <p className="mt-1 text-sm text-blue-100">Cada plaza y los grupos donde dicta su curso.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-blue-100 transition hover:bg-white/15 hover:text-white" aria-label="Cerrar">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="overflow-auto">
          {loading ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-500">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#25346A]" />
              <span className="text-sm">Cargando distribución...</span>
            </div>
          ) : error ? (
            <div className="m-6 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
              {error.message || 'No se pudo cargar la distribución.'}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50/95 text-xs uppercase tracking-wider text-slate-500 backdrop-blur">
                <tr>
                  <th className="px-5 py-3 font-semibold">Plaza</th>
                  <th className="px-5 py-3 font-semibold">Curso</th>
                  <th className="px-5 py-3 font-semibold">Sede</th>
                  <th className="px-5 py-3 font-semibold">Docente</th>
                  <th className="px-5 py-3 font-semibold">Grupos asignados</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {data.map((row) => {
                  const grupos = Array.isArray(row.GRUPOS) ? row.GRUPOS : [];
                  return (
                    <tr key={row.ID_PLAZA_DOCENTE} className="align-top transition hover:bg-blue-50/40">
                      <td className="whitespace-nowrap px-5 py-4 font-mono text-xs font-semibold text-[#25346A]">{row.IDENTIFICADOR_DOCENTE}</td>
                      <td className="px-5 py-4">
                        <span className="font-semibold text-slate-800">{row.CODIGO_CURSO}</span>
                        <span className="mt-0.5 block text-xs text-slate-500">{row.NOMBRE_CURSO}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-medium text-slate-700">{row.NOMBRE_SEDE}</span>
                        <span className="mt-0.5 block text-xs text-slate-400">{row.MODALIDAD}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={row.ID_POSTULACION ? 'text-slate-700' : 'italic text-slate-400'}>{row.DOCENTE_NOMBRE}</span>
                        {row.DNI && <span className="mt-0.5 block text-xs text-slate-400">DNI {row.DNI}</span>}
                      </td>
                      <td className="min-w-72 px-5 py-4">
                        {grupos.length ? (
                          <div className="flex flex-wrap gap-1.5">
                            {grupos.map((grupo) => (
                              <span key={grupo} className="rounded-md border border-cyan-200 bg-cyan-50 px-2 py-1 font-mono text-xs font-semibold text-cyan-800">{grupo}</span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs italic text-slate-400">Sin grupos asignados</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {!data.length && (
                  <tr><td colSpan={5} className="px-6 py-16 text-center text-slate-400">No hay plazas para mostrar.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        {!loading && !error && (
          <footer className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3 text-xs text-slate-500">
            <span>{data.length} plaza{data.length === 1 ? '' : 's'}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExport}
                disabled={!data.length || exporting}
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {exporting ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-700" />
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" />
                  </svg>
                )}
                {exporting ? 'Exportando...' : 'Exportar Excel'}
              </button>
              <button type="button" onClick={onClose} className="rounded-lg bg-[#25346A] px-4 py-2 font-semibold text-white transition hover:bg-[#344888]">Cerrar</button>
            </div>
          </footer>
        )}
      </section>
    </div>
  );
}
