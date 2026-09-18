import { jsPDF } from 'jspdf';
import { db } from '@/shared/api';
import { buildBulkCache, fetchPlazasPeriodo } from './exportPlazaToExcel';
import { fetchSesionesContext } from '../../shared/turnosData';

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

// Colores RGB
const C_BLUE       = [45, 54, 111];
const C_WHITE      = [255, 255, 255];
const C_TEAL_LIGHT = [216, 241, 239];
const C_GRAY_LIGHT = [243, 244, 246];
const C_GRAY_MED   = [229, 231, 235];
const C_GRAY_TEXT  = [107, 114, 128];
const C_DARK_TEXT  = [31, 41, 55];
const C_BORDER     = [180, 180, 180];
const C_SEP        = [45, 54, 111];

const setFill      = (doc, rgb) => doc.setFillColor(rgb[0], rgb[1], rgb[2]);
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

// ─── Filtrar sesiones por turno ─────────────────────────────────────────────
// La vista expone ID_TURNO por sesión; el fallback por mapas cubre filas sin él
const filterSesionesByTurnoPdf = (sesiones, turnoId, gpcToGrupo, grupoToTurno) => {
  return sesiones.filter(s => {
    if (s.ID_TURNO != null) return s.ID_TURNO === turnoId;
    const grupoId = gpcToGrupo.get(s.ID_GRUPO_PLAN_CURSO) ?? (s.ID_GRUPO || null);
    return grupoId && grupoToTurno.get(grupoId) === turnoId;
  });
};

// ─── Calcular columnas para un turno ────────────────────────────────────────
// agruparDias = true  → separa por día de semana + patrón (headers LUNES, SÁBADO...)
// agruparDias = false → separa solo por patrón (headers DÍA 1, DÍA 2...)
const buildColumnsPdf = (sesiones, allBlocks, programacionToGrupo, gpcToGrupo, grupoToTurno, agruparDias = true) => {
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
    const sesionesConTurno = sesionesDelDia.map(s => {
      let turnoId = s.ID_TURNO ?? null;
      if (turnoId == null) {
        let grupoId = null;
        if (s.ID_PROGRAMACION && programacionToGrupo.has(s.ID_PROGRAMACION)) grupoId = programacionToGrupo.get(s.ID_PROGRAMACION);
        if (!grupoId && s.ID_GRUPO_PLAN_CURSO && gpcToGrupo.has(s.ID_GRUPO_PLAN_CURSO)) grupoId = gpcToGrupo.get(s.ID_GRUPO_PLAN_CURSO);
        turnoId = grupoId ? grupoToTurno.get(grupoId) : null;
      }
      return { ...s, turnoId };
    });
    const signature = allBlocks.map(cb => {
      if (cb.type === 'break') return '__BREAK__';
      const sesion = sesionesConTurno.find(s => s.ORDEN === cb.orden && s.turnoId === cb.turnoId);
      if (sesion) return `${sesion.CODIGO_AREA || ''}|${sesion.NOMBRE_CURSO || ''}|${sesion.DOCENTE_NOMBRE_COMPLETO || ''}|${sesion.DOCENTE_DISPLAY || 'Sin docente'}|${cb.turnoNombre}|${sesion.NOMBRE_GRUPO || ''}`;
      return null;
    });
    const sigKey = signature.map(s => s === null ? '_' : s).join('||');
    dateInfos.push({ date, weekday, signature, sigKey });
  }

  const grouped = new Map();
  for (const info of dateInfos) {
    const groupKey = agruparDias ? `${info.weekday}__${info.sigKey}` : info.sigKey;
    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, { weekday: info.weekday, signature: info.signature, dates: [] });
    }
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

// ─── Datos por turno de una plaza ───────────────────────────────────────────

// Pocos días (≤3) → vertical; más días → horizontal
const getOrientation = (columns) => (columns.length <= 3 ? 'portrait' : 'landscape');

const computeTurnosData = (sesiones, resolvedLookups, opts = {}) => {
  const { programacionToGrupo, gpcToGrupo, grupoToTurno, turnosConBloques } = resolvedLookups;
  const turnosData = [];
  for (const turno of turnosConBloques) {
    const sesT = filterSesionesByTurnoPdf(sesiones, turno.turnoId, gpcToGrupo, grupoToTurno);
    const allBlocks = turno.bloques.map(b => ({ ...b, turnosLabel: turno.turnoNombre }));
    const columns = buildColumnsPdf(sesT, allBlocks, programacionToGrupo, gpcToGrupo, grupoToTurno, opts.agruparDias === true);
    if (columns.length > 0) turnosData.push({ turno, allBlocks, columns });
  }
  return turnosData;
};

// ─── Dibujar hojas de una plaza: UNA PÁGINA POR TURNO ───────────────────────
// Cada turno puede tener bloques/horas distintos, por eso nunca se juntan.

const drawPlazaPage = (doc, nombrePlaza, sesiones, turnosData, isFirstPage, opts = {}) => {
  const s0 = sesiones[0] || {};
  const nombreDocente = s0.DOCENTE_NOMBRE_COMPLETO || 'Docente no asignado';
  const docenteEmail = s0.DOCENTE_EMAIL || '';
  const docenteTelefono = s0.DOCENTE_TELEFONO || '';
  const periodo = s0.NOMBRE_PERIODO || '';
  const sede    = s0.NOMBRE_SEDE    || '';
  const curso   = s0.NOMBRE_CURSO   || '';

  const totalHojas = turnosData.length;
  let first = isFirstPage;

  const computeRuns = (sig) => {
    const runs = [];
    let i = 0;
    while (i < sig.length) {
      const s = sig[i];
      if (!s || s === '__BREAK__' || s === null) { i++; continue; }
      let end = i, j = i + 1;
      while (j < sig.length) {
        const sj = sig[j];
        if (sj === '__BREAK__') break;
        if (sj === s) { end = j; j++; } else break;
      }
      runs.push({ start: i, end, key: s });
      i = end + 1;
    }
    return runs;
  };

  for (let ti = 0; ti < turnosData.length; ti++) {
    const { turno, allBlocks, columns } = turnosData[ti];
    const orientation = getOrientation(columns);

    if (!first) doc.addPage('a4', orientation);
    first = false;

    const PW = doc.internal.pageSize.getWidth();
    const PH = doc.internal.pageSize.getHeight();
    const marginL = 8;
    const marginR = 8;
    const usableW = PW - marginL - marginR;

    // Columnas de datos a ancho completo
    const blockColW = 30;
    const dataColW = (usableW - blockColW) / Math.max(columns.length, 1);
    const totalW = blockColW + dataColW * columns.length;
    const startX = marginL + (usableW - totalW) / 2;

    let y = 6;

    // Indicador de hoja, arriba a la derecha
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    setTextColor(doc, C_GRAY_TEXT);
    doc.text(`Hoja ${ti + 1} de ${totalHojas}`, marginL + usableW, y + 2, { align: 'right' });
    y += 3;

    // ── Header general ────────────────────────────────────────────────────
    const headerH = 7;
    filledRect(doc, startX, y, totalW, headerH, C_BLUE);
    centeredText(doc, `HORARIO - ${nombrePlaza || 'Docente'}`, startX, y, totalW, headerH, 9, C_WHITE, true);
    y += headerH;

    const infoH1 = 5;
    filledRect(doc, startX, y, totalW, infoH1, C_GRAY_LIGHT, C_BORDER);
    doc.setFontSize(7); doc.setFont('helvetica', 'bold'); setTextColor(doc, C_DARK_TEXT);
    const contactoInfo = [docenteEmail && `Email: ${docenteEmail}`, docenteTelefono && `Tel: ${docenteTelefono}`].filter(Boolean).join('   |   ');
    doc.text(`Docente: ${nombreDocente}${contactoInfo ? '   |   ' + contactoInfo : ''}`, startX + 3, y + infoH1 * 0.65);
    y += infoH1;

    const infoH2 = 4.5;
    filledRect(doc, startX, y, totalW, infoH2, [250, 250, 250], C_BORDER);
    const metaLine = [periodo && `Período: ${periodo}`, sede && `Sede: ${sede}`, curso && `Curso: ${curso}`].filter(Boolean).join('   |   ');
    doc.setFontSize(6); doc.setFont('helvetica', 'normal'); setTextColor(doc, C_GRAY_TEXT);
    doc.text(metaLine, startX + 3, y + infoH2 * 0.7);
    y += infoH2;

    // ── Título del turno ──────────────────────────────────────────────────
    const turnoH = 6;
    filledRect(doc, startX, y, totalW, turnoH, [30, 58, 138], [30, 58, 138]);
    centeredText(doc, `—  ${turno.turnoNombre}  —`, startX, y, totalW, turnoH, 7, C_WHITE, true);
    y += turnoH;

    // Encabezado de días
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

    const runsByCol = columns.map(col => computeRuns(col.signature));
    const findRun = (runs, i) => runs.find(r => i >= r.start && i <= r.end);

    const breakH = 5;
    const classH = 15;
    const rowHeights = allBlocks.map(cb => cb.type === 'break' ? breakH : classH);

    const rowYs = [];
    let yCursor = y;
    for (const h of rowHeights) { rowYs.push(yCursor); yCursor += h; }

    const totalContentH = yCursor - y;
    const availH = PH - y - 6;
    const scaleY = totalContentH > availH ? availH / totalContentH : 1;

    let ordenClase = 0;
    for (let i = 0; i < allBlocks.length; i++) {
      const cb = allBlocks[i];
      const ry = y + (rowYs[i] - y) * scaleY;
      const rh = rowHeights[i] * scaleY;

      if (cb.type === 'break') {
        filledRect(doc, startX, ry, blockColW, rh, C_GRAY_MED);
        centeredText(doc, `${cb.label}\n${cb.timeRange}`, startX, ry, blockColW, rh, 4.5, C_GRAY_TEXT, false);
      } else {
        ordenClase++;
        filledRect(doc, startX, ry, blockColW, rh, C_GRAY_LIGHT);
        centeredText(doc, `Bloque ${ordenClase}\n${cb.timeRange}`, startX, ry, blockColW, rh, 4.5, C_BLUE, true);
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
            const [codigo, curso, nombreCompleto, docente, , grupo] = run.key.split('|');
            const startB = allBlocks[run.start];
            const endB = allBlocks[run.end];
            const timeRange = startB.time && endB.endTime ? `${startB.time} - ${endB.endTime}` : '';
            const cellLines = [codigo ? `${codigo} ${curso}` : curso, grupo, nombreCompleto, docente, timeRange].filter(Boolean).join('\n');
            centeredText(doc, cellLines, cx, ry, dataColW, runH, 4.5, C_DARK_TEXT, false);
          }
        } else if (sig === '__BREAK__') {
          filledRect(doc, cx, ry, dataColW, rh, C_GRAY_MED);
        } else {
          filledRect(doc, cx, ry, dataColW, rh, C_WHITE);
        }
      });
    }
  }
};

// ─── Resolver lookups para plaza individual ─────────────────────────────────
// 1 query JOIN TURNOS×TURNO_BLOQUES vía helper compartido.

const resolveIndividual = fetchSesionesContext;

// ─── Resolver lookups desde cache bulk ──────────────────────────────────────

const resolveFromCache = (sesiones, cache) => {
  const { gpcToGrupo, grupoToTurno, turnosConBloquesMap } = cache;
  const programacionToGrupo = new Map();
  const localTurnoIds = new Set();
  for (const s of sesiones) {
    if (s.ID_PROGRAMACION && s.ID_GRUPO) programacionToGrupo.set(s.ID_PROGRAMACION, s.ID_GRUPO);
    if (s.ID_TURNO != null) localTurnoIds.add(s.ID_TURNO);
  }

  const turnosConBloques = [...localTurnoIds].map(tid => turnosConBloquesMap.get(tid)).filter(Boolean);
  return { programacionToGrupo, gpcToGrupo, grupoToTurno, turnosConBloques };
};

// ════════════════════════════════════════════════════════════════════════════
// EXPORTS PÚBLICOS
// ════════════════════════════════════════════════════════════════════════════

// Construye el documento jsPDF de una plaza usando el cache bulk (sin descargar)
export const buildPlazaPdfDoc = (idPlaza, nombrePlaza, cache, opts = {}) => {
  const sesiones = cache.sesionesPorPlaza.get(idPlaza) || [];
  if (sesiones.length === 0) return null;

  const lookups = resolveFromCache(sesiones, cache);
  const turnosData = computeTurnosData(sesiones, lookups, opts);
  if (turnosData.length === 0) return null;

  const doc = new jsPDF({ orientation: getOrientation(turnosData[0].columns), unit: 'mm', format: 'a4' });
  drawPlazaPage(doc, nombrePlaza, sesiones, turnosData, true, opts);
  return doc;
};

export const exportPlazaToPdf = async (idPlaza, nombrePlaza, opts = {}) => {
  try {
    const sesionesResult = await db.select('VW_SESIONES_AGRUPADAS_DESGLOSE', { ID_PLAZA_DOCENTE: idPlaza });
    const sesiones = sesionesResult?.data?.records || sesionesResult || [];
    if (sesiones.length === 0) {
      alert('No hay sesiones programadas para esta plaza');
      return;
    }

    const lookups = await resolveIndividual(sesiones);
    if (!lookups || lookups.turnosConBloques.length === 0) {
      alert('No se encontraron datos de horario para esta plaza');
      return;
    }

    const turnosData = computeTurnosData(sesiones, lookups, opts);
    if (turnosData.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    const doc = new jsPDF({ orientation: getOrientation(turnosData[0].columns), unit: 'mm', format: 'a4' });
    drawPlazaPage(doc, nombrePlaza, sesiones, turnosData, true, opts);
    doc.save(`Horario_${nombrePlaza || 'Plaza'}_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Error exportando plaza PDF:', error);
    alert('Error al exportar PDF: ' + error.message);
  }
};

export const exportSedeToPdf = async (idSede, nombreSede, idPeriodo, onProgress, opts = {}) => {
  try {
    const plazas = await fetchPlazasPeriodo(idPeriodo, idSede);

    if (plazas.length === 0) {
      alert('No hay plazas docentes para esta sede');
      return;
    }

    if (onProgress) onProgress(0, plazas.length);
    const cache = await buildBulkCache(idPeriodo, plazas.map(p => p.ID_PLAZA_DOCENTE));
    if (!cache) {
      alert('No se encontraron sesiones para el período');
      return;
    }

    // ── Primera pasada: resolver turnosData de cada plaza ─────────────────
    const sheets = [];
    let processed = 0;
    for (const plaza of plazas) {
      const sesiones = cache.sesionesPorPlaza.get(plaza.ID_PLAZA_DOCENTE) || [];
      processed++;
      if (sesiones.length === 0) { if (onProgress) onProgress(processed, plazas.length); continue; }

      const lookups = resolveFromCache(sesiones, cache);
      const turnosData = computeTurnosData(sesiones, lookups, opts);
      if (turnosData.length === 0) { if (onProgress) onProgress(processed, plazas.length); continue; }

      sheets.push({ nombrePlaza: plaza.IDENTIFICADOR_DOCENTE, sesiones, turnosData });
      if (onProgress) onProgress(processed, plazas.length);
    }

    if (sheets.length === 0) {
      alert('No se encontraron sesiones para ninguna plaza de esta sede');
      return;
    }

    // ── Segunda pasada: dibujar (cada turno es su propia hoja) ────────────
    const doc = new jsPDF({ orientation: getOrientation(sheets[0].turnosData[0].columns), unit: 'mm', format: 'a4' });
    let isFirst = true;
    for (const sheet of sheets) {
      drawPlazaPage(doc, sheet.nombrePlaza, sheet.sesiones, sheet.turnosData, isFirst, opts);
      isFirst = false;
    }

    doc.save(`Horarios_${nombreSede || 'Sede'}_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Error exportando sede PDF:', error);
    alert('Error al exportar PDF: ' + error.message);
  }
};

export const exportAllPlazasToPdf = async (idPeriodo, onProgress, opts = {}) => {
  try {
    const plazas = await fetchPlazasPeriodo(idPeriodo);

    if (plazas.length === 0) {
      alert('No hay plazas docentes para el período seleccionado');
      return;
    }

    if (onProgress) onProgress(0, plazas.length);
    const cache = await buildBulkCache(idPeriodo, plazas.map(p => p.ID_PLAZA_DOCENTE));
    if (!cache) {
      alert('No se encontraron sesiones para el período');
      return;
    }

    // ── Primera pasada: resolver turnosData de cada plaza ─────────────────
    const sheets = [];
    let processed = 0;

    for (const plaza of plazas) {
      const sesiones = cache.sesionesPorPlaza.get(plaza.ID_PLAZA_DOCENTE) || [];
      processed++;
      if (sesiones.length === 0) { if (onProgress) onProgress(processed, plazas.length); continue; }

      const lookups = resolveFromCache(sesiones, cache);
      const turnosData = computeTurnosData(sesiones, lookups, opts);
      if (turnosData.length === 0) { if (onProgress) onProgress(processed, plazas.length); continue; }

      sheets.push({ nombrePlaza: plaza.IDENTIFICADOR_DOCENTE, sesiones, turnosData });
      if (onProgress) onProgress(processed, plazas.length);
    }

    if (sheets.length === 0) {
      alert('No se encontraron sesiones para ninguna plaza del período');
      return;
    }

    // ── Segunda pasada: dibujar (cada turno es su propia hoja) ────────────
    const doc = new jsPDF({ orientation: getOrientation(sheets[0].turnosData[0].columns), unit: 'mm', format: 'a4' });
    let isFirst = true;
    for (const sheet of sheets) {
      drawPlazaPage(doc, sheet.nombrePlaza, sheet.sesiones, sheet.turnosData, isFirst, opts);
      isFirst = false;
    }

    doc.save(`Horarios_Todas_Plazas_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Error exportando todas las plazas PDF:', error);
    alert('Error al exportar PDF: ' + error.message);
  }
};
