import { jsPDF } from 'jspdf';
import { db } from '@/shared/api';

const PAGE_SIZE = 1000;

const selectAll = async (table, filters = {}) => {
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

const prepareGrupoData = (sesiones, customBlocks) => {
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
    if (!grouped.has(info.weekday)) grouped.set(info.weekday, new Map());
    const byWeekday = grouped.get(info.weekday);
    if (!byWeekday.has(info.sigKey)) byWeekday.set(info.sigKey, { signature: info.signature, dates: [] });
    byWeekday.get(info.sigKey).dates.push(info.date);
  }

  const columns = [];
  for (const [wd, byWeekday] of grouped.entries()) {
    for (const g of byWeekday.values()) {
      g.dates.sort((a, b) => a - b);
      columns.push({ weekday: wd, weekdayName: WEEKDAY_NAMES[wd], dates: g.dates, signature: g.signature });
    }
  }
  columns.sort((a, b) => a.dates[0] - b.dates[0]);
  return columns;
};

// ─── Dibujar una página de horario en el doc ─────────────────────────────────

const drawHorarioPage = (doc, grupoNombre, nombrePeriodo, columns, customBlocks, isFirstPage) => {
  if (!isFirstPage) doc.addPage('a4', 'landscape');

  const PW = doc.internal.pageSize.getWidth();   // 297
  const PH = doc.internal.pageSize.getHeight();  // 210

  const marginL = 8;
  const marginR = 8;
  const usableW = PW - marginL - marginR;

  // Anchos de columna
  const blockColW = 28;
  const dataColW = Math.min(34, (usableW - blockColW) / Math.max(columns.length, 1));
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
  centeredText(doc, `HORARIO - ${grupoNombre || 'Grupo'}`, startX, y, totalW, headerH, 9, C_WHITE, true);
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
          const cellLines = [codigo ? `${codigo} ${curso}` : curso, nombreCompleto, docente, timeRange].filter(Boolean).join('\n');
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
// NOTA: Para export individual, las queries son necesariamente por ID único
// El modo bulk (exportAllSesionesToPdf) ya está optimizado con queries batch

const fetchGrupoData = async (idGrupo) => {
  const sesionesResult = await db.select('VW_SESIONES_AGRUPADAS_DESGLOSE', { ID_GRUPO: idGrupo });
  const sesiones = sesionesResult?.data?.records || sesionesResult || [];
  if (sesiones.length === 0) return null;

  const grupoResult = await db.select('GRUPOS', { ID_GRUPO: idGrupo });
  const grupo = (grupoResult?.data?.records || grupoResult)?.[0];
  if (!grupo) return null;

  const turnoResult = await db.select('TURNOS', { ID_TURNO: grupo.ID_TURNO });
  const turno = (turnoResult?.data?.records || turnoResult)?.[0];
  if (!turno) return null;

  const horarioResult = await db.select('HORARIOS', { ID_HORARIO: turno.ID_HORARIO });
  const horario = (horarioResult?.data?.records || horarioResult)?.[0];

  const bloquesResult = await db.select('HORARIO_BLOQUES', { ID_HORARIO: turno.ID_HORARIO });
  const bloques = (bloquesResult?.data?.records || bloquesResult || []).sort((a, b) => a.ORDEN - b.ORDEN);
  if (bloques.length === 0) return null;

  const _hInit = (horario?.HORA_INICIO_JORNADA || '07:00').split(':').map(Number);
  let currentMinute = (isNaN(_hInit[0]) ? 7 : _hInit[0]) * 60 + (isNaN(_hInit[1]) ? 0 : _hInit[1]);
  const fmt = (h, m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

  const customBlocks = bloques.map(b => {
    const hour = Math.floor(currentMinute / 60);
    const minute = currentMinute % 60;
    const endMinuteTotal = currentMinute + (b.DURACION || 50);
    const endHour = Math.floor(endMinuteTotal / 60);
    const endMinute = endMinuteTotal % 60;
    const timeRange = `${fmt(hour, minute)} - ${fmt(endHour, endMinute)}`;
    currentMinute = endMinuteTotal;
    return {
      idBloque: b.ID_BLOQUE,
      duration: b.DURACION || 50,
      type: b.TIPO_BLOQUE?.toLowerCase() || 'clase',
      label: b.ETIQUETA || `Bloque ${b.ORDEN}`,
      orden: b.ORDEN,
      time: fmt(hour, minute),
      endTime: fmt(endHour, endMinute),
      timeRange
    };
  });

  return { sesiones, customBlocks, nombrePeriodo: sesiones[0]?.NOMBRE_PERIODO || '' };
};

// ════════════════════════════════════════════════════════════════════════════
// EXPORTS PÚBLICOS
// ════════════════════════════════════════════════════════════════════════════

export const exportSesionesToPdf = async (idGrupo, grupoNombre) => {
  try {
    const data = await fetchGrupoData(idGrupo);
    if (!data) {
      alert('No hay sesiones programadas para exportar');
      return;
    }
    const { sesiones, customBlocks, nombrePeriodo } = data;
    const columns = prepareGrupoData(sesiones, customBlocks);
    if (columns.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    drawHorarioPage(doc, grupoNombre, nombrePeriodo, columns, customBlocks, true);

    const fileName = `Horario_${grupoNombre || 'Grupo'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error('Error exportando PDF:', error);
    alert('Error al exportar PDF: ' + error.message);
  }
};

export const exportAllSesionesToPdf = async (grupos) => {
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

    // ── 2. GRUPOS completa → filtrar en memoria ───────────────────────────
    const grupoIdsSet = new Set(grupoIds);
    const allGruposRows = await selectAll('GRUPOS');
    const gruposMap = new Map();
    for (const r of allGruposRows) {
      if (grupoIdsSet.has(r.ID_GRUPO)) gruposMap.set(r.ID_GRUPO, r);
    }

    // ── 3. TURNOS completa → filtrar en memoria ────────────────────────────
    const turnoIdsSet = new Set([...gruposMap.values()].map(g => g.ID_TURNO).filter(Boolean));
    const allTurnosRows = await selectAll('TURNOS');
    const turnosMap = new Map();
    for (const r of allTurnosRows) {
      if (turnoIdsSet.has(r.ID_TURNO)) turnosMap.set(r.ID_TURNO, r);
    }

    // ── 4. HORARIOS + BLOQUES completas → filtrar en memoria ──────────────
    const horarioIdsSet = new Set([...turnosMap.values()].map(t => t.ID_HORARIO).filter(Boolean));
    const allHorariosRows = await selectAll('HORARIOS');
    const horariosMap = new Map();
    for (const r of allHorariosRows) {
      if (horarioIdsSet.has(r.ID_HORARIO)) horariosMap.set(r.ID_HORARIO, r);
    }

    const allBloquesRows = await selectAll('HORARIO_BLOQUES');
    const bloquesMap = new Map();
    for (const r of allBloquesRows) {
      if (horarioIdsSet.has(r.ID_HORARIO)) {
        if (!bloquesMap.has(r.ID_HORARIO)) bloquesMap.set(r.ID_HORARIO, []);
        bloquesMap.get(r.ID_HORARIO).push(r);
      }
    }
    for (const [k, v] of bloquesMap) bloquesMap.set(k, v.sort((a, b) => a.ORDEN - b.ORDEN));

    const customBlocksByTurno = new Map();
    for (const [turnoId, turno] of turnosMap) {
      if (!turno.ID_HORARIO) continue;
      const horario = horariosMap.get(turno.ID_HORARIO);
      const bloques = bloquesMap.get(turno.ID_HORARIO) || [];
      if (bloques.length === 0) continue;
      const _hInit = (horario?.HORA_INICIO_JORNADA || '07:00').split(':').map(Number);
      let currentMinute = (isNaN(_hInit[0]) ? 7 : _hInit[0]) * 60 + (isNaN(_hInit[1]) ? 0 : _hInit[1]);
      const fmt = (h, m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const customBlocks = bloques.map(b => {
        const hour = Math.floor(currentMinute / 60);
        const minute = currentMinute % 60;
        const endMinuteTotal = currentMinute + (b.DURACION || 50);
        const endHour = Math.floor(endMinuteTotal / 60);
        const endMinute = endMinuteTotal % 60;
        const timeRange = `${fmt(hour, minute)} - ${fmt(endHour, endMinute)}`;
        currentMinute = endMinuteTotal;
        return {
          idBloque: b.ID_BLOQUE, duration: b.DURACION || 50,
          type: b.TIPO_BLOQUE?.toLowerCase() || 'clase',
          label: b.ETIQUETA || `Bloque ${b.ORDEN}`,
          orden: b.ORDEN, time: fmt(hour, minute), endTime: fmt(endHour, endMinute), timeRange
        };
      });
      customBlocksByTurno.set(turnoId, customBlocks);
    }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    let isFirst = true;
    let added = 0;

    for (const grupo of grupos) {
      const idGrupo = grupo.ID_GRUPO;
      if (!idGrupo) continue;
      const nombreGrupo = grupo.NOMBRE_GRUPO || grupo.CODIGO_GRUPO || `Grupo_${idGrupo}`;
      const sesiones = sesionesPorGrupo.get(idGrupo) || [];
      if (sesiones.length === 0) continue;

      const grupoInfo = gruposMap.get(idGrupo);
      if (!grupoInfo) continue;
      const turno = turnosMap.get(grupoInfo.ID_TURNO);
      if (!turno) continue;
      const customBlocks = customBlocksByTurno.get(turno.ID_TURNO);
      if (!customBlocks) continue;

      const columns = prepareGrupoData(sesiones, customBlocks);
      if (columns.length === 0) continue;

      const nombrePeriodo = sesiones[0]?.NOMBRE_PERIODO || '';
      drawHorarioPage(doc, nombreGrupo, nombrePeriodo, columns, customBlocks, isFirst);
      isFirst = false;
      added++;
    }

    if (added === 0) {
      alert('No se encontraron grupos con sesiones para exportar');
      return;
    }

    const fileName = `Horarios_Grupos_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error('Error exportando PDF todos los grupos:', error);
    alert('Error al exportar PDF: ' + error.message);
  }
};
