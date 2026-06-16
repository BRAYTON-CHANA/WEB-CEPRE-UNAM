import { jsPDF } from 'jspdf';
import { db } from '@/shared/api';
import { buildBulkCache, filterSesionesByTurno } from '../../plazas/utils/exportPlazaToExcel';

const WEEKDAY_NAMES = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
const MONTH_NAMES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

const parseDate = (fechaStr) => {
  const [day, month, year] = fechaStr.split('/').map(Number);
  return new Date(year, month - 1, day);
};

const formatDateShort = (date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = MONTH_NAMES[date.getMonth()];
  return `${day}-${month}`;
};

// ─── Construir columnas para un turno (autocontenido) ────────────────────────
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
    const normalized = fechaStr.includes('/') ? fechaStr : fechaStr.split('-').reverse().join('/');
    const date = parseDate(normalized);
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

// Colores
const C_BLUE        = [45,  54,  111];
const C_BLUE_DARK   = [30,  58,  138];
const C_BLUE_MED    = [45,  76,  200];
const C_WHITE       = [255, 255, 255];
const C_TEAL_LIGHT  = [216, 241, 239];
const C_GRAY_LIGHT  = [243, 244, 246];
const C_GRAY_MED    = [229, 231, 235];
const C_GRAY_TEXT   = [107, 114, 128];
const C_DARK_TEXT   = [31,  41,  55];
const C_BORDER      = [180, 180, 180];

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

// ─── Resolver lookups para sesiones individuales ─────────────────────────────
// OPTIMIZADO: Usa queries batch con IN en lugar de N+1 queries individuales
const resolveLookupsIndividual = async (sesiones) => {
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
      currentMinute = endMinuteTotal;
      return {
        idBloque: b.ID_BLOQUE, duration: b.DURACION || 50,
        type: b.TIPO_BLOQUE?.toLowerCase() || 'clase',
        label: b.ETIQUETA || `Bloque ${b.ORDEN}`,
        orden: b.ORDEN, time: fmt(hour, minute), endTime: fmt(endHour, endMinute),
        timeRange: `${fmt(hour, minute)} - ${fmt(endHour, endMinute)}`,
        turnoNombre: turno.NOMBRE_TURNO, turnoId: turno.ID_TURNO, horarioId: turno.ID_HORARIO
      };
    });
    turnosConBloques.push({ turnoId, turnoNombre: turno.NOMBRE_TURNO, horarioId: turno.ID_HORARIO, bloques: customBlocks });
  }

  return { programacionToGrupo, gpcToGrupo, grupoToTurno, turnosConBloques };
};

// ─── Resolver lookups desde cache bulk ──────────────────────────────────────
const resolveLookupsFromCache = (sesiones, cache) => {
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

// ─── Computar runs para merge vertical en PDF ───────────────────────────────
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

// ─── Dibujar página de docente en el PDF ────────────────────────────────────
const drawDocentePage = (doc, nombreDocente, sesiones, lookups, isFirstPage, opts = {}) => {
  if (!isFirstPage) doc.addPage('a4', 'landscape');

  const { programacionToGrupo, gpcToGrupo, grupoToTurno, turnosConBloques } = lookups;

  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const marginL = 10;
  const marginR = 10;
  const usableW = PW - marginL - marginR;

  // Agrupar sesiones por plaza
  const sesionesPorPlaza = new Map();
  for (const s of sesiones) {
    const pid = s.ID_PLAZA_DOCENTE;
    if (!pid) continue;
    if (!sesionesPorPlaza.has(pid)) sesionesPorPlaza.set(pid, []);
    sesionesPorPlaza.get(pid).push(s);
  }

  // Precalcular plazas/turnos para maxDataCols
  let maxDataCols = 1;
  const plazasData = [];
  for (const [idPlaza, sesPlaza] of sesionesPorPlaza.entries()) {
    const s0plz = sesPlaza[0] || {};
    const turnosDeEstaPlaza = [];
    for (const turno of turnosConBloques) {
      const sesTurno = filterSesionesByTurno(sesPlaza, turno.turnoId, gpcToGrupo, grupoToTurno);
      if (sesTurno.length === 0) continue;
      const allBlocks = turno.bloques.map(b => ({ ...b }));
      const columns = buildColumnsPdf(sesTurno, allBlocks, programacionToGrupo, gpcToGrupo, grupoToTurno);
      if (columns.length > 0) {
        turnosDeEstaPlaza.push({ turno, allBlocks, columns });
        if (columns.length > maxDataCols) maxDataCols = columns.length;
      }
    }
    if (turnosDeEstaPlaza.length > 0) {
      plazasData.push({
        identificador: s0plz.DOCENTE_DISPLAY || String(idPlaza),
        sede: s0plz.NOMBRE_SEDE || '',
        curso: s0plz.NOMBRE_CURSO || '',
        turnos: turnosDeEstaPlaza
      });
    }
  }

  if (plazasData.length === 0) return;

  const blockColW = 28;
  const dataColW  = Math.min(32, (usableW - blockColW) / Math.max(maxDataCols, 1));
  const totalW    = blockColW + dataColW * maxDataCols;
  const startX    = marginL + (usableW - totalW) / 2;

  const s0 = sesiones[0] || {};
  const periodo = s0.NOMBRE_PERIODO || '';
  const dni     = s0.DOCENTE_DNI    || '';
  const email   = s0.DOCENTE_EMAIL  || '';
  const telefono = s0.DOCENTE_TELEFONO || '';

  let y = 6;

  // ── Header general ────────────────────────────────────────────────────────
  const headerH = 7;
  filledRect(doc, startX, y, totalW, headerH, C_BLUE);
  centeredText(doc, `HORARIO - ${nombreDocente || 'Docente'}`, startX, y, totalW, headerH, 9, C_WHITE, true);
  y += headerH;

  const infoH = 4.5;
  filledRect(doc, startX, y, totalW, infoH, C_GRAY_LIGHT, C_BORDER);
  const contactoParts = [email && `Email: ${email}`, telefono && `Tel: ${telefono}`].filter(Boolean);
  const infoParts = [dni && `DNI: ${dni}`, periodo && `Período: ${periodo}`];
  if (contactoParts.length > 0) infoParts.push(contactoParts.join(' | '));
  const infoLine = infoParts.join('   |   ');
  doc.setFontSize(6); doc.setFont('helvetica', 'normal'); setTextColor(doc, C_GRAY_TEXT);
  doc.text(infoLine, startX + 3, y + infoH * 0.72);
  y += infoH;

  // ── Plazas ────────────────────────────────────────────────────────────────
  for (let pi = 0; pi < plazasData.length; pi++) {
    const { identificador, sede, curso, turnos } = plazasData[pi];

    if (pi > 0) y += 5;

    // Título de plaza — texto negrita sobre fondo blanco con borde inferior
    const plazaH = 7;
    filledRect(doc, marginL, y, usableW, plazaH, C_WHITE, C_BORDER);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    setTextColor(doc, C_BLUE);
    const plazaLabel = `PLAZA: ${identificador}${sede ? '  |  ' + sede : ''}${curso ? '  |  ' + curso : ''}`;
    doc.text(plazaLabel, marginL + 3, y + plazaH * 0.68);
    setDrawColor(doc, C_BLUE);
    doc.line(marginL, y + plazaH, marginL + usableW, y + plazaH);
    y += plazaH + 1;

    // Turnos de esta plaza
    for (let ti = 0; ti < turnos.length; ti++) {
      const { turno, allBlocks, columns } = turnos[ti];
      const turnoTotalW = blockColW + dataColW * columns.length;
      const turnoStartX = marginL + (usableW - turnoTotalW) / 2;

      if (ti > 0) y += 4;

      // Título de turno — texto negrita itálica sobre fondo gris muy claro
      const turnoH = 5.5;
      filledRect(doc, marginL, y, usableW, turnoH, C_GRAY_LIGHT, C_BORDER);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bolditalic');
      setTextColor(doc, C_DARK_TEXT);
      doc.text(`  ${turno.turnoNombre}`, marginL + 3, y + turnoH * 0.70);
      y += turnoH + 1;

      // Encabezado días
      const dayH = 5.5;
      filledRect(doc, turnoStartX, y, blockColW, dayH * 2, C_BLUE);
      centeredText(doc, 'BLOQUE', turnoStartX, y, blockColW, dayH * 2, 6.5, C_WHITE, true);

      columns.forEach((col, idx) => {
        const cx = turnoStartX + blockColW + idx * dataColW;
        filledRect(doc, cx, y, dataColW, dayH, C_BLUE);
        centeredText(doc, col.weekdayName, cx, y, dataColW, dayH, 6, C_WHITE, true);
        filledRect(doc, cx, y + dayH, dataColW, dayH, C_BLUE);
        centeredText(doc, col.dates.map(formatDateShort).join(' / '), cx, y + dayH, dataColW, dayH, 5, C_WHITE, false);
      });
      y += dayH * 2;

      // Filas de bloques
      const runsByCol = columns.map(col => computeRuns(col.signature));
      const findRun = (runs, i) => runs.find(r => i >= r.start && i <= r.end);

      const breakH  = 4.5;
      const classH  = 13;
      const rowHeights = allBlocks.map(cb => cb.type === 'break' ? breakH : classH);

      const rowYs = [];
      let yCursor = y;
      for (const h of rowHeights) { rowYs.push(yCursor); yCursor += h; }

      const totalContentH = yCursor - y;
      const availH = PH - y - 6;
      const scaleY = totalContentH > availH ? availH / totalContentH : 1;

      let ordenClase = 0;
      for (let i = 0; i < allBlocks.length; i++) {
        const cb  = allBlocks[i];
        const ry  = y + (rowYs[i] - y) * scaleY;
        const rh  = rowHeights[i] * scaleY;

        if (cb.type === 'break') {
          filledRect(doc, turnoStartX, ry, blockColW, rh, C_GRAY_MED);
          centeredText(doc, `${cb.label}\n${cb.timeRange}`, turnoStartX, ry, blockColW, rh, 4, C_GRAY_TEXT, false);
        } else {
          ordenClase++;
          filledRect(doc, turnoStartX, ry, blockColW, rh, C_GRAY_LIGHT);
          centeredText(doc, `Bloque ${ordenClase}\n${cb.timeRange}`, turnoStartX, ry, blockColW, rh, 4, C_BLUE, true);
        }

        columns.forEach((col, idx) => {
          const cx  = turnoStartX + blockColW + idx * dataColW;
          const run = findRun(runsByCol[idx], i);
          const sig = col.signature[i];

          if (run) {
            if (i === run.start) {
              const runEndY = y + (rowYs[run.end] - y) * scaleY + rowHeights[run.end] * scaleY;
              const runH    = runEndY - ry;
              filledRect(doc, cx, ry, dataColW, runH, C_TEAL_LIGHT);
              const [codigo, curso, nombreCompleto, docente, , grupo] = run.key.split('|');
              const startB = allBlocks[run.start];
              const endB   = allBlocks[run.end];
              const tr = startB.time && endB.endTime ? `${startB.time} - ${endB.endTime}` : '';
              const cellParts = [];
              if (opts.showCodigo !== false && codigo) cellParts.push(`${codigo} ${curso}`);
              else cellParts.push(curso);
              cellParts.push(grupo);
              if (opts.showNombreDocente !== false && nombreCompleto) cellParts.push(nombreCompleto);
              if (opts.showDocente !== false) cellParts.push(docente);
              if (opts.showHorario !== false) cellParts.push(tr);
              const cellLines = cellParts.filter(Boolean).join('\n');
              centeredText(doc, cellLines, cx, ry, dataColW, runH, 4, C_DARK_TEXT, false);
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
  }
};

// ════════════════════════════════════════════════════════════════════════════
// EXPORTS PÚBLICOS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Exporta 1 docente a PDF
 */
export const exportDocenteToPdf = async (idDocente, nombreDocente, opts = {}) => {
  try {
    const sesionesResult = await db.select('VW_SESIONES_AGRUPADAS_DESGLOSE', { ID_DOCENTE: idDocente });
    const sesiones = sesionesResult?.data?.records || sesionesResult || [];
    if (sesiones.length === 0) {
      alert('No hay sesiones programadas para este docente');
      return;
    }

    const lookups = await resolveLookupsIndividual(sesiones);
    if (!lookups || lookups.turnosConBloques.length === 0) {
      alert('No se encontraron datos de horario para este docente');
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    drawDocentePage(doc, nombreDocente, sesiones, lookups, true, opts);
    doc.save(`Horario_${nombreDocente || 'Docente'}_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Error exportando docente a PDF:', error);
    alert('Error al exportar PDF: ' + error.message);
  }
};

/**
 * Exporta todos los docentes del período (1 página por docente)
 */
export const exportAllDocentesToPdf = async (idPeriodo, onProgress, opts = {}) => {
  try {
    const cache = await buildBulkCache(idPeriodo);
    if (!cache) {
      alert('No se encontraron sesiones para el período seleccionado');
      return;
    }

    const sesionesPorDocente = new Map();
    for (const [, sesPlaza] of cache.sesionesPorPlaza.entries()) {
      for (const s of sesPlaza) {
        const idDoc = s.ID_DOCENTE;
        if (!idDoc) continue;
        if (!sesionesPorDocente.has(idDoc)) sesionesPorDocente.set(idDoc, []);
        sesionesPorDocente.get(idDoc).push(s);
      }
    }

    if (sesionesPorDocente.size === 0) {
      alert('No hay docentes con sesiones en el período seleccionado');
      return;
    }

    const docentes = [...sesionesPorDocente.entries()];
    if (onProgress) onProgress(0, docentes.length);

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    let isFirst = true;
    let processed = 0;

    for (const [idDocente, sesiones] of docentes) {
      const lookups = resolveLookupsFromCache(sesiones, cache);
      if (lookups.turnosConBloques.length > 0) {
        const nombreDocente = sesiones[0]?.DOCENTE_NOMBRE_COMPLETO || `Docente ${idDocente}`;
        drawDocentePage(doc, nombreDocente, sesiones, lookups, isFirst, opts);
        isFirst = false;
      }
      processed++;
      if (onProgress) onProgress(processed, docentes.length);
    }

    if (isFirst) {
      alert('No se encontraron sesiones para ningún docente del período');
      return;
    }

    doc.save(`Horarios_Docentes_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Error exportando docentes a PDF:', error);
    alert('Error al exportar PDF: ' + error.message);
  }
};
