import { useState } from 'react';
import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';

const C_INDIGO    = [79, 70, 229];
const C_INDIGO_LT = [99, 102, 241];
const C_LILA      = [245, 243, 255];
const C_WHITE     = [255, 255, 255];
const C_DARK      = [31, 41, 55];
const C_GRAY      = [107, 114, 128];
const C_BORDER    = [209, 213, 219];

const COLS = [
  { key: 'IDENTIFICADOR_DOCENTE', label: 'Identificador',    w: 42 },
  { key: 'NOMBRE_DOCENTE',        label: 'Nombre Docente',   w: 52 },
  { key: 'NOMBRE_CURSO',          label: 'Curso',            w: 42 },
  { key: 'PAGO_POR_HORA',         label: 'Pago / Hora',      w: 24 },
  { key: 'GRUPOS_NOMBRES',        label: 'Grupos',           w: 60 },
];

const getNow = () => new Date().toISOString().split('T')[0];

const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href    = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ─── Excel ────────────────────────────────────────────────────────────────────

const buildExcel = async (rows, sedeName) => {
  const wb    = new ExcelJS.Workbook();
  wb.creator  = 'Sistema CEPRE';
  wb.created  = new Date();
  const ws    = wb.addWorksheet('Plazas Docentes');
  const ncols = COLS.length;

  // Título
  ws.mergeCells(1, 1, 1, ncols);
  const title = ws.getCell('A1');
  title.value     = `PLAZAS DOCENTES - ${(sedeName || '').toUpperCase()}`;
  title.font      = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } };
  title.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
  title.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 28;

  // Cabeceras
  const hRow = ws.addRow(COLS.map(c => c.label));
  hRow.eachCell(cell => {
    cell.font      = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border    = { bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } } };
  });
  ws.getRow(2).height = 22;

  // Datos
  rows.forEach((r, i) => {
    const vals = COLS.map(c => {
      const v = r[c.key];
      return v == null ? '' : v;
    });
    const dr = ws.addRow(vals);
    if (i % 2 === 0) {
      dr.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F3FF' } };
      });
    }
    dr.eachCell(cell => {
      cell.alignment = { wrapText: true, vertical: 'top' };
    });
  });

  // Anchos de columna
  COLS.forEach((c, i) => {
    ws.getColumn(i + 1).width = c.w;
  });

  const buf  = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  triggerDownload(blob, `plazas_${sedeName || 'sede'}_${getNow()}.xlsx`);
};

// ─── PDF ──────────────────────────────────────────────────────────────────────

const setFill  = (doc, [r, g, b]) => doc.setFillColor(r, g, b);
const setDraw  = (doc, [r, g, b]) => doc.setDrawColor(r, g, b);
const setColor = (doc, [r, g, b]) => doc.setTextColor(r, g, b);

const buildPdf = (rows, sedeName) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const PW  = 297;
  const ML  = 10;
  const MR  = 10;
  const TW  = PW - ML - MR;
  let y     = 10;

  // Título
  setFill(doc, C_INDIGO);
  setDraw(doc, C_INDIGO);
  doc.rect(ML, y, TW, 10, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  setColor(doc, C_WHITE);
  doc.text(`PLAZAS DOCENTES - ${(sedeName || '').toUpperCase()}`, PW / 2, y + 6.5, { align: 'center' });
  y += 13;

  // Proporciones de columnas (suma = 1)
  const ratios = [0.16, 0.22, 0.17, 0.10, 0.35];
  const colW   = ratios.map(r => r * TW);
  const ROW_H  = 8;
  const HEADER_H = 9;

  // Cabecera
  setFill(doc, C_INDIGO_LT);
  setDraw(doc, C_BORDER);
  doc.rect(ML, y, TW, HEADER_H, 'FD');
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  setColor(doc, C_WHITE);
  let cx = ML;
  COLS.forEach((c, i) => {
    doc.text(c.label, cx + colW[i] / 2, y + 6, { align: 'center' });
    cx += colW[i];
  });
  y += HEADER_H;

  // Filas
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  rows.forEach((r, idx) => {
    // nueva página si no hay espacio
    if (y + ROW_H > 200) {
      doc.addPage();
      y = 10;
    }

    const fill = idx % 2 === 0 ? C_LILA : C_WHITE;
    setFill(doc, fill);
    setDraw(doc, C_BORDER);
    doc.rect(ML, y, TW, ROW_H, 'FD');

    setColor(doc, C_DARK);
    cx = ML;
    COLS.forEach((c, i) => {
      const raw = r[c.key];
      const txt = raw == null ? '' : String(raw);
      const clipped = doc.splitTextToSize(txt, colW[i] - 3)[0] || '';
      doc.text(clipped, cx + 2, y + 5.2);
      cx += colW[i];
    });
    y += ROW_H;
  });

  // Pie de página
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    setColor(doc, C_GRAY);
    doc.text(`Página ${p} de ${pages}  ·  Generado: ${getNow()}`, PW / 2, 208, { align: 'center' });
  }

  doc.save(`plazas_${sedeName || 'sede'}_${getNow()}.pdf`);
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useExportDetallePlazas({ plazasDetalle, detalleSede }) {
  const [exportingDetalle, setExportingDetalle] = useState(null);

  const handleExportExcel = async () => {
    if (!plazasDetalle?.length) return;
    setExportingDetalle('excel');
    try {
      await buildExcel(plazasDetalle, detalleSede?.NOMBRE_SEDE);
    } finally {
      setExportingDetalle(null);
    }
  };

  const handleExportPdf = () => {
    if (!plazasDetalle?.length) return;
    setExportingDetalle('pdf');
    try {
      buildPdf(plazasDetalle, detalleSede?.NOMBRE_SEDE);
    } finally {
      setExportingDetalle(null);
    }
  };

  return { exportingDetalle, handleExportExcel, handleExportPdf };
}
