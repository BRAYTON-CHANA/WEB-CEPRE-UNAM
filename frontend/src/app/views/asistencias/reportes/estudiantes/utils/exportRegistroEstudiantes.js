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
  if (s.includes('-')) {
    const [y, m, d] = s.split('-');
    return `${d}/${m}`;
  }
  return s;
};

const fmtHora = (horaStr) => {
  if (!horaStr) return '';
  const parts = String(horaStr).split(':');
  return `${parts[0]}:${parts[1]}`;
};

// ─── Estilos ─────────────────────────────────────────────────────────────────
const NAVY   = 'FF1F3864';
const TEAL   = 'FF4BC0C8';
const GREEN  = 'FF059669';
const AMBER  = 'FFD97706';
const RED    = 'FFDC2626';
const BLUE   = 'FF2563EB';
const LGRAY  = 'FFF3F4F6';

const thinBorder = {
  top:    { style: 'thin', color: { argb: 'FF000000' } },
  bottom: { style: 'thin', color: { argb: 'FF000000' } },
  left:   { style: 'thin', color: { argb: 'FF000000' } },
  right:  { style: 'thin', color: { argb: 'FF000000' } },
};

// Mapa de colores por estado
const ESTADO_COLOR = {
  ASISTIO:     { bg: 'FFD1FAE5', fg: 'FF065F46', label: 'A' },
  TARDANZA:    { bg: 'FFFEF3C7', fg: 'FF92400E', label: 'T' },
  FALTA:       { bg: 'FFFEE2E2', fg: 'FF991B1B', label: 'F' },
  JUSTIFICADO: { bg: 'FFDBEAFE', fg: 'FF1E40AF', label: 'J' },
};

// ─── Construir hoja para un grupo ────────────────────────────────────────────
const buildSheetForGrupo = (workbook, grupo, periodo, asistencias) => {
  const sheetName = (grupo.NOMBRE_GRUPO || grupo.CODIGO_GRUPO || 'Grupo').slice(0, 31);
  const ws = workbook.addWorksheet(sheetName);

  // ── Preparar estructura de datos ──────────────────────────────────────────
  // Estructura: fechasMap → fecha → cursosEnFecha → { ID_SESION, nombre_curso, ID_GRUPO_PLAN_CURSO }
  const postulantesMap = new Map();
  // sesionMap: ID_SESION → { FECHA, HORA_INICIO, NOMBRE_CURSO, ID_GRUPO_PLAN_CURSO }
  const sesionMap = new Map();

  for (const row of asistencias) {
    if (!postulantesMap.has(row.ID_POSTULANTE)) {
      postulantesMap.set(row.ID_POSTULANTE, {
        ID_POSTULANTE:  row.ID_POSTULANTE,
        NOMBRES:        row.NOMBRES,
        APELLIDOS:      row.APELLIDOS,
        NOMBRE_CARRERA: row.NOMBRE_CARRERA || '',
      });
    }
    if (row.ID_SESION && !sesionMap.has(row.ID_SESION)) {
      sesionMap.set(row.ID_SESION, {
        ID_SESION:           row.ID_SESION,
        FECHA:               row.FECHA,
        HORA_INICIO:         row.HORA_INICIO,
        NOMBRE_CURSO:        row.NOMBRE_CURSO || 'Curso',
        ID_GRUPO_PLAN_CURSO: row.ID_GRUPO_PLAN_CURSO,
      });
    }
  }

  // Ordenar sesiones por fecha + hora
  const sesiones = [...sesionMap.values()].sort((a, b) => {
    const fa = String(a.FECHA || '');
    const fb = String(b.FECHA || '');
    if (fa !== fb) return fa.localeCompare(fb);
    return String(a.HORA_INICIO || '').localeCompare(String(b.HORA_INICIO || ''));
  });

  // Agrupar sesiones por fecha (para fila 5 = fecha merged)
  const fechasOrdenadas = []; // [{ fecha, sesiones: [] }]
  const fechaIdxMap = new Map(); // fecha_str → índice en fechasOrdenadas
  for (const ses of sesiones) {
    const f = String(ses.FECHA || '');
    if (!fechaIdxMap.has(f)) {
      fechaIdxMap.set(f, fechasOrdenadas.length);
      fechasOrdenadas.push({ fecha: ses.FECHA, sesiones: [] });
    }
    fechasOrdenadas[fechaIdxMap.get(f)].sesiones.push(ses);
  }

  // Postulantes ordenados por apellido
  const postulantes = [...postulantesMap.values()].sort((a, b) =>
    (a.APELLIDOS || '').localeCompare(b.APELLIDOS || '')
  );

  // Mapa estado: `${ID_POSTULANTE}_${ID_SESION}` → estado
  const estadoMap = new Map();
  for (const row of asistencias) {
    if (row.ID_POSTULANTE && row.ID_SESION) {
      estadoMap.set(`${row.ID_POSTULANTE}_${row.ID_SESION}`, row.ESTADO_ASISTENCIA || null);
    }
  }

  // ── Layout de columnas ────────────────────────────────────────────────────
  // Col 1: N°, Col 2: Apellidos y Nombres, Col 3: Carrera
  // Luego por cada fecha: una sub-columna por sesión de esa fecha
  // Últimas 2: TOTAL, %
  const COL_N      = 1;
  const COL_NOMBRE = 2;
  const COL_CARRERA = 3;

  let colIdx = 4;
  const fechaCols = fechasOrdenadas.map(fd => {
    const startCol = colIdx;
    colIdx += fd.sesiones.length;
    return { ...fd, startCol, endCol: colIdx - 1 };
  });
  const COL_TOTAL  = colIdx;
  const COL_PCT    = colIdx + 1;
  const TOTAL_COLS = COL_PCT;

  // Anchos
  ws.getColumn(COL_N).width      = 4;
  ws.getColumn(COL_NOMBRE).width = 28;
  ws.getColumn(COL_CARRERA).width = 20;
  for (const fd of fechaCols) {
    for (let ci = fd.startCol; ci <= fd.endCol; ci++) ws.getColumn(ci).width = 6;
  }
  ws.getColumn(COL_TOTAL).width = 7;
  ws.getColumn(COL_PCT).width   = 7;

  // ── FILAS 1-2: Título ─────────────────────────────────────────────────────
  ws.mergeCells(1, 1, 2, 1);
  const logoL = ws.getCell(1, 1);
  logoL.value = 'CEPRE';
  logoL.font = { name: 'Arial', size: 11, bold: true, color: { argb: NAVY } };
  logoL.alignment = { vertical: 'middle', horizontal: 'center' };
  logoL.border = thinBorder;

  ws.mergeCells(1, 2, 2, TOTAL_COLS - 1);
  const titulo = ws.getCell(1, 2);
  titulo.value = 'REGISTRO DE ASISTENCIA DE ESTUDIANTES';
  titulo.font = { name: 'Arial', size: 13, bold: true, color: { argb: NAVY } };
  titulo.alignment = { vertical: 'middle', horizontal: 'center' };
  titulo.border = thinBorder;

  ws.mergeCells(1, TOTAL_COLS, 2, TOTAL_COLS);
  const logoR = ws.getCell(1, TOTAL_COLS);
  logoR.value = 'UNAM';
  logoR.font = { name: 'Arial', size: 11, bold: true, color: { argb: NAVY } };
  logoR.alignment = { vertical: 'middle', horizontal: 'center' };
  logoR.border = thinBorder;
  ws.getRow(1).height = 20;
  ws.getRow(2).height = 20;

  // ── FILA 3: Período ───────────────────────────────────────────────────────
  ws.mergeCells(3, 1, 3, TOTAL_COLS);
  const periodoCell = ws.getCell(3, 1);
  periodoCell.value = `PERÍODO ACADÉMICO: ${periodo}`;
  periodoCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  periodoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TEAL } };
  periodoCell.alignment = { vertical: 'middle', horizontal: 'center' };
  periodoCell.border = thinBorder;
  ws.getRow(3).height = 18;

  // ── FILA 4: Info sede/grupo/turno/área ────────────────────────────────────
  const infoFields = [
    { label: 'SEDE',  value: grupo.NOMBRE_SEDE  || '' },
    { label: 'GRUPO', value: grupo.NOMBRE_GRUPO || grupo.CODIGO_GRUPO || '' },
    { label: 'TURNO', value: grupo.NOMBRE_TURNO || '' },
    { label: 'ÁREA',  value: grupo.NOMBRE_AREA  || '' },
  ];
  const infoCols = Math.floor(TOTAL_COLS / infoFields.length);
  infoFields.forEach((f, i) => {
    const startC = i * infoCols + 1;
    const endC = i === infoFields.length - 1 ? TOTAL_COLS : startC + infoCols - 1;
    const lc = ws.getCell(4, startC);
    lc.value = f.label;
    lc.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
    lc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
    lc.alignment = { vertical: 'middle', horizontal: 'center' };
    lc.border = thinBorder;
    if (endC > startC + 1) ws.mergeCells(4, startC + 1, 4, endC);
    const vc = ws.getCell(4, startC + 1);
    vc.value = f.value;
    vc.font = { name: 'Arial', size: 9, color: { argb: 'FF000000' } };
    vc.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    vc.border = thinBorder;
  });
  ws.getRow(4).height = 18;

  // ── FILAS 5-6: Cabeceras ──────────────────────────────────────────────────
  // Fila 5: fecha (merged sobre sesiones de ese día), Fila 6: curso rotado 90°
  const ROW_FECHA      = 5;
  const ROW_CURSO      = 6;
  const ROW_DATA_START = 7;

  // Celdas fijas mergeadas en filas 5-6
  const setFixed = (col, label) => {
    ws.mergeCells(ROW_FECHA, col, ROW_CURSO, col);
    const c = ws.getCell(ROW_FECHA, col);
    c.value = label;
    c.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
    c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    c.border = thinBorder;
  };
  setFixed(COL_N, 'N°');
  setFixed(COL_NOMBRE, 'APELLIDOS Y NOMBRES');
  setFixed(COL_CARRERA, 'CARRERA');

  // Cabeceras por fecha
  for (const fd of fechaCols) {
    // Fila 5: fecha merged sobre sus sesiones
    if (fd.endCol > fd.startCol) ws.mergeCells(ROW_FECHA, fd.startCol, ROW_FECHA, fd.endCol);
    const fc = ws.getCell(ROW_FECHA, fd.startCol);
    fc.value = fmtFecha(fd.fecha);
    fc.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
    fc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TEAL } };
    fc.alignment = { vertical: 'middle', horizontal: 'center' };
    fc.border = thinBorder;

    // Fila 6: nombre del curso rotado 90° por cada sesión de esa fecha
    fd.sesiones.forEach((ses, si) => {
      const cc = ws.getCell(ROW_CURSO, fd.startCol + si);
      cc.value = ses.NOMBRE_CURSO;
      cc.font = { name: 'Arial', size: 7, bold: true, color: { argb: 'FFFFFFFF' } };
      cc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
      cc.alignment = { textRotation: 90, vertical: 'middle', horizontal: 'center' };
      cc.border = thinBorder;
    });
  }

  // TOTAL y % cabeceras mergeadas filas 5-6
  const setTailHdr = (col, label) => {
    ws.mergeCells(ROW_FECHA, col, ROW_CURSO, col);
    const c = ws.getCell(ROW_FECHA, col);
    c.value = label;
    c.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
    c.alignment = { vertical: 'middle', horizontal: 'center' };
    c.border = thinBorder;
  };
  setTailHdr(COL_TOTAL, 'TOTAL');
  setTailHdr(COL_PCT, '%');

  ws.getRow(ROW_FECHA).height = 22;
  ws.getRow(ROW_CURSO).height = 50;

  // ── Filas de estudiantes ──────────────────────────────────────────────────
  postulantes.forEach((post, idx) => {
    const rowNum = ROW_DATA_START + idx;
    const rowBg  = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF9FAFB';

    const setCell = (col, value, opts = {}) => {
      const c = ws.getCell(rowNum, col);
      c.value = value;
      c.font = { name: 'Arial', size: 8, ...opts.font };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: opts.bg || rowBg } };
      c.alignment = { vertical: 'middle', horizontal: opts.align || 'center', ...opts.alignment };
      c.border = thinBorder;
    };

    setCell(COL_N, idx + 1);
    setCell(COL_NOMBRE, `${post.APELLIDOS}, ${post.NOMBRES}`, { align: 'left', alignment: { indent: 1 } });
    setCell(COL_CARRERA, post.NOMBRE_CARRERA || '—', { align: 'left', alignment: { indent: 1 } });

    let totalAsistencias = 0;
    let totalSesionesContadas = 0;

    for (const fd of fechaCols) {
      fd.sesiones.forEach((ses, si) => {
        const estado = estadoMap.get(`${post.ID_POSTULANTE}_${ses.ID_SESION}`);
        const col  = fd.startCol + si;
        const cell = ws.getCell(rowNum, col);

        if (estado && ESTADO_COLOR[estado]) {
          const ec = ESTADO_COLOR[estado];
          cell.value = ec.label;
          cell.font  = { name: 'Arial', size: 8, bold: true, color: { argb: ec.fg } };
          cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: ec.bg } };
          totalSesionesContadas++;
          if (estado === 'ASISTIO' || estado === 'TARDANZA' || estado === 'JUSTIFICADO') {
            totalAsistencias++;
          }
        } else {
          cell.value = '—';
          cell.font  = { name: 'Arial', size: 8, color: { argb: 'FFD1D5DB' } };
          cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
        }
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = thinBorder;
      });
    }

    // TOTAL
    const totalCell = ws.getCell(rowNum, COL_TOTAL);
    totalCell.value = totalAsistencias;
    totalCell.font  = { name: 'Arial', size: 8, bold: true };
    totalCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
    totalCell.alignment = { vertical: 'middle', horizontal: 'center' };
    totalCell.border = thinBorder;

    // %
    const pct = totalSesionesContadas > 0
      ? Math.round((totalAsistencias / totalSesionesContadas) * 100) : 0;
    const pctCell = ws.getCell(rowNum, COL_PCT);
    pctCell.value = `${pct}%`;
    pctCell.font  = {
      name: 'Arial', size: 8, bold: true,
      color: { argb: pct >= 80 ? 'FF065F46' : pct >= 60 ? 'FF92400E' : 'FF991B1B' }
    };
    pctCell.fill = {
      type: 'pattern', pattern: 'solid',
      fgColor: { argb: pct >= 80 ? 'FFD1FAE5' : pct >= 60 ? 'FFFEF3C7' : 'FFFEE2E2' }
    };
    pctCell.alignment = { vertical: 'middle', horizontal: 'center' };
    pctCell.border = thinBorder;

    ws.getRow(rowNum).height = 16;
  });

  // ── Leyenda ───────────────────────────────────────────────────────────────
  const legendRow = ROW_DATA_START + postulantes.length + 1;
  ws.mergeCells(legendRow, COL_N, legendRow, COL_CARRERA + 4);
  const legCell = ws.getCell(legendRow, COL_N);
  legCell.value = 'Leyenda: A=Asistió  T=Tardanza  F=Falta  J=Justificado  —=Sin marcar';
  legCell.font  = { name: 'Arial', size: 8, italic: true, color: { argb: 'FF6B7280' } };
  legCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

  // Freeze: fijar columnas 1-3 y filas 1-6
  ws.views = [{ state: 'frozen', xSplit: 3, ySplit: ROW_CURSO, topLeftCell: 'D7' }];

  return true;
};

// ════════════════════════════════════════════════════════════════════════════
// EXPORTS PÚBLICOS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Exporta el registro de asistencia de 1 grupo.
 */
export const exportRegistroGrupo = async (grupo, idPeriodo) => {
  try {
    const asistencias = await selectAll('VW_ASISTENCIAS_POSTULANTE', {
      ID_GRUPO: grupo.ID_GRUPO
    });

    if (!asistencias || asistencias.length === 0) {
      alert('No hay registros de asistencia para este grupo en el período seleccionado');
      return;
    }

    const periodo = asistencias[0]?.NOMBRE_PERIODO || '';
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CEPRE UNAM';
    workbook.created = new Date();

    buildSheetForGrupo(workbook, grupo, periodo, asistencias);

    const fileName = `Asistencia_${(grupo.NOMBRE_GRUPO || grupo.CODIGO_GRUPO || 'Grupo').replace(/\s+/g, '_')}.xlsx`;
    await downloadWorkbook(workbook, fileName);
  } catch (error) {
    console.error('Error exportando registro grupo:', error);
    alert('Error al exportar: ' + error.message);
  }
};

/**
 * Exporta el registro de asistencia de todos los grupos de una sede.
 */
export const exportRegistroSedEstudiantes = async (sede, idPeriodo, grupos, onProgress) => {
  try {
    if (!grupos || grupos.length === 0) {
      alert('No hay grupos para exportar en esta sede');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CEPRE UNAM';
    workbook.created = new Date();

    let processed = 0;
    let added = 0;
    if (onProgress) onProgress(0, grupos.length);

    for (const grupo of grupos) {
      const asistencias = await selectAll('VW_ASISTENCIAS_POSTULANTE', {
        ID_GRUPO: grupo.ID_GRUPO
      });

      if (asistencias && asistencias.length > 0) {
        const periodo = asistencias[0]?.NOMBRE_PERIODO || '';
        buildSheetForGrupo(workbook, grupo, periodo, asistencias);
        added++;
      }

      processed++;
      if (onProgress) onProgress(processed, grupos.length);
    }

    if (added === 0) {
      alert('No se encontraron registros de asistencia para los grupos de esta sede');
      return;
    }

    const sedeNombre = sede?.NOMBRE_SEDE || 'Sede';
    const fileName = `Asistencia_Estudiantes_${sedeNombre.replace(/\s+/g, '_')}.xlsx`;
    await downloadWorkbook(workbook, fileName);
  } catch (error) {
    console.error('Error exportando registro sede estudiantes:', error);
    alert('Error al exportar: ' + error.message);
  }
};
