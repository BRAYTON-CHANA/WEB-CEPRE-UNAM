import ExcelJS from 'exceljs';
import { db } from '@/shared/api';

const sanitizeSheetName = (name) =>
  String(name).replace(/[*?:\\/\[\]]/g, '-').slice(0, 31);

// Orden de hojas: Moquegua primero, Virtual al final, resto alfabético
const ordenSede = (a, b) => {
  const rank = (n) =>
    n?.toLowerCase().includes('moquegua') ? 0
    : n?.toLowerCase() === 'virtual' ? 2
    : 1;
  return rank(a) - rank(b) || (a || '').localeCompare(b || '');
};

export const exportRelacionDocentes = async (idPeriodo) => {
  try {
    const rows = await db.select('VW_RELACION_DOCENTES', { ID_PERIODO: idPeriodo }) || [];

    if (rows.length === 0) {
      alert('No hay cursos asignados para exportar en este período');
      return;
    }

    const nombrePeriodo = rows[0]?.NOMBRE_PERIODO || 'N/A';

    // Agrupar por sede
    const porSede = new Map();
    for (const r of rows) {
      const sede = r.NOMBRE_SEDE || 'Virtual';
      if (!porSede.has(sede)) porSede.set(sede, []);
      porSede.get(sede).push(r);
    }
    const sedes = [...porSede.keys()].sort(ordenSede);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema Horarios';
    workbook.created = new Date();

    const institutionFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
    const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D366F' } };
    const titleFont = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    const headerFont = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    const dataFont = { name: 'Arial', size: 10, color: { argb: 'FF1F2937' } };
    const thinBorder = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };

    const NUM_COLS = 5;

    for (const sede of sedes) {
      const filas = porSede.get(sede)
        .sort((a, b) =>
          (a.CODIGO_GRUPO || '').localeCompare(b.CODIGO_GRUPO || '') ||
          (a.NOMBRE_CURSO || '').localeCompare(b.NOMBRE_CURSO || ''));

      const ws = workbook.addWorksheet(sanitizeSheetName(sede));

      // Encabezado institucional
      ws.mergeCells(1, 1, 1, NUM_COLS);
      const ic = ws.getCell(1, 1);
      ic.value = 'CENTRO DE ESTUDIOS PREUNIVERSITARIO - UNAM';
      ic.font = titleFont;
      ic.fill = institutionFill;
      ic.alignment = { vertical: 'middle', horizontal: 'center' };
      ws.getRow(1).height = 26;

      ws.mergeCells(2, 1, 2, NUM_COLS);
      const cc = ws.getCell(2, 1);
      cc.value = `CICLO DE PREPARACIÓN ${nombrePeriodo.toUpperCase()}`;
      cc.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cc.fill = institutionFill;
      cc.alignment = { vertical: 'middle', horizontal: 'center' };
      ws.getRow(2).height = 24;

      ws.mergeCells(3, 1, 3, NUM_COLS);
      const tc = ws.getCell(3, 1);
      tc.value = `RELACIÓN DE DOCENTES — ${sede.toUpperCase()}`;
      tc.font = titleFont;
      tc.fill = headerFill;
      tc.alignment = { vertical: 'middle', horizontal: 'center' };
      ws.getRow(3).height = 26;

      // Headers de tabla
      const headers = ['N°', 'GRUPO', 'CURSO', 'DOCENTE', 'TELÉFONO'];
      headers.forEach((h, i) => {
        const cell = ws.getCell(4, i + 1);
        cell.value = h;
        cell.font = headerFont;
        cell.fill = headerFill;
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = thinBorder;
      });
      ws.getRow(4).height = 22;

      // Datos
      filas.forEach((r, idx) => {
        const rowNum = 5 + idx;
        const values = [
          idx + 1,
          r.CODIGO_GRUPO || r.NOMBRE_GRUPO || '—',
          `${r.CODIGO_CURSO ? r.CODIGO_CURSO + ' — ' : ''}${r.NOMBRE_CURSO || '—'}`,
          r.DOCENTE_NOMBRE || 'Sin docente asignado',
          r.DOCENTE_TELEFONO || '—',
        ];
        values.forEach((v, i) => {
          const cell = ws.getCell(rowNum, i + 1);
          cell.value = v;
          cell.font = dataFont;
          cell.border = thinBorder;
          cell.alignment = {
            vertical: 'middle',
            horizontal: i === 0 || i === 4 ? 'center' : 'left',
          };
        });
        ws.getRow(rowNum).height = 18;
      });

      ws.getColumn(1).width = 6;
      ws.getColumn(2).width = 16;
      ws.getColumn(3).width = 42;
      ws.getColumn(4).width = 40;
      ws.getColumn(5).width = 16;
    }

    const fileName = `Relacion_Docentes_${nombrePeriodo}_${new Date().toISOString().split('T')[0]}.xlsx`
      .replace(/[*?:\\/\[\]]/g, '-');
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

  } catch (error) {
    console.error('Error exportando relación de docentes:', error);
    alert('Error al exportar: ' + error.message);
  }
};
