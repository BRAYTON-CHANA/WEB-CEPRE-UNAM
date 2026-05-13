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

// ─── Construir allBlocks (con separadores entre horarios) ───────────────────

const buildAllBlocks = (turnosConBloques) => {
  const horariosUnicos = new Map();
  for (const t of turnosConBloques) {
    if (!horariosUnicos.has(t.horarioId)) {
      horariosUnicos.set(t.horarioId, { horarioId: t.horarioId, turnos: [], bloques: t.bloques });
    }
    horariosUnicos.get(t.horarioId).turnos.push(t.turnoNombre);
  }

  const allBlocks = [];
  for (const [, horarioData] of horariosUnicos) {
    if (horariosUnicos.size > 1 && allBlocks.length > 0) {
      allBlocks.push({ type: 'separator', label: `--- ${horarioData.turnos.join(' / ')} ---`, orden: 0, time: '', endTime: '', timeRange: '', turnoNombre: horarioData.turnos.join('/') });
    }
    for (const bloque of horarioData.bloques) {
      allBlocks.push({ ...bloque, turnosLabel: horarioData.turnos.join(' / ') });
    }
  }
  return allBlocks;
};

// ─── Dibujar página de plaza en el PDF ──────────────────────────────────────

const drawPlazaPage = (doc, nombrePlaza, columns, allBlocks, isFirstPage) => {
  if (!isFirstPage) doc.addPage('a4', 'landscape');

  const PW = doc.internal.pageSize.getWidth();
  const marginL = 8;
  const marginR = 8;
  const usableW = PW - marginL - marginR;

  const blockColW = 30;
  const dataColW = Math.min(34, (usableW - blockColW) / Math.max(columns.length, 1));
  const totalW = blockColW + dataColW * columns.length;
  const startX = marginL + (usableW - totalW) / 2;

  let y = 6;

  // Cabecera
  const headerH = 7;
  filledRect(doc, startX, y, totalW, headerH, C_BLUE);
  centeredText(doc, `HORARIO - ${nombrePlaza || 'Docente'}`, startX, y, totalW, headerH, 9, C_WHITE, true);
  y += headerH;

  // Encabezado días
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

  // computeRuns
  const computeRuns = (sig) => {
    const runs = [];
    let i = 0;
    while (i < sig.length) {
      const s = sig[i];
      if (!s || s === '__BREAK__' || s === '__SEPARATOR__' || s === null) { i++; continue; }
      let end = i, j = i + 1;
      while (j < sig.length) {
        const sj = sig[j];
        if (sj === '__SEPARATOR__' || sj === '__BREAK__') break;
        if (sj === s) { end = j; j++; } else break;
      }
      runs.push({ start: i, end, key: s });
      i = end + 1;
    }
    return runs;
  };

  const runsByCol = columns.map(col => computeRuns(col.signature));
  const findRun = (runs, i) => runs.find(r => i >= r.start && i <= r.end);

  const breakH = 5;
  const sepH = 5;
  const classH = 15;

  const rowHeights = allBlocks.map(cb => {
    if (cb.type === 'separator') return sepH;
    if (cb.type === 'break') return breakH;
    return classH;
  });

  const rowYs = [];
  let yCursor = y;
  for (const h of rowHeights) { rowYs.push(yCursor); yCursor += h; }

  const totalContentH = yCursor - y;
  const availH = doc.internal.pageSize.getHeight() - y - 6;
  const scaleY = totalContentH > availH ? availH / totalContentH : 1;

  let ordenClase = 0;
  for (let i = 0; i < allBlocks.length; i++) {
    const cb = allBlocks[i];
    const ry = y + (rowYs[i] - y) * scaleY;
    const rh = rowHeights[i] * scaleY;

    if (cb.type === 'separator') {
      filledRect(doc, startX, ry, totalW, rh, C_SEP, C_SEP);
      centeredText(doc, cb.label, startX, ry, totalW, rh, 5, C_WHITE, true);
      continue;
    }

    if (cb.type === 'break') {
      filledRect(doc, startX, ry, blockColW, rh, C_GRAY_MED);
      centeredText(doc, `${cb.label}\n${cb.timeRange}`, startX, ry, blockColW, rh, 4.5, C_GRAY_TEXT, false);
    } else {
      ordenClase++;
      filledRect(doc, startX, ry, blockColW, rh, C_GRAY_LIGHT);
      centeredText(doc, `Bloque ${ordenClase}\n${cb.timeRange}\n(${cb.turnosLabel || cb.turnoNombre})`, startX, ry, blockColW, rh, 4.5, C_BLUE, true);
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
      } else if (sig === '__SEPARATOR__') {
        filledRect(doc, cx, ry, dataColW, rh, C_SEP, C_SEP);
      } else {
        filledRect(doc, cx, ry, dataColW, rh, C_WHITE);
      }
    });
  }
};

// ─── Resolver lookups para plaza individual ─────────────────────────────────

const resolveIndividual = async (sesiones) => {
  const gpcIds = [...new Set(sesiones.map(s => s.ID_GRUPO_PLAN_CURSO).filter(Boolean))];
  const gpcToGrupo = new Map();
  const grupoIds = new Set();
  const programacionToGrupo = new Map();

  for (const gpcId of gpcIds) {
    const rows = await selectAll('GRUPO_PLAN_CURSO', { ID_GRUPO_PLAN_CURSO: gpcId });
    const r = rows[0];
    if (r?.ID_GRUPO) { gpcToGrupo.set(gpcId, r.ID_GRUPO); grupoIds.add(r.ID_GRUPO); }
  }
  for (const s of sesiones) {
    if (s.ID_PROGRAMACION && s.ID_GRUPO) programacionToGrupo.set(s.ID_PROGRAMACION, s.ID_GRUPO);
  }

  const allGrupoIds = new Set([...grupoIds, ...programacionToGrupo.values()]);
  const grupoToTurno = new Map();
  const turnoIds = new Set();

  for (const gid of allGrupoIds) {
    const rows = await selectAll('GRUPOS', { ID_GRUPO: gid });
    const r = rows[0];
    if (r?.ID_TURNO) { grupoToTurno.set(gid, r.ID_TURNO); turnoIds.add(r.ID_TURNO); }
  }

  const turnosConBloques = [];
  for (const turnoId of turnoIds) {
    const turnoRows = await selectAll('TURNOS', { ID_TURNO: turnoId });
    const turno = turnoRows[0];
    if (!turno?.ID_HORARIO) continue;
    const horarioRows = await selectAll('HORARIOS', { ID_HORARIO: turno.ID_HORARIO });
    const horario = horarioRows[0];
    const bloques = (await selectAll('HORARIO_BLOQUES', { ID_HORARIO: turno.ID_HORARIO })).sort((a, b) => a.ORDEN - b.ORDEN);
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

    const allBlocks = buildAllBlocks(lookups.turnosConBloques);
    const columns = preparePlazaData(sesiones, allBlocks, lookups.programacionToGrupo, lookups.gpcToGrupo, lookups.grupoToTurno);
    if (columns.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    drawPlazaPage(doc, nombrePlaza, columns, allBlocks, true);
    doc.save(`Horario_${nombrePlaza || 'Plaza'}_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Error exportando plaza PDF:', error);
    alert('Error al exportar PDF: ' + error.message);
  }
};

export const exportSedeToPdf = async (idSede, nombreSede, idPeriodo, onProgress) => {
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

      const allBlocks = buildAllBlocks(lookups.turnosConBloques);
      const columns = preparePlazaData(sesiones, allBlocks, lookups.programacionToGrupo, lookups.gpcToGrupo, lookups.grupoToTurno);
      if (columns.length === 0) { if (onProgress) onProgress(++added, plazas.length); continue; }

      drawPlazaPage(doc, plaza.IDENTIFICADOR_DOCENTE, columns, allBlocks, isFirst);
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

export const exportAllPlazasToPdf = async (idPeriodo, onProgress) => {
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

      const allBlocks = buildAllBlocks(lookups.turnosConBloques);
      const columns = preparePlazaData(sesiones, allBlocks, lookups.programacionToGrupo, lookups.gpcToGrupo, lookups.grupoToTurno);
      if (columns.length > 0) {
        drawPlazaPage(doc, plaza.IDENTIFICADOR_DOCENTE, columns, allBlocks, isFirst);
        isFirst = false;
      }

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
