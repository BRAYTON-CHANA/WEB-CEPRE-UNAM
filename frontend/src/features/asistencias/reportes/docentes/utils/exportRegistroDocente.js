import ExcelJS from 'exceljs';
import { db } from '@/shared/api';
import cepreUrl from '@/app/views/asistencias/reportes/images/cepre.png';
import unamUrl from '@/app/views/asistencias/reportes/images/unam.png';

const loadImageBuffer = async (url) => {
  const res = await fetch(url);
  return await res.arrayBuffer();
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const selectAll = async (table, filters = {}) => {
  const PAGE_SIZE = 1000;
  let offset = 0;
  const all = [];
  while (true) {
    const res = await db.selectWithLimit(table, PAGE_SIZE, offset, filters);
    const rows = res?.data?.records || res || [];
    all.push(...rows);
    if (rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return all;
};

const downloadWorkbook = async (workbook, fileName) => {
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
};

const fmtFecha = (fechaStr) => {
  if (!fechaStr) return '';
  let s = fechaStr;
  if (typeof s === 'string' && s.includes('T')) s = s.split('T')[0];
  // Soporta YYYY-MM-DD o DD/MM/YYYY
  if (s.includes('-')) {
    const [y, m, d] = s.split('-');
    return `${d}/${m}/${y}`;
  }
  return s;
};

const fmtHora = (horaStr) => {
  if (!horaStr) return '';
  const parts = String(horaStr).split(':');
  return `${parts[0]}:${parts[1]}`;
};

const horasAcademicas = (minutos) => {
  if (!minutos) return 0;
  return Math.round((minutos / 50) * 100) / 100;
};

// ─── Estilos ─────────────────────────────────────────────────────────────────
const NAVY = 'FF1F3864';
const TEAL = 'FF4BC0C8';
const GRAY_HDR = 'FFDCE6F1';
const thinBorder = {
  top: { style: 'thin', color: { argb: 'FF000000' } },
  bottom: { style: 'thin', color: { argb: 'FF000000' } },
  left: { style: 'thin', color: { argb: 'FF000000' } },
  right: { style: 'thin', color: { argb: 'FF000000' } }
};

// Columnas tabla: N°, FECHA, TURNO, GRUPO, HORA ENTRADA, FIRMA, TEMA, HORA SALIDA, TOTAL/HORAS, FIRMA
const TABLE_HEADERS = ['N°', 'FECHA', 'TURNO', 'GRUPO', 'HORA DE ENTRADA', 'FIRMA', 'TEMA DESARROLLADO', 'HORA SALIDA', 'TOTAL / HORAS', 'FIRMA'];
const COL_WIDTHS = [5, 12, 10, 12, 14, 12, 36, 12, 12, 14];
const NUM_COLS = TABLE_HEADERS.length;
const ROWS_PER_PAGE = 12;

// ─── Sub-renderers ────────────────────────────────────────────────────────────

const renderHeader = (ws, workbook, startRow, docenteNombre, periodo, cursoNombre, grupoNombre, logoLeftBuf, logoRightBuf) => {
  const r = startRow;
  ws.getRow(r).height = 30;
  ws.getRow(r + 1).height = 30;
  ws.getRow(r + 2).height = 26;

  // Logo CEPRE: cols 2-3, filas r a r+2
  ws.mergeCells(r, 2, r + 2, 3);
  ws.getCell(r, 2).border = thinBorder;
  if (logoLeftBuf) {
    const imgL = workbook.addImage({ buffer: logoLeftBuf, extension: 'png' });
    ws.addImage(imgL, { tl: { col: 1, row: r - 1 }, br: { col: 3, row: r + 2 }, editAs: 'twoCell' });
  } else {
    const logoL = ws.getCell(r, 2);
    logoL.value = 'CEPRE';
    logoL.font = { name: 'Arial', size: 13, bold: true, color: { argb: NAVY } };
    logoL.alignment = { vertical: 'middle', horizontal: 'center' };
    logoL.border = thinBorder;
  }

  // Logo UNAM: cols NUM_COLS a NUM_COLS+1, filas r a r+2
  ws.mergeCells(r, NUM_COLS, r + 2, NUM_COLS + 1);
  ws.getCell(r, NUM_COLS).border = thinBorder;
  if (logoRightBuf) {
    const imgR = workbook.addImage({ buffer: logoRightBuf, extension: 'png' });
    ws.addImage(imgR, { tl: { col: NUM_COLS - 1, row: r - 1 }, br: { col: NUM_COLS + 1, row: r + 2 }, editAs: 'twoCell' });
  } else {
    const logoR = ws.getCell(r, NUM_COLS);
    logoR.value = 'UNAM';
    logoR.font = { name: 'Arial', size: 13, bold: true, color: { argb: NAVY } };
    logoR.alignment = { vertical: 'middle', horizontal: 'center' };
    logoR.border = thinBorder;
  }

  // Título navy: cols 4 a NUM_COLS-1, filas r a r+1
  ws.mergeCells(r, 4, r + 1, NUM_COLS - 1);
  const title = ws.getCell(r, 4);
  title.value = 'REGISTRO DE ASISTENCIA DE DOCENTES';
  title.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  title.alignment = { vertical: 'middle', horizontal: 'center' };
  title.border = thinBorder;

  // Banda período teal: cols 4 a NUM_COLS-1, fila r+2
  ws.mergeCells(r + 2, 4, r + 2, NUM_COLS - 1);
  const subt = ws.getCell(r + 2, 4);
  subt.value = (periodo || '').toUpperCase();
  subt.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  subt.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TEAL } };
  subt.alignment = { vertical: 'middle', horizontal: 'center' };
  subt.border = thinBorder;

  // Fila r+3: DOCENTE
  ws.mergeCells(r + 3, 2, r + 3, 3);
  const docLabel = ws.getCell(r + 3, 2);
  docLabel.value = 'DOCENTE';
  docLabel.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  docLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  docLabel.alignment = { vertical: 'middle', horizontal: 'center' };
  docLabel.border = thinBorder;
  ws.mergeCells(r + 3, 4, r + 3, NUM_COLS + 1);
  const docVal = ws.getCell(r + 3, 4);
  docVal.value = docenteNombre || '';
  docVal.font = { name: 'Arial', size: 10, color: { argb: 'FF000000' } };
  docVal.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  docVal.border = thinBorder;
  ws.getRow(r + 3).height = 24;

  // Fila r+4: CURSO
  ws.mergeCells(r + 4, 2, r + 4, 3);
  const cursoLabel = ws.getCell(r + 4, 2);
  cursoLabel.value = 'CURSO';
  cursoLabel.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  cursoLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  cursoLabel.alignment = { vertical: 'middle', horizontal: 'center' };
  cursoLabel.border = thinBorder;
  ws.mergeCells(r + 4, 4, r + 4, NUM_COLS + 1);
  const cursoVal = ws.getCell(r + 4, 4);
  cursoVal.value = cursoNombre ? (grupoNombre ? `${cursoNombre} - ${grupoNombre}` : cursoNombre) : (grupoNombre || '');
  cursoVal.font = { name: 'Arial', size: 10, color: { argb: 'FF000000' } };
  cursoVal.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  cursoVal.border = thinBorder;
  ws.getRow(r + 4).height = 24;

  return r + 5; // siguiente fila disponible
};

const renderTableHeader = (ws, startRow) => {
  TABLE_HEADERS.forEach((h, i) => {
    const c = ws.getCell(startRow, i + 2);
    c.value = h;
    c.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TEAL } };
    c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    c.border = thinBorder;
  });
  ws.getRow(startRow).height = 30;
  return startRow + 1;
};

const renderTotalRow = (ws, startRow, totalHoras) => {
  ws.mergeCells(startRow, 2, startRow, NUM_COLS - 1);
  const totalLabel = ws.getCell(startRow, 2);
  totalLabel.value = 'TOTAL HORAS ACADÉMICAS';
  totalLabel.font = { name: 'Arial', size: 9, bold: true, color: { argb: NAVY } };
  totalLabel.alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };
  totalLabel.border = thinBorder;
  const totalVal = ws.getCell(startRow, NUM_COLS);
  totalVal.value = Math.round(totalHoras * 100) / 100;
  totalVal.font = { name: 'Arial', size: 9, bold: true, color: { argb: NAVY } };
  totalVal.alignment = { vertical: 'middle', horizontal: 'center' };
  totalVal.border = thinBorder;
  ws.getCell(startRow, NUM_COLS + 1).border = thinBorder;
  ws.getRow(startRow).height = 22;
  return startRow + 1;
};

const renderTotalGeneral = (ws, startRow, totalHoras) => {
  ws.mergeCells(startRow, 2, startRow, NUM_COLS - 1);
  const label = ws.getCell(startRow, 2);
  label.value = 'TOTAL GENERAL DE HORAS ACADÉMICAS';
  label.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  label.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  label.alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };
  label.border = thinBorder;
  const val = ws.getCell(startRow, NUM_COLS);
  val.value = Math.round(totalHoras * 100) / 100;
  val.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  val.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  val.alignment = { vertical: 'middle', horizontal: 'center' };
  val.border = thinBorder;
  ws.getCell(startRow, NUM_COLS + 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  ws.getCell(startRow, NUM_COLS + 1).border = thinBorder;
  ws.getRow(startRow).height = 26;
  return startRow + 1;
};

const renderFooter = (ws, startRow, docenteNombre, dni) => {
  // Fila de separación antes de las firmas
  ws.getRow(startRow).height = 16;
  const firmaRow = startRow + 1;

  // Línea docente: cols 3-5 (una columna a la derecha)
  ws.mergeCells(firmaRow, 3, firmaRow, 5);
  ws.getCell(firmaRow, 3).border = { top: { style: 'thin', color: { argb: 'FF000000' } } };
  // Línea responsable: cols 8-10 (una columna a la derecha)
  ws.mergeCells(firmaRow, 8, firmaRow, 10);
  ws.getCell(firmaRow, 8).border = { top: { style: 'thin', color: { argb: 'FF000000' } } };

  const dRow = firmaRow + 1;
  ws.getCell(dRow, 3).value = `DOCENTE: ${docenteNombre || ''}`;
  ws.getCell(dRow, 3).font = { name: 'Arial', size: 9, color: { argb: 'FF000000' } };
  ws.getCell(dRow, 8).value = 'RESPONSABLE:';
  ws.getCell(dRow, 8).font = { name: 'Arial', size: 9, color: { argb: 'FF000000' } };

  const dniRow = firmaRow + 2;
  ws.getCell(dniRow, 3).value = `DNI: ${dni || ''}`;
  ws.getCell(dniRow, 3).font = { name: 'Arial', size: 9, color: { argb: 'FF000000' } };
  ws.getCell(dniRow, 8).value = 'DNI:';
  ws.getCell(dniRow, 8).font = { name: 'Arial', size: 9, color: { argb: 'FF000000' } };

  return dniRow + 1; // siguiente fila disponible
};

// ─── Construir hoja para un curso (paginada por ROWS_PER_PAGE) ───────────────
const buildSheetForCurso = (workbook, docenteNombre, periodo, cursoNombre, grupoNombre, sesiones, dni, sheetName, logoLeftBuf, logoRightBuf) => {
  const ws = workbook.addWorksheet((sheetName || cursoNombre || 'Curso').slice(0, 31));

  // Anchos de columna (col 1 = margen izq, cols 2-11 = contenido, col 12 = margen der)
  ws.getColumn(1).width = 2;
  COL_WIDTHS.forEach((w, i) => { ws.getColumn(i + 2).width = w; });
  ws.getColumn(NUM_COLS + 2).width = 2;

  // Configuración de página A4 portrait
  ws.pageSetup = {
    paperSize: 9,
    orientation: 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 }
  };

  // Partir sesiones en chunks de ROWS_PER_PAGE
  const chunks = [];
  for (let i = 0; i < sesiones.length; i += ROWS_PER_PAGE) {
    chunks.push(sesiones.slice(i, i + ROWS_PER_PAGE));
  }
  if (chunks.length === 0) chunks.push([]);

  let currentRow = 1;
  // Margen superior inicial
  ws.getRow(currentRow).height = 8;
  currentRow++;

  let grandTotal = 0;

  chunks.forEach((chunk, chunkIdx) => {
    const pageStartRow = currentRow;

    // Header
    currentRow = renderHeader(ws, workbook, currentRow, docenteNombre, periodo, cursoNombre, grupoNombre, logoLeftBuf, logoRightBuf);

    // Espacio entre header y tabla
    ws.getRow(currentRow).height = 14;
    currentRow++;

    // Encabezado tabla
    currentRow = renderTableHeader(ws, currentRow);

    // Filas de datos
    let chunkHoras = 0;
    const globalOffset = chunkIdx * ROWS_PER_PAGE;
    chunk.forEach((s, idx) => {
      const horas = horasAcademicas(s.DURACION_CLASE_MINUTOS);
      chunkHoras += horas;
      const values = [
        globalOffset + idx + 1,
        fmtFecha(s.FECHA),
        s.NOMBRE_TURNO || '',
        s.NOMBRE_GRUPO || s.CODIGO_GRUPO || '',
        fmtHora(s.HORA_INICIO),
        '',
        '',
        fmtHora(s.HORA_FIN),
        horas || '',
        '',
      ];
      values.forEach((v, i) => {
        const c = ws.getCell(currentRow, i + 2);
        c.value = v;
        c.font = { name: 'Arial', size: 9, color: { argb: 'FF000000' } };
        c.alignment = { vertical: 'middle', horizontal: i === 6 ? 'left' : 'center', wrapText: true };
        c.border = thinBorder;
      });
      ws.getRow(currentRow).height = 26;
      currentRow++;
    });

    // Acumular gran total
    grandTotal += chunkHoras;

    // Total parcial
    currentRow = renderTotalRow(ws, currentRow, chunkHoras);

    // Total general solo en la última página, antes del footer
    if (chunkIdx === chunks.length - 1) {
      currentRow = renderTotalGeneral(ws, currentRow, grandTotal);
    }

    // Footer (ya incluye fila de separación interna)
    currentRow = renderFooter(ws, currentRow, docenteNombre, dni);

    // Salto de página entre bloques (no después del último)
    if (chunkIdx < chunks.length - 1) {
      // El pageBreak va en la última fila con contenido (dniRow = currentRow - 1)
      ws.getRow(currentRow - 1).addPageBreak();
      // Margen superior del siguiente bloque
      ws.getRow(currentRow).height = 8;
      currentRow++;
    }
  });

  return true;
};

// ─── Agrupar sesiones por plaza (ID_PLAZA_DOCENTE) → una hoja por curso/plaza ──
const agruparPorPlaza = (sesiones) => {
  const map = new Map();
  for (const s of sesiones) {
    const key = s.ID_PLAZA_DOCENTE ?? `${s.NOMBRE_CURSO}__${s.PLAZA_IDENTIFICADOR}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(s);
  }
  // Ordenar cada plaza por fecha + hora inicio
  for (const arr of map.values()) {
    arr.sort((a, b) => {
      const fa = String(a.FECHA || '');
      const fb = String(b.FECHA || '');
      if (fa !== fb) return fa.localeCompare(fb);
      return String(a.HORA_INICIO || '').localeCompare(String(b.HORA_INICIO || ''));
    });
  }
  return map;
};

// ════════════════════════════════════════════════════════════════════════════
// EXPORTS PÚBLICOS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Exporta el registro de asistencia de 1 docente (una hoja por curso).
 */
export const exportRegistroDocente = async (idDocente, nombreDocente, idPeriodo) => {
  try {
    const sesiones = await selectAll('VW_SESIONES_COMPLETA', {
      ID_DOCENTE_PROGRAMADO: idDocente,
      ...(idPeriodo ? { ID_PERIODO: idPeriodo } : {})
    });

    if (!sesiones || sesiones.length === 0) {
      alert('No hay sesiones programadas para este docente en el período seleccionado');
      return;
    }

    const periodo = sesiones[0]?.NOMBRE_PERIODO || '';
    const dni = sesiones[0]?.DOCENTE_DNI || '';

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CEPRE UNAM';
    workbook.created = new Date();

    const [logoLeftBuf, logoRightBuf] = await Promise.all([
      loadImageBuffer(cepreUrl).catch(() => null),
      loadImageBuffer(unamUrl).catch(() => null)
    ]);

    const porPlaza = agruparPorPlaza(sesiones);
    let i = 0;
    for (const arr of porPlaza.values()) {
      const cursoNombre = arr[0]?.NOMBRE_CURSO || 'Curso';
      const sheetName = cursoNombre.slice(0, 31) || `Curso ${++i}`;
      buildSheetForCurso(workbook, nombreDocente, periodo, cursoNombre, '', arr, dni, sheetName, logoLeftBuf, logoRightBuf);
    }

    const fileName = `Registro_${(nombreDocente || 'Docente').replace(/\s+/g, '_')}.xlsx`;
    await downloadWorkbook(workbook, fileName);
  } catch (error) {
    console.error('Error exportando registro docente:', error);
    alert('Error al exportar: ' + error.message);
  }
};

/**
 * Exporta el registro de todos los docentes de una sede (un workbook,
 * hojas por docente-curso).
 */
export const exportRegistroSede = async (sede, idPeriodo, docentes, onProgress) => {
  try {
    if (!docentes || docentes.length === 0) {
      alert('No hay docentes para exportar en esta sede');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CEPRE UNAM';
    workbook.created = new Date();

    const [logoLeftBuf, logoRightBuf] = await Promise.all([
      loadImageBuffer(cepreUrl).catch(() => null),
      loadImageBuffer(unamUrl).catch(() => null)
    ]);

    let processed = 0;
    let added = 0;
    if (onProgress) onProgress(0, docentes.length);

    for (const doc of docentes) {
      const nombreDoc = doc.NOMBRE_COMPLETO || `${doc.APELLIDOS || ''} ${doc.NOMBRES || ''}`.trim();
      const sesiones = await selectAll('VW_SESIONES_COMPLETA', {
        ID_DOCENTE_PROGRAMADO: doc.ID_DOCENTE,
        ...(idPeriodo ? { ID_PERIODO: idPeriodo } : {})
      });

      if (sesiones && sesiones.length > 0) {
        const periodo = sesiones[0]?.NOMBRE_PERIODO || '';
        const dni = sesiones[0]?.DOCENTE_DNI || doc.DNI || '';
        const porPlaza = agruparPorPlaza(sesiones);
        for (const arr of porPlaza.values()) {
          const cursoNombre = arr[0]?.NOMBRE_CURSO || 'Curso';
          const ape = (doc.APELLIDOS || nombreDoc).split(' ')[0];
          const sheetName = `${ape}-${cursoNombre}`.slice(0, 31);
          buildSheetForCurso(workbook, nombreDoc, periodo, cursoNombre, '', arr, dni, sheetName, logoLeftBuf, logoRightBuf);
          added++;
        }
      }
      processed++;
      if (onProgress) onProgress(processed, docentes.length);
    }

    if (added === 0) {
      alert('No se encontraron sesiones para los docentes de esta sede');
      return;
    }

    const sedeNombre = sede?.NOMBRE_SEDE || 'Sede';
    const fileName = `Registro_Asistencia_${sedeNombre.replace(/\s+/g, '_')}.xlsx`;
    await downloadWorkbook(workbook, fileName);
  } catch (error) {
    console.error('Error exportando registro sede:', error);
    alert('Error al exportar: ' + error.message);
  }
};
