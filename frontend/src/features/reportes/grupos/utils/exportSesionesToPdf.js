import { jsPDF } from 'jspdf';
import { db } from '@/shared/api';
import { fetchTurnosConBloques } from '../../shared/turnosData';

const parseDate = (fechaStr) => {
  const [day, month, year] = fechaStr.split('/').map(Number);
  return new Date(year, month - 1, day);
};

const WEEKDAY_NAMES = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
const MONTH_NAMES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

const formatDateShort = (date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = MONTH_NAMES[date.getMonth()];
  return `${day}-${month}`;
};

// Colores en RGB
const C_DARK_BLUE  = [30, 58, 138];   // #1E3A8A
const C_BLUE       = [45, 54, 111];   // #2D366F
const C_WHITE      = [255, 255, 255];
const C_TEAL_LIGHT = [216, 241, 239]; // #D8F1EF
const C_GRAY_LIGHT = [243, 244, 246]; // #F3F4F6
const C_GRAY_MED   = [229, 231, 235]; // #E5E7EB
const C_GRAY_TEXT  = [107, 114, 128]; // #6B7280
const C_DARK_TEXT  = [31, 41, 55];    // #1F2937
const C_BORDER     = [180, 180, 180];

// ─── Helpers de dibujo ───────────────────────────────────────────────────────

const setFill = (doc, rgb) => doc.setFillColor(rgb[0], rgb[1], rgb[2]);
const setTextColor = (doc, rgb) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);
const setDrawColor = (doc, rgb) => doc.setDrawColor(rgb[0], rgb[1], rgb[2]);

const filledRect = (doc, x, y, w, h, fillRgb, borderRgb = C_BORDER) => {
  setFill(doc, fillRgb);
  setDrawColor(doc, borderRgb);
  doc.rect(x, y, w, h, 'FD');
};

const centeredText = (doc, text, x, y, w, h, fontSize, rgb, bold = false) => {
  doc.setFontSize(fontSize);
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  setTextColor(doc, rgb);
  const lines = doc.splitTextToSize(String(text), w - 2);
  const lineH = fontSize * 0.35;
  const totalH = lines.length * lineH;
  const startY = y + h / 2 - totalH / 2 + lineH * 0.8;
  lines.forEach((line, i) => {
    doc.text(line, x + w / 2, startY + i * lineH, { align: 'center' });
  });
};

// ─── Preparar datos de un grupo ──────────────────────────────────────────────

const prepareGrupoData = (sesiones, customBlocks, agruparDias) => {
  const sesionesPorFecha = new Map();
  for (const s of sesiones) {
    let fechaStr = s.FECHA;
    if (typeof fechaStr === 'string' && fechaStr.includes('T')) fechaStr = fechaStr.split('T')[0];
    if (!sesionesPorFecha.has(fechaStr)) sesionesPorFecha.set(fechaStr, []);
    sesionesPorFecha.get(fechaStr).push(s);
  }

  const dateInfos = [];
  for (const [fechaStr, sesionesDelDia] of sesionesPorFecha.entries()) {
    const date = parseDate(fechaStr.includes('/') ? fechaStr : fechaStr.split('-').reverse().join('/'));
    const weekday = date.getDay();
    const signature = customBlocks.map(cb => {
      if (cb.type === 'break') return '__BREAK__';
      const sesion = sesionesDelDia.find(s => s.ORDEN === cb.orden);
      if (sesion) return `${sesion.CODIGO_AREA || ''}|${sesion.NOMBRE_CURSO || ''}|${sesion.DOCENTE_NOMBRE_COMPLETO || ''}|${sesion.DOCENTE_DISPLAY || 'Sin docente'}`;
      return null;
    });
    const sigKey = signature.map(s => s === null ? '_' : s).join('||');
    dateInfos.push({ date, weekday, signature, sigKey });
  }

  const grouped = new Map();
  for (const info of dateInfos) {
    const groupKey = agruparDias ? `${info.weekday}__${info.sigKey}` : info.sigKey;
    if (!grouped.has(groupKey)) grouped.set(groupKey, { signature: info.signature, dates: [], weekday: info.weekday });
    grouped.get(groupKey).dates.push(info.date);
  }

  const columns = [];
  for (const g of grouped.values()) {
    g.dates.sort((a, b) => a - b);
    columns.push({ weekday: g.weekday, dates: g.dates, signature: g.signature });
  }
  columns.sort((a, b) => a.dates[0] - b.dates[0]);
  columns.forEach((col, i) => {
    col.weekdayName = agruparDias ? WEEKDAY_NAMES[col.weekday] : `DÍA ${i + 1}`;
  });
  return columns;
};

// ─── Dibujar una página de horario en el doc ─────────────────────────────────

// Pocos días (≤3) → vertical; más días → horizontal
const getOrientation = (columns) => (columns.length <= 3 ? 'portrait' : 'landscape');

const drawHorarioPage = (doc, grupoNombre, sede, nombrePeriodo, columns, customBlocks, isFirstPage, orientation, opts = {}) => {
  if (!isFirstPage) doc.addPage('a4', orientation);

  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();

  const marginL = 8;
  const marginR = 8;
  const usableW = PW - marginL - marginR;

  // Anchos de columna — las columnas de datos ocupan todo el ancho útil
  const blockColW = 28;
  const dataColW = (usableW - blockColW) / Math.max(columns.length, 1);
  const totalW = blockColW + dataColW * columns.length;
  const startX = marginL + (usableW - totalW) / 2;

  let y = 6;

  // ── Cabecera ──────────────────────────────────────────────────────────────
  const headerH = 7;
  filledRect(doc, startX, y, totalW, headerH, C_DARK_BLUE);
  centeredText(doc, 'CENTRO DE ESTUDIOS PREUNIVERSITARIO - UNAM', startX, y, totalW, headerH, 9, C_WHITE, true);
  y += headerH;

  filledRect(doc, startX, y, totalW, headerH, C_DARK_BLUE);
  centeredText(doc, `CICLO DE PREPARACIÓN ${(nombrePeriodo || '').toUpperCase()}`, startX, y, totalW, headerH, 8, C_WHITE, true);
  y += headerH;

  filledRect(doc, startX, y, totalW, headerH, C_BLUE);
  centeredText(doc, `HORARIO - ${sede ? sede + ' - ' : ''}${grupoNombre || 'Grupo'}`, startX, y, totalW, headerH, 9, C_WHITE, true);
  y += headerH;

  // ── Encabezado días ───────────────────────────────────────────────────────
  const dayH = 6;
  filledRect(doc, startX, y, blockColW, dayH * 2, C_BLUE);
  centeredText(doc, 'BLOQUE', startX, y, blockColW, dayH * 2, 7, C_WHITE, true);

  columns.forEach((col, idx) => {
    const cx = startX + blockColW + idx * dataColW;
    filledRect(doc, cx, y, dataColW, dayH, C_BLUE);
    centeredText(doc, col.weekdayName, cx, y, dataColW, dayH, 6.5, C_WHITE, true);
    filledRect(doc, cx, y + dayH, dataColW, dayH, C_BLUE);
    centeredText(doc, col.dates.map(formatDateShort).join(' / '), cx, y + dayH, dataColW, dayH, 5.5, C_WHITE, false);
  });
  y += dayH * 2;

  // ── Filas de bloques ──────────────────────────────────────────────────────
  // Calcular alturas dinámicas según contenido
  const breakH = 6;
  const classH = 16;

  // computeRuns por columna
  const computeRuns = (sig) => {
    const runs = [];
    let i = 0;
    while (i < sig.length) {
      if (!sig[i] || sig[i] === '__BREAK__' || sig[i] === null) { i++; continue; }
      let end = i;
      let j = i + 1;
      while (j < sig.length && sig[j] === sig[i]) { end = j; j++; }
      runs.push({ start: i, end, key: sig[i] });
      i = end + 1;
    }
    return runs;
  };

  const runsByCol = columns.map(col => computeRuns(col.signature));
  const findRun = (runs, i) => runs.find(r => i >= r.start && i <= r.end);

  // Pre-calcular alturas de filas
  const rowHeights = customBlocks.map(cb => cb.type === 'break' ? breakH : classH);

  // Pre-calcular posiciones Y de cada fila
  const rowYs = [];
  let yCursor = y;
  for (const h of rowHeights) { rowYs.push(yCursor); yCursor += h; }

  // Escalar si no cabe en la página
  const totalContentH = yCursor - y;
  const availH = PH - y - 6;
  const scaleY = totalContentH > availH ? availH / totalContentH : 1;

  let ordenClase = 0;
  for (let i = 0; i < customBlocks.length; i++) {
    const cb = customBlocks[i];
    const ry = y + (rowYs[i] - y) * scaleY;
    const rh = rowHeights[i] * scaleY;

    if (cb.type === 'break') {
      filledRect(doc, startX, ry, blockColW, rh, C_GRAY_MED);
      centeredText(doc, `${cb.label}\n${cb.timeRange}`, startX, ry, blockColW, rh, 5, C_GRAY_TEXT, false);
    } else {
      ordenClase++;
      filledRect(doc, startX, ry, blockColW, rh, C_GRAY_LIGHT);
      centeredText(doc, `Bloque ${ordenClase}\n${cb.timeRange}`, startX, ry, blockColW, rh, 5.5, C_BLUE, true);
    }

    columns.forEach((col, idx) => {
      const cx = startX + blockColW + idx * dataColW;
      const run = findRun(runsByCol[idx], i);
      const sig = col.signature[i];

      if (run) {
        if (i === run.start) {
          const runEndY = y + (rowYs[run.end] - y) * scaleY + rowHeights[run.end] * scaleY;
          const runH = runEndY - ry;
          filledRect(doc, cx, ry, dataColW, runH, C_TEAL_LIGHT);
          const [codigo, curso, nombreCompleto, docente] = run.key.split('|');
          const startB = customBlocks[run.start];
          const endB = customBlocks[run.end];
          const timeRange = `${startB.time} - ${endB.endTime}`;
          const cellParts = [];
          if (opts.showCodigo !== false && codigo) cellParts.push(`${codigo} ${curso}`);
          else cellParts.push(curso);
          if (opts.showNombreDocente !== false && nombreCompleto) cellParts.push(nombreCompleto);
          if (opts.showDocente !== false) cellParts.push(docente);
          if (opts.showHorario !== false) cellParts.push(timeRange);
          const cellLines = cellParts.filter(Boolean).join('\n');
          centeredText(doc, cellLines, cx, ry, dataColW, runH, 5, C_DARK_TEXT, false);
        }
      } else if (sig === '__BREAK__') {
        filledRect(doc, cx, ry, dataColW, rh, C_GRAY_MED);
      } else {
        filledRect(doc, cx, ry, dataColW, rh, C_WHITE);
      }
    });
  }
};

// ─── Fetch datos de un grupo ─────────────────────────────────────────────────
// 2 queries: sesiones del grupo + JOIN TURNOS×TURNO_BLOQUES.
// idTurno viene de VW_GRUPOS vía opts (fallback: el que trae la vista).

const fetchGrupoData = async (idGrupo, idTurno) => {
  const sesionesResult = await db.select('VW_SESIONES_AGRUPADAS_DESGLOSE', { ID_GRUPO: idGrupo });
  const sesiones = sesionesResult?.data?.records || sesionesResult || [];
  if (sesiones.length === 0) return null;

  const turnoId = idTurno ?? sesiones.find(s => s.ID_TURNO != null)?.ID_TURNO;
  if (turnoId == null) return null;

  const turnosMap = await fetchTurnosConBloques([turnoId]);
  const customBlocks = turnosMap.get(turnoId)?.bloques || [];
  if (customBlocks.length === 0) return null;

  return { sesiones, customBlocks, nombrePeriodo: sesiones[0]?.NOMBRE_PERIODO || '' };
};

// ════════════════════════════════════════════════════════════════════════════
// EXPORTS PÚBLICOS
// ════════════════════════════════════════════════════════════════════════════

export const exportSesionesToPdf = async (idGrupo, grupoNombre, opts = {}) => {
  try {
    const data = await fetchGrupoData(idGrupo, opts.idTurno);
    if (!data) {
      alert('No hay sesiones programadas para exportar');
      return;
    }
    const { sesiones, customBlocks, nombrePeriodo } = data;
    const columns = prepareGrupoData(sesiones, customBlocks, opts.agruparDias === true);
    if (columns.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    const orientation = getOrientation(columns);
    const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
    const sede = sesiones[0]?.NOMBRE_SEDE || 'Virtual';
    drawHorarioPage(doc, grupoNombre, sede, nombrePeriodo, columns, customBlocks, true, orientation, opts);

    const fileName = `Horario_${grupoNombre || 'Grupo'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error('Error exportando PDF:', error);
    alert('Error al exportar PDF: ' + error.message);
  }
};

export const exportAllSesionesToPdf = async (grupos, opts = {}) => {
  try {
    if (!grupos || grupos.length === 0) {
      alert('No hay grupos para exportar');
      return;
    }

    const grupoIds = grupos.map(g => g.ID_GRUPO).filter(Boolean);
    if (grupoIds.length === 0) return;

    // ── 1. Sesiones por grupo (OPTIMIZADO: 1 query con IN) ───────────────
    const sesionesPorGrupo = new Map();
    if (grupoIds.length > 0) {
      const placeholders = grupoIds.map((_, i) => `$${i + 1}`).join(',');
      const allSesiones = await db.rawSelect(
        `SELECT * FROM "VW_SESIONES_AGRUPADAS_DESGLOSE" WHERE "ID_GRUPO" IN (${placeholders})`,
        ...grupoIds
      );
      for (const s of allSesiones) {
        const gid = s.ID_GRUPO;
        if (!sesionesPorGrupo.has(gid)) sesionesPorGrupo.set(gid, []);
        sesionesPorGrupo.get(gid).push(s);
      }
    }

    // ── 2. Turnos + bloques en 1 query JOIN ────────────────────────────────
    // Los records de VW_GRUPOS ya traen ID_TURNO — sin query extra a GRUPOS
    const turnoIds = [...new Set(grupos.map(g => g.ID_TURNO).filter(v => v != null))];
    const customBlocksByTurno = await fetchTurnosConBloques(turnoIds);

    // ── Primera pasada: preparar cada página con su orientación ─────────
    const renderItems = [];
    for (const grupo of grupos) {
      const idGrupo = grupo.ID_GRUPO;
      if (!idGrupo) continue;
      const nombreGrupo = grupo.NOMBRE_GRUPO || grupo.CODIGO_GRUPO || `Grupo_${idGrupo}`;
      const sesiones = sesionesPorGrupo.get(idGrupo) || [];
      if (sesiones.length === 0) continue;

      const customBlocks = customBlocksByTurno.get(grupo.ID_TURNO)?.bloques;
      if (!customBlocks) continue;

      const columns = prepareGrupoData(sesiones, customBlocks, opts.agruparDias === true);
      if (columns.length === 0) continue;

      const nombrePeriodo = sesiones[0]?.NOMBRE_PERIODO || '';
      const sede = sesiones[0]?.NOMBRE_SEDE || 'Virtual';
      renderItems.push({ nombreGrupo, sede, nombrePeriodo, columns, customBlocks, orientation: getOrientation(columns) });
    }

    if (renderItems.length === 0) {
      alert('No se encontraron grupos con sesiones para exportar');
      return;
    }

    // ── Segunda pasada: dibujar cada página ──────────────────────────────
    const doc = new jsPDF({ orientation: renderItems[0].orientation, unit: 'mm', format: 'a4' });
    renderItems.forEach((item, i) => {
      drawHorarioPage(doc, item.nombreGrupo, item.sede, item.nombrePeriodo, item.columns, item.customBlocks, i === 0, item.orientation, opts);
    });

    const fileName = `Horarios_Grupos_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error('Error exportando PDF todos los grupos:', error);
    alert('Error al exportar PDF: ' + error.message);
  }
};
