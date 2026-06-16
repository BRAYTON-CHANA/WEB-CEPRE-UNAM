import { jsPDF } from 'jspdf';
import { db } from '@/shared/api';
import { buildBulkCache } from './exportPlazaToExcel';

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

// ─── Preparar columnas de una plaza ─────────────────────────────────────────

const preparePlazaData = (sesiones, allBlocks, programacionToGrupo, gpcToGrupo, grupoToTurno) => {
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
      let grupoId = null;
      if (s.ID_PROGRAMACION && programacionToGrupo.has(s.ID_PROGRAMACION)) grupoId = programacionToGrupo.get(s.ID_PROGRAMACION);
      if (!grupoId && s.ID_GRUPO_PLAN_CURSO && gpcToGrupo.has(s.ID_GRUPO_PLAN_CURSO)) grupoId = gpcToGrupo.get(s.ID_GRUPO_PLAN_CURSO);
      const turnoId = grupoId ? grupoToTurno.get(grupoId) : null;
      return { ...s, turnoId };
    });

    const signature = allBlocks.map(cb => {
      if (cb.type === 'break') return '__BREAK__';
      if (cb.type === 'separator') return '__SEPARATOR__';
      const sesion = sesionesConTurno.find(s => s.ORDEN === cb.orden && s.turnoId === cb.turnoId);
      if (sesion) return `${sesion.CODIGO_AREA || ''}|${sesion.NOMBRE_CURSO || ''}|${sesion.DOCENTE_NOMBRE_COMPLETO || ''}|${sesion.DOCENTE_DISPLAY || 'Sin docente'}|${cb.turnoNombre}|${sesion.NOMBRE_GRUPO || ''}`;
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

// ─── Filtrar sesiones por turno ─────────────────────────────────────────────
const filterSesionesByTurnoPdf = (sesiones, turnoId, gpcToGrupo, grupoToTurno) => {
  return sesiones.filter(s => {
    const grupoId = gpcToGrupo.get(s.ID_GRUPO_PLAN_CURSO) ?? (s.ID_GRUPO || null);
    return grupoId && grupoToTurno.get(grupoId) === turnoId;
  });
};

// ─── Calcular columnas para un turno ────────────────────────────────────────
const buildColumnsPdf = (sesiones, allBlocks, programacionToGrupo, gpcToGrupo, grupoToTurno) => {
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
      let grupoId = null;
      if (s.ID_PROGRAMACION && programacionToGrupo.has(s.ID_PROGRAMACION)) grupoId = programacionToGrupo.get(s.ID_PROGRAMACION);
      if (!grupoId && s.ID_GRUPO_PLAN_CURSO && gpcToGrupo.has(s.ID_GRUPO_PLAN_CURSO)) grupoId = gpcToGrupo.get(s.ID_GRUPO_PLAN_CURSO);
      const turnoId = grupoId ? grupoToTurno.get(grupoId) : null;
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

// ─── Dibujar página de plaza en el PDF ──────────────────────────────────────

const drawPlazaPage = (doc, nombrePlaza, sesiones, resolvedLookups, isFirstPage, opts = {}) => {
  if (!isFirstPage) doc.addPage('a4', 'landscape');

  const { programacionToGrupo, gpcToGrupo, grupoToTurno, turnosConBloques } = resolvedLookups;

  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const marginL = 8;
  const marginR = 8;
  const usableW = PW - marginL - marginR;

  // Calcular maxCols para centrado del header
  let maxDataCols = 1;
  const turnosData = [];
  for (const turno of turnosConBloques) {
    const sesT = filterSesionesByTurnoPdf(sesiones, turno.turnoId, gpcToGrupo, grupoToTurno);
    const allBlocks = turno.bloques.map(b => ({ ...b, turnosLabel: turno.turnoNombre }));
    const columns = buildColumnsPdf(sesT, allBlocks, programacionToGrupo, gpcToGrupo, grupoToTurno);
    if (columns.length > 0) {
      turnosData.push({ turno, allBlocks, columns });
      if (columns.length > maxDataCols) maxDataCols = columns.length;
    }
  }

  if (turnosData.length === 0) return;

  const blockColW = 30;
  const dataColW = Math.min(34, (usableW - blockColW) / Math.max(maxDataCols, 1));
  const totalW = blockColW + dataColW * maxDataCols;
  const startX = marginL + (usableW - totalW) / 2;

  let y = 6;

  // ── Header general ────────────────────────────────────────────────────────
  const s0 = sesiones[0] || {};
  const nombreDocente = s0.DOCENTE_NOMBRE_COMPLETO || 'Docente no asignado';
  const docenteEmail = s0.DOCENTE_EMAIL || '';
  const docenteTelefono = s0.DOCENTE_TELEFONO || '';
  const periodo = s0.NOMBRE_PERIODO || '';
  const sede    = s0.NOMBRE_SEDE    || '';
  const curso   = s0.NOMBRE_CURSO   || '';

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

  // ── Tablas por turno ──────────────────────────────────────────────────────
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
    const turnoTotalW = blockColW + dataColW * columns.length;
    const turnoStartX = marginL + (usableW - turnoTotalW) / 2;

    // Separación entre turnos
    if (ti > 0) y += 4;

    // Título del turno
    const turnoH = 6;
    filledRect(doc, startX, y, totalW, turnoH, [30, 58, 138], [30, 58, 138]);
    centeredText(doc, `═══  ${turno.turnoNombre}  ═══`, startX, y, totalW, turnoH, 7, C_WHITE, true);
    y += turnoH;

    // Encabezado de días
    const dayH = 6;
    filledRect(doc, turnoStartX, y, blockColW, dayH * 2, C_BLUE);
    centeredText(doc, 'BLOQUE', turnoStartX, y, blockColW, dayH * 2, 7, C_WHITE, true);

    columns.forEach((col, idx) => {
      const cx = turnoStartX + blockColW + idx * dataColW;
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
        filledRect(doc, turnoStartX, ry, blockColW, rh, C_GRAY_MED);
        centeredText(doc, `${cb.label}\n${cb.timeRange}`, turnoStartX, ry, blockColW, rh, 4.5, C_GRAY_TEXT, false);
      } else {
        ordenClase++;
        filledRect(doc, turnoStartX, ry, blockColW, rh, C_GRAY_LIGHT);
        centeredText(doc, `Bloque ${ordenClase}\n${cb.timeRange}`, turnoStartX, ry, blockColW, rh, 4.5, C_BLUE, true);
      }

      columns.forEach((col, idx) => {
        const cx = turnoStartX + blockColW + idx * dataColW;
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

    y += totalContentH * scaleY;
  }
};

// ─── Resolver lookups para plaza individual ─────────────────────────────────
// OPTIMIZADO: Usa queries batch con IN en lugar de N+1 queries individuales

const resolveIndividual = async (sesiones) => {
  const gpcIds = [...new Set(sesiones.map(s => s.ID_GRUPO_PLAN_CURSO).filter(Boolean))];
  const gpcToGrupo = new Map();
  const grupoIds = new Set();
  const programacionToGrupo = new Map();

  // 1. Query batch: GRUPO_PLAN_CURSO por múltiples IDs
  if (gpcIds.length > 0) {
    const placeholders = gpcIds.map((_, i) => `$${i + 1}`).join(',');
    const rows = await db.rawSelect(
      `SELECT * FROM "GRUPO_PLAN_CURSO" WHERE "ID_GRUPO_PLAN_CURSO" IN (${placeholders})`,
      ...gpcIds
    );
    for (const r of rows) {
      if (r.ID_GRUPO) { gpcToGrupo.set(r.ID_GRUPO_PLAN_CURSO, r.ID_GRUPO); grupoIds.add(r.ID_GRUPO); }
    }
  }

  for (const s of sesiones) {
    if (s.ID_PROGRAMACION && s.ID_GRUPO) programacionToGrupo.set(s.ID_PROGRAMACION, s.ID_GRUPO);
  }

  const allGrupoIds = new Set([...grupoIds, ...programacionToGrupo.values()]);
  const grupoToTurno = new Map();
  const turnoIds = new Set();

  // 2. Query batch: GRUPOS por múltiples IDs
  const grupoIdsArray = [...allGrupoIds];
  if (grupoIdsArray.length > 0) {
    const placeholders = grupoIdsArray.map((_, i) => `$${i + 1}`).join(',');
    const rows = await db.rawSelect(
      `SELECT * FROM "GRUPOS" WHERE "ID_GRUPO" IN (${placeholders})`,
      ...grupoIdsArray
    );
    for (const r of rows) {
      if (r.ID_TURNO) { grupoToTurno.set(r.ID_GRUPO, r.ID_TURNO); turnoIds.add(r.ID_TURNO); }
    }
  }

  // 3. Query batch: TURNOS por múltiples IDs
  const turnoIdsArray = [...turnoIds];
  const turnosMap = new Map();
  const horarioIds = new Set();

  if (turnoIdsArray.length > 0) {
    const placeholders = turnoIdsArray.map((_, i) => `$${i + 1}`).join(',');
    const rows = await db.rawSelect(
      `SELECT * FROM "TURNOS" WHERE "ID_TURNO" IN (${placeholders})`,
      ...turnoIdsArray
    );
    for (const turno of rows) {
      if (turno.ID_HORARIO) {
        turnosMap.set(turno.ID_TURNO, turno);
        horarioIds.add(turno.ID_HORARIO);
      }
    }
  }

  // 4. Query batch: HORARIOS por múltiples IDs
  const horarioIdsArray = [...horarioIds];
  const horariosMap = new Map();

  if (horarioIdsArray.length > 0) {
    const placeholders = horarioIdsArray.map((_, i) => `$${i + 1}`).join(',');
    const rows = await db.rawSelect(
      `SELECT * FROM "HORARIOS" WHERE "ID_HORARIO" IN (${placeholders})`,
      ...horarioIdsArray
    );
    for (const h of rows) {
      horariosMap.set(h.ID_HORARIO, h);
    }
  }

  // 5. Query batch: HORARIO_BLOQUES por múltiples horarios
  const horarioBloquesMap = new Map();
  if (horarioIdsArray.length > 0) {
    const placeholders = horarioIdsArray.map((_, i) => `$${i + 1}`).join(',');
    const rows = await db.rawSelect(
      `SELECT * FROM "HORARIO_BLOQUES" WHERE "ID_HORARIO" IN (${placeholders}) ORDER BY "ORDEN"`,
      ...horarioIdsArray
    );
    for (const b of rows) {
      if (!horarioBloquesMap.has(b.ID_HORARIO)) horarioBloquesMap.set(b.ID_HORARIO, []);
      horarioBloquesMap.get(b.ID_HORARIO).push(b);
    }
  }

  // 6. Construir turnosConBloques
  const turnosConBloques = [];
  for (const [turnoId, turno] of turnosMap) {
    const horario = horariosMap.get(turno.ID_HORARIO);
    const bloques = horarioBloquesMap.get(turno.ID_HORARIO) || [];
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
        orden: b.ORDEN, time: fmt(hour, minute), endTime: fmt(endHour, endMinute),
        timeRange, turnoNombre: turno.NOMBRE_TURNO, turnoId: turno.ID_TURNO, horarioId: turno.ID_HORARIO
      };
    });
    turnosConBloques.push({ turnoId, turnoNombre: turno.NOMBRE_TURNO, horarioId: turno.ID_HORARIO, bloques: customBlocks });
  }

  return { programacionToGrupo, gpcToGrupo, grupoToTurno, turnosConBloques };
};

// ─── Resolver lookups desde cache bulk ──────────────────────────────────────

const resolveFromCache = (sesiones, cache) => {
  const { gpcToGrupo, grupoToTurno, turnosConBloquesMap } = cache;
  const programacionToGrupo = new Map();
  for (const s of sesiones) {
    if (s.ID_PROGRAMACION && s.ID_GRUPO) programacionToGrupo.set(s.ID_PROGRAMACION, s.ID_GRUPO);
  }

  const localGrupoIds = new Set();
  for (const s of sesiones) {
    if (s.ID_GRUPO_PLAN_CURSO && gpcToGrupo.has(s.ID_GRUPO_PLAN_CURSO)) localGrupoIds.add(gpcToGrupo.get(s.ID_GRUPO_PLAN_CURSO));
    if (s.ID_PROGRAMACION && programacionToGrupo.has(s.ID_PROGRAMACION)) localGrupoIds.add(programacionToGrupo.get(s.ID_PROGRAMACION));
  }

  const localTurnoIds = new Set();
  for (const gid of localGrupoIds) {
    if (grupoToTurno.has(gid)) localTurnoIds.add(grupoToTurno.get(gid));
  }

  const turnosConBloques = [...localTurnoIds].map(tid => turnosConBloquesMap.get(tid)).filter(Boolean);
  return { programacionToGrupo, gpcToGrupo, grupoToTurno, turnosConBloques };
};

// ════════════════════════════════════════════════════════════════════════════
// EXPORTS PÚBLICOS
// ════════════════════════════════════════════════════════════════════════════

export const exportPlazaToPdf = async (idPlaza, nombrePlaza) => {
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

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    drawPlazaPage(doc, nombrePlaza, sesiones, lookups, true, opts);
    doc.save(`Horario_${nombrePlaza || 'Plaza'}_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Error exportando plaza PDF:', error);
    alert('Error al exportar PDF: ' + error.message);
  }
};

export const exportSedeToPdf = async (idSede, nombreSede, idPeriodo, onProgress, opts = {}) => {
  try {
    const filters = { ID_SEDE: idSede };
    if (idPeriodo) filters.ID_PERIODO = idPeriodo;
    const plazasResult = await db.select('PLAZA_DOCENTE', filters);
    const plazas = (plazasResult?.data?.records || plazasResult || []).filter(p => p.ACTIVO !== false);

    if (plazas.length === 0) {
      alert('No hay plazas docentes para esta sede');
      return;
    }

    if (onProgress) onProgress(0, plazas.length);
    const cache = await buildBulkCache(idPeriodo);
    if (!cache) {
      alert('No se encontraron sesiones para el período');
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    let isFirst = true;
    let added = 0;

    for (const plaza of plazas) {
      const sesiones = cache.sesionesPorPlaza.get(plaza.ID_PLAZA_DOCENTE) || [];
      if (sesiones.length === 0) { if (onProgress) onProgress(++added, plazas.length); continue; }

      const lookups = resolveFromCache(sesiones, cache);
      if (lookups.turnosConBloques.length === 0) { if (onProgress) onProgress(++added, plazas.length); continue; }

      drawPlazaPage(doc, plaza.IDENTIFICADOR_DOCENTE, sesiones, lookups, isFirst, opts);
      isFirst = false;
      added++;
      if (onProgress) onProgress(added, plazas.length);
    }

    if (isFirst) {
      alert('No se encontraron sesiones para ninguna plaza de esta sede');
      return;
    }

    doc.save(`Horarios_${nombreSede || 'Sede'}_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Error exportando sede PDF:', error);
    alert('Error al exportar PDF: ' + error.message);
  }
};

export const exportAllPlazasToPdf = async (idPeriodo, onProgress, opts = {}) => {
  try {
    const filters = {};
    if (idPeriodo) filters.ID_PERIODO = idPeriodo;
    const plazasResult = await db.select('PLAZA_DOCENTE', filters);
    const plazas = (plazasResult?.data?.records || plazasResult || []).filter(p => p.ACTIVO !== false);

    if (plazas.length === 0) {
      alert('No hay plazas docentes para el período seleccionado');
      return;
    }

    if (onProgress) onProgress(0, plazas.length);
    const cache = await buildBulkCache(idPeriodo);
    if (!cache) {
      alert('No se encontraron sesiones para el período');
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    let isFirst = true;
    let processed = 0;

    for (const plaza of plazas) {
      const sesiones = cache.sesionesPorPlaza.get(plaza.ID_PLAZA_DOCENTE) || [];
      processed++;
      if (sesiones.length === 0) { if (onProgress) onProgress(processed, plazas.length); continue; }

      const lookups = resolveFromCache(sesiones, cache);
      if (lookups.turnosConBloques.length === 0) { if (onProgress) onProgress(processed, plazas.length); continue; }

      drawPlazaPage(doc, plaza.IDENTIFICADOR_DOCENTE, sesiones, lookups, isFirst, opts);
      isFirst = false;

      if (onProgress) onProgress(processed, plazas.length);
    }

    if (isFirst) {
      alert('No se encontraron sesiones para ninguna plaza del período');
      return;
    }

    doc.save(`Horarios_Todas_Plazas_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Error exportando todas las plazas PDF:', error);
    alert('Error al exportar PDF: ' + error.message);
  }
};
