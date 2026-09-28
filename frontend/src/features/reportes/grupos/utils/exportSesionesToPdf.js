import { jsPDF } from 'jspdf';
import { db } from '@/shared/api';
import { fetchTurnosConBloques } from '../../shared/turnosData';
import { buildGrupoColumns, fetchGruposExportData, formatDateShort } from './gruposExportData';
import { sortBySedeArea } from './sedeArea';

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
  const blockColW = 34;
  const dataColW = (usableW - blockColW) / Math.max(columns.length, 1);
  const totalW = blockColW + dataColW * columns.length;
  const startX = marginL + (usableW - totalW) / 2;

  let y = 6;

  // ── Cabecera ──────────────────────────────────────────────────────────────
  const headerH = 9;
  filledRect(doc, startX, y, totalW, headerH, C_DARK_BLUE);
  centeredText(doc, 'CENTRO DE ESTUDIOS PREUNIVERSITARIO - UNAM', startX, y, totalW, headerH, 12, C_WHITE, true);
  y += headerH;

  filledRect(doc, startX, y, totalW, headerH, C_DARK_BLUE);
  centeredText(doc, `CICLO DE PREPARACIÓN ${(nombrePeriodo || '').toUpperCase()}`, startX, y, totalW, headerH, 11, C_WHITE, true);
  y += headerH;

  filledRect(doc, startX, y, totalW, headerH, C_BLUE);
  centeredText(doc, `HORARIO - ${sede ? sede + ' - ' : ''}${grupoNombre || 'Grupo'}`, startX, y, totalW, headerH, 12, C_WHITE, true);
  y += headerH;

  // ── Encabezado días ───────────────────────────────────────────────────────
  const dayH = 8;
  filledRect(doc, startX, y, blockColW, dayH * 2, C_BLUE);
  centeredText(doc, 'BLOQUE', startX, y, blockColW, dayH * 2, 9.5, C_WHITE, true);

  columns.forEach((col, idx) => {
    const cx = startX + blockColW + idx * dataColW;
    filledRect(doc, cx, y, dataColW, dayH, C_BLUE);
    centeredText(doc, col.weekdayName, cx, y, dataColW, dayH, 9, C_WHITE, true);
    filledRect(doc, cx, y + dayH, dataColW, dayH, C_BLUE);
    centeredText(doc, col.dates.map(formatDateShort).join(' / '), cx, y + dayH, dataColW, dayH, 7.5, C_WHITE, false);
  });
  y += dayH * 2;

  // ── Filas de bloques ──────────────────────────────────────────────────────
  // Calcular alturas dinámicas según contenido
  const breakH = 8;
  const classH = 21;

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
      centeredText(doc, `${cb.label}\n${cb.timeRange}`, startX, ry, blockColW, rh, 8, C_GRAY_TEXT, false);
    } else {
      ordenClase++;
      filledRect(doc, startX, ry, blockColW, rh, C_GRAY_LIGHT);
      centeredText(doc, `Bloque ${ordenClase}\n${cb.timeRange}`, startX, ry, blockColW, rh, 8.5, C_BLUE, true);
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
          centeredText(doc, cellLines, cx, ry, dataColW, runH, 8, C_DARK_TEXT, false);
        }
      } else if (sig === '__BREAK__') {
        filledRect(doc, cx, ry, dataColW, rh, C_GRAY_MED);
      } else {
        filledRect(doc, cx, ry, dataColW, rh, C_WHITE);
      }
    });
  }
};

// Doc de una página listo para guardar o empaquetar en ZIP.
export const buildGrupoPdfDoc = (nombreGrupo, sede, nombrePeriodo, columns, customBlocks, opts = {}) => {
  const orientation = getOrientation(columns);
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  drawHorarioPage(doc, nombreGrupo, sede, nombrePeriodo, columns, customBlocks, true, orientation, opts);
  return doc;
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
    const columns = buildGrupoColumns(sesiones, customBlocks, opts.agruparDias === true);
    if (columns.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    const sede = sesiones[0]?.NOMBRE_SEDE || 'Virtual';
    const doc = buildGrupoPdfDoc(grupoNombre, sede, nombrePeriodo, columns, customBlocks, opts);

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

    // Orden sede → área → código de grupo → páginas continuas ordenadas
    const ordered = sortBySedeArea(grupos.filter(g => g.ID_GRUPO != null));
    if (ordered.length === 0) return;

    const { sesionesPorGrupo, customBlocksByTurno } = await fetchGruposExportData(ordered);

    // ── Primera pasada: preparar cada página con su orientación ─────────
    const renderItems = [];
    for (const grupo of ordered) {
      const idGrupo = grupo.ID_GRUPO;
      if (!idGrupo) continue;
      const nombreGrupo = grupo.NOMBRE_GRUPO || grupo.CODIGO_GRUPO || `Grupo_${idGrupo}`;
      const sesiones = sesionesPorGrupo.get(idGrupo) || [];
      if (sesiones.length === 0) continue;

      const customBlocks = customBlocksByTurno.get(grupo.ID_TURNO)?.bloques;
      if (!customBlocks) continue;

      const columns = buildGrupoColumns(sesiones, customBlocks, opts.agruparDias === true);
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
