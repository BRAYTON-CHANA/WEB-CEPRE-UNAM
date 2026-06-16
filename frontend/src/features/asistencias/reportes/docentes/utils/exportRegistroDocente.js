import ExcelJS from 'exceljs';
import { db } from '@/shared/api';

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

// ─── Construir hoja para un curso ────────────────────────────────────────────
// TODO: embeber logos CEPRE / UNAM como imágenes. Por ahora texto.
const buildSheetForCurso = (workbook, docenteNombre, periodo, cursoNombre, grupoNombre, sesiones, dni, sheetName) => {
  const ws = workbook.addWorksheet((sheetName || cursoNombre || 'Curso').slice(0, 31));

  // ── Fila 1-2: Título + banda período ────────────────────────────────────────
  // Logos texto en col 1 y última col
  ws.mergeCells(1, 1, 2, 1);
  const logoL = ws.getCell(1, 1);
  logoL.value = 'CEPRE';
  logoL.font = { name: 'Arial', size: 11, bold: true, color: { argb: NAVY } };
  logoL.alignment = { vertical: 'middle', horizontal: 'center' };
  logoL.border = thinBorder;

  ws.mergeCells(1, NUM_COLS, 2, NUM_COLS);
  const logoR = ws.getCell(1, NUM_COLS);
  logoR.value = 'UNAM';
  logoR.font = { name: 'Arial', size: 11, bold: true, color: { argb: NAVY } };
  logoR.alignment = { vertical: 'middle', horizontal: 'center' };
  logoR.border = thinBorder;

  // Título navy
  ws.mergeCells(1, 2, 1, NUM_COLS - 1);
  const title = ws.getCell(1, 2);
  title.value = 'REGISTRO DE ASISTENCIA DE DOCENTES';
  title.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  title.alignment = { vertical: 'middle', horizontal: 'center' };
  title.border = thinBorder;
  ws.getRow(1).height = 22;

  // Banda período teal
  ws.mergeCells(2, 2, 2, NUM_COLS - 1);
  const subt = ws.getCell(2, 2);
  subt.value = (periodo || '').toUpperCase();
  subt.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  subt.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TEAL } };
  subt.alignment = { vertical: 'middle', horizontal: 'center' };
  subt.border = thinBorder;
  ws.getRow(2).height = 20;

  // ── Fila 3: DOCENTE ──────────────────────────────────────────────────────────
  const docLabel = ws.getCell(3, 1);
  docLabel.value = 'DOCENTE';
  docLabel.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  docLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  docLabel.alignment = { vertical: 'middle', horizontal: 'center' };
  docLabel.border = thinBorder;
  ws.mergeCells(3, 2, 3, NUM_COLS);
  const docVal = ws.getCell(3, 2);
  docVal.value = docenteNombre || '';
  docVal.font = { name: 'Arial', size: 10, color: { argb: 'FF000000' } };
  docVal.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  docVal.border = thinBorder;
  ws.getRow(3).height = 20;

  // ── Fila 4: CURSO ──────────────────────────────────────────────────────────
  const cursoLabel = ws.getCell(4, 1);
  cursoLabel.value = 'CURSO';
  cursoLabel.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  cursoLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  cursoLabel.alignment = { vertical: 'middle', horizontal: 'center' };
  cursoLabel.border = thinBorder;
  ws.mergeCells(4, 2, 4, NUM_COLS);
  const cursoVal = ws.getCell(4, 2);
  cursoVal.value = cursoNombre ? (grupoNombre ? `${cursoNombre} - ${grupoNombre}` : cursoNombre) : (grupoNombre || '');
  cursoVal.font = { name: 'Arial', size: 10, color: { argb: 'FF000000' } };
  cursoVal.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  cursoVal.border = thinBorder;
  ws.getRow(4).height = 20;

  // ── Fila 6: Encabezado tabla ─────────────────────────────────────────────────
  const headerRow = 6;
  TABLE_HEADERS.forEach((h, i) => {
    const c = ws.getCell(headerRow, i + 1);
    c.value = h;
    c.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TEAL } };
    c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    c.border = thinBorder;
  });
  ws.getRow(headerRow).height = 30;

  // ── Filas de sesiones ─────────────────────────────────────────────────────────
  let row = headerRow + 1;
  let totalHoras = 0;
  sesiones.forEach((s, idx) => {
    const horas = horasAcademicas(s.DURACION_CLASE_MINUTOS);
    totalHoras += horas;
    const values = [
      idx + 1,
      fmtFecha(s.FECHA),
      s.NOMBRE_TURNO || '',
      s.NOMBRE_GRUPO || s.CODIGO_GRUPO || '',
      fmtHora(s.HORA_ENTRADA_REAL),
      '', // FIRMA vacío
      '', // TEMA DESARROLLADO vacío
      fmtHora(s.HORA_SALIDA_REAL),
      horas || '',
      '', // FIRMA vacío
    ];
    values.forEach((v, i) => {
      const c = ws.getCell(row, i + 1);
      c.value = v;
      c.font = { name: 'Arial', size: 9, color: { argb: 'FF000000' } };
      c.alignment = { vertical: 'middle', horizontal: i === 6 ? 'left' : 'center', wrapText: true };
      c.border = thinBorder;
    });
    ws.getRow(row).height = 26;
    row++;
  });

  // ── Fila total horas ──────────────────────────────────────────────────────────
  const totalLabel = ws.getCell(row, 1);
  ws.mergeCells(row, 1, row, NUM_COLS - 2);
  totalLabel.value = 'TOTAL HORAS ACADÉMICAS';
  totalLabel.font = { name: 'Arial', size: 9, bold: true, color: { argb: NAVY } };
  totalLabel.alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };
  totalLabel.border = thinBorder;
  const totalVal = ws.getCell(row, NUM_COLS - 1);
  totalVal.value = Math.round(totalHoras * 100) / 100;
  totalVal.font = { name: 'Arial', size: 9, bold: true, color: { argb: NAVY } };
  totalVal.alignment = { vertical: 'middle', horizontal: 'center' };
  totalVal.border = thinBorder;
  ws.getCell(row, NUM_COLS).border = thinBorder;
  ws.getRow(row).height = 22;
  row += 3;

  // ── Footer firmas ─────────────────────────────────────────────────────────────
  const firmaRow = row;
  // Línea docente (cols 1-3)
  ws.mergeCells(firmaRow, 1, firmaRow, 3);
  const lineD = ws.getCell(firmaRow, 1);
  lineD.border = { top: { style: 'thin', color: { argb: 'FF000000' } } };
  // Línea responsable (cols 6-8)
  ws.mergeCells(firmaRow, 6, firmaRow, 8);
  const lineR = ws.getCell(firmaRow, 6);
  lineR.border = { top: { style: 'thin', color: { argb: 'FF000000' } } };

  const dRow = firmaRow + 1;
  const dCell = ws.getCell(dRow, 1);
  dCell.value = `DOCENTE: ${docenteNombre || ''}`;
  dCell.font = { name: 'Arial', size: 9, color: { argb: 'FF000000' } };
  const rCell = ws.getCell(dRow, 6);
  rCell.value = 'RESPONSABLE:';
  rCell.font = { name: 'Arial', size: 9, color: { argb: 'FF000000' } };

  const dniRow = firmaRow + 2;
  const dniD = ws.getCell(dniRow, 1);
  dniD.value = `DNI: ${dni || ''}`;
  dniD.font = { name: 'Arial', size: 9, color: { argb: 'FF000000' } };
  const dniR = ws.getCell(dniRow, 6);
  dniR.value = 'DNI:';
  dniR.font = { name: 'Arial', size: 9, color: { argb: 'FF000000' } };

  // Anchos de columna
  COL_WIDTHS.forEach((w, i) => { ws.getColumn(i + 1).width = w; });

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

    const porPlaza = agruparPorPlaza(sesiones);
    let i = 0;
    for (const arr of porPlaza.values()) {
      const cursoNombre = arr[0]?.NOMBRE_CURSO || 'Curso';
      const sheetName = cursoNombre.slice(0, 31) || `Curso ${++i}`;
      buildSheetForCurso(workbook, nombreDocente, periodo, cursoNombre, '', arr, dni, sheetName);
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
          // Hoja: apellido + curso (único, recortado a 31)
          const ape = (doc.APELLIDOS || nombreDoc).split(' ')[0];
          const sheetName = `${ape}-${cursoNombre}`.slice(0, 31);
          buildSheetForCurso(workbook, nombreDoc, periodo, cursoNombre, '', arr, dni, sheetName);
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
