import ExcelJS from 'exceljs';
import { db } from '@/shared/api';

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

// ─── Paginación: trae TODOS los registros superando el límite 1000 ────────────
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

// ─── Helper: construir bloques calculados para un turno ─────────────────────
const buildCustomBlocks = (turno, horario, bloques) => {
  const _hInit = (horario?.HORA_INICIO_JORNADA || '07:00').split(':').map(Number);
  let currentMinute = (isNaN(_hInit[0]) ? 7 : _hInit[0]) * 60 + (isNaN(_hInit[1]) ? 0 : _hInit[1]);
  const fmt = (h, m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

  return bloques.map((b) => {
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
      timeRange,
      turnoNombre: turno.NOMBRE_TURNO,
      turnoId: turno.ID_TURNO,
      horarioId: turno.ID_HORARIO
    };
  });
};

// ─── Resolución de lookups sin cache (modo individual) ──────────────────────
const resolveLookupsIndividual = async (sesiones) => {
  const programacionIds = [...new Set(sesiones.map(s => s.ID_PROGRAMACION).filter(Boolean))];
  const grupoIds = new Set();
  const programacionToGrupo = new Map();

  for (const progId of programacionIds) {
    const rows = await selectAll('PROGRAMACION_GRUPO', { ID_PROGRAMACION: progId });
    const prog = rows[0];
    if (prog?.ID_GRUPO) {
      grupoIds.add(prog.ID_GRUPO);
      programacionToGrupo.set(progId, prog.ID_GRUPO);
    }
  }

  const gpcIds = [...new Set(sesiones.map(s => s.ID_GRUPO_PLAN_CURSO).filter(Boolean))];
  const gpcToGrupo = new Map();

  for (const gpcId of gpcIds) {
    const rows = await selectAll('GRUPO_PLAN_CURSO', { ID_GRUPO_PLAN_CURSO: gpcId });
    const gpc = rows[0];
    if (gpc?.ID_GRUPO) {
      grupoIds.add(gpc.ID_GRUPO);
      gpcToGrupo.set(gpcId, gpc.ID_GRUPO);
    }
  }

  if (grupoIds.size === 0) return null;

  const turnoIds = new Set();
  const grupoToTurno = new Map();

  for (const grupoId of grupoIds) {
    const rows = await selectAll('GRUPOS', { ID_GRUPO: grupoId });
    const grupo = rows[0];
    if (grupo?.ID_TURNO) {
      turnoIds.add(grupo.ID_TURNO);
      grupoToTurno.set(grupoId, grupo.ID_TURNO);
    }
  }

  if (turnoIds.size === 0) return null;

  const turnosConBloques = [];
  for (const turnoId of turnoIds) {
    const turnoRows = await selectAll('TURNOS', { ID_TURNO: turnoId });
    const turno = turnoRows[0];
    if (!turno || !turno.ID_HORARIO) continue;

    const horarioRows = await selectAll('HORARIOS', { ID_HORARIO: turno.ID_HORARIO });
    const horario = horarioRows[0];

    const bloques = (await selectAll('HORARIO_BLOQUES', { ID_HORARIO: turno.ID_HORARIO })).sort((a, b) => a.ORDEN - b.ORDEN);

    if (bloques.length > 0) {
      const customBlocks = buildCustomBlocks(turno, horario, bloques);
      turnosConBloques.push({ turnoId: turno.ID_TURNO, turnoNombre: turno.NOMBRE_TURNO, horarioId: turno.ID_HORARIO, horario, bloques: customBlocks });
    }
  }

  return { programacionToGrupo, gpcToGrupo, grupoToTurno, turnosConBloques };
};

// ─── Resolución de lookups CON cache (modo bulk) ─────────────────────────────
const resolveLookupsFromCache = (sesiones, cache) => {
  const { gpcToGrupo, grupoToTurno, turnosConBloquesMap } = cache;

  const programacionToGrupo = new Map();
  for (const s of sesiones) {
    if (s.ID_PROGRAMACION && s.ID_GRUPO) {
      programacionToGrupo.set(s.ID_PROGRAMACION, s.ID_GRUPO);
    }
  }

  const localGrupoIds = new Set();
  for (const s of sesiones) {
    if (s.ID_GRUPO_PLAN_CURSO && gpcToGrupo.has(s.ID_GRUPO_PLAN_CURSO)) {
      localGrupoIds.add(gpcToGrupo.get(s.ID_GRUPO_PLAN_CURSO));
    }
    if (s.ID_PROGRAMACION && programacionToGrupo.has(s.ID_PROGRAMACION)) {
      localGrupoIds.add(programacionToGrupo.get(s.ID_PROGRAMACION));
    }
  }

  const localTurnoIds = new Set();
  for (const grupoId of localGrupoIds) {
    if (grupoToTurno.has(grupoId)) localTurnoIds.add(grupoToTurno.get(grupoId));
  }

  const turnosConBloques = [...localTurnoIds]
    .map(tid => turnosConBloquesMap.get(tid))
    .filter(Boolean);

  return { programacionToGrupo, gpcToGrupo, grupoToTurno, turnosConBloques };
};

// ─── Pre-cargar cache para exportaciones bulk ────────────────────────────────
/**
 * Carga todas las sesiones del período y resuelve los lookups de GPC, GRUPOS,
 * TURNOS, HORARIOS y HORARIO_BLOQUES en batch (mínimo de queries).
 */
export const buildBulkCache = async (idPeriodo) => {
  // 1. Todas las sesiones del período (paginado)
  const filters = {};
  if (idPeriodo) filters.ID_PERIODO = idPeriodo;
  const allSesiones = await selectAll('VW_SESIONES_AGRUPADAS_DESGLOSE', filters);

  if (allSesiones.length === 0) return null;

  // 2. IDs únicos que aparecen en las sesiones
  const gpcIdsSet   = new Set(allSesiones.map(s => s.ID_GRUPO_PLAN_CURSO).filter(Boolean));
  const grupoIdsSet = new Set(allSesiones.map(s => s.ID_GRUPO).filter(Boolean));

  // 3. GRUPO_PLAN_CURSO completa → filtrar en memoria
  const allGpc = await selectAll('GRUPO_PLAN_CURSO');
  const gpcToGrupo = new Map();
  for (const r of allGpc) {
    if (gpcIdsSet.has(r.ID_GRUPO_PLAN_CURSO) && r.ID_GRUPO) {
      gpcToGrupo.set(r.ID_GRUPO_PLAN_CURSO, r.ID_GRUPO);
    }
  }

  const allGrupoIds = new Set([
    ...grupoIdsSet,
    ...gpcToGrupo.values()
  ]);

  // 4. GRUPOS completa → filtrar en memoria
  const allGruposRows = await selectAll('GRUPOS');
  const grupoToTurno = new Map();
  for (const r of allGruposRows) {
    if (allGrupoIds.has(r.ID_GRUPO) && r.ID_TURNO) {
      grupoToTurno.set(r.ID_GRUPO, r.ID_TURNO);
    }
  }

  const allTurnoIds = new Set(grupoToTurno.values());
  if (allTurnoIds.size === 0) return null;

  // 5. TURNOS completa → filtrar en memoria
  const allTurnosRows = await selectAll('TURNOS');
  const turnosMap = new Map();
  for (const r of allTurnosRows) {
    if (allTurnoIds.has(r.ID_TURNO)) turnosMap.set(r.ID_TURNO, r);
  }

  const allHorarioIds = new Set([...turnosMap.values()].map(t => t.ID_HORARIO).filter(Boolean));
  if (allHorarioIds.size === 0) return null;

  // 6. HORARIOS completa → filtrar en memoria
  const allHorariosRows = await selectAll('HORARIOS');
  const horariosMap = new Map();
  for (const r of allHorariosRows) {
    if (allHorarioIds.has(r.ID_HORARIO)) horariosMap.set(r.ID_HORARIO, r);
  }

  // 7. HORARIO_BLOQUES completa → filtrar en memoria y ordenar
  const allBloquesRows = await selectAll('HORARIO_BLOQUES');
  const horarioBloquesMap = new Map();
  for (const r of allBloquesRows) {
    if (allHorarioIds.has(r.ID_HORARIO)) {
      if (!horarioBloquesMap.has(r.ID_HORARIO)) horarioBloquesMap.set(r.ID_HORARIO, []);
      horarioBloquesMap.get(r.ID_HORARIO).push(r);
    }
  }
  for (const [k, v] of horarioBloquesMap) horarioBloquesMap.set(k, v.sort((a, b) => a.ORDEN - b.ORDEN));

  // 8. Construir turnosConBloquesMap
  const turnosConBloquesMap = new Map();
  for (const [turnoId, turno] of turnosMap) {
    if (!turno.ID_HORARIO) continue;
    const horario = horariosMap.get(turno.ID_HORARIO);
    const bloques = horarioBloquesMap.get(turno.ID_HORARIO) || [];
    if (bloques.length > 0) {
      const customBlocks = buildCustomBlocks(turno, horario, bloques);
      turnosConBloquesMap.set(turnoId, {
        turnoId,
        turnoNombre: turno.NOMBRE_TURNO,
        horarioId: turno.ID_HORARIO,
        horario,
        bloques: customBlocks
      });
    }
  }

  // 9. Agrupar sesiones por plaza
  const sesionesPorPlaza = new Map();
  for (const s of allSesiones) {
    const pid = s.ID_PLAZA_DOCENTE;
    if (!pid) continue;
    if (!sesionesPorPlaza.has(pid)) sesionesPorPlaza.set(pid, []);
    sesionesPorPlaza.get(pid).push(s);
  }

  return { gpcToGrupo, grupoToTurno, turnosConBloquesMap, sesionesPorPlaza };
};

const buildCellValue = (codigo, curso, grupo, nombreCompleto, docente, horario, opts = {}) => {
  const parts = [];
  if (opts.showCodigo !== false && codigo) parts.push(codigo);
  parts.push(curso);
  if (grupo) parts.push(grupo);
  if (nombreCompleto) parts.push(nombreCompleto);
  if (opts.showDocente !== false) parts.push(docente);
  if (opts.showHorario !== false) parts.push(horario);
  return parts.filter(Boolean).join('\n');
};

// ─── Core: construir hoja a partir de sesiones ya resueltas ─────────────────
const buildWorksheetCore = (workbook, nombrePlaza, sesiones, resolvedLookups, opts = {}) => {
  const { programacionToGrupo, gpcToGrupo, grupoToTurno, turnosConBloques } = resolvedLookups;

  if (turnosConBloques.length === 0) return false;

  // Agrupar por horario
  const horariosUnicos = new Map();
  for (const t of turnosConBloques) {
    if (!horariosUnicos.has(t.horarioId)) {
      horariosUnicos.set(t.horarioId, { horarioId: t.horarioId, horario: t.horario, turnos: [], bloques: t.bloques });
    }
    horariosUnicos.get(t.horarioId).turnos.push(t.turnoNombre);
  }

  // allBlocks con separadores
  const allBlocks = [];
  let horarioIndex = 0;
  for (const [, horarioData] of horariosUnicos) {
    horarioIndex++;
    if (horariosUnicos.size > 1 && allBlocks.length > 0) {
      allBlocks.push({ type: 'separator', label: `--- ${horarioData.turnos.join(' / ')} ---`, orden: 0, time: '', endTime: '', timeRange: '', turnoNombre: horarioData.turnos.join('/'), horarioIndex });
    }
    for (const bloque of horarioData.bloques) {
      allBlocks.push({ ...bloque, horarioIndex, turnosLabel: horarioData.turnos.join(' / ') });
    }
  }

  // Agrupar sesiones por fecha
  const sesionesPorFecha = new Map();
  for (const s of sesiones) {
    let fechaStr = s.FECHA;
    if (typeof fechaStr === 'string' && fechaStr.includes('T')) fechaStr = fechaStr.split('T')[0];
    if (!sesionesPorFecha.has(fechaStr)) sesionesPorFecha.set(fechaStr, []);
    sesionesPorFecha.get(fechaStr).push(s);
  }

  // Firmas por fecha
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
    dateInfos.push({ date, fechaStr, weekday, signature, sigKey });
  }

  // Agrupar por (weekday, sigKey)
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

  if (columns.length === 0) return false;

  // Crear hoja Excel
  const ws = workbook.addWorksheet(`${nombrePlaza || 'Plaza'}`.slice(0, 31));

  const headerFill    = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D366F' } };
  const headerFont    = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  const subHeaderFont = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  const blockColFill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
  const blockColFont  = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF2D366F' } };
  const eventFill     = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD8F1EF' } };
  const eventFont     = { name: 'Arial', size: 9, color: { argb: 'FF1F2937' } };
  const breakFill     = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
  const breakFont     = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF6B7280' } };
  const sepFill       = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D366F' } };
  const thinBorder    = {
    top:    { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    left:   { style: 'thin', color: { argb: 'FF000000' } },
    right:  { style: 'thin', color: { argb: 'FF000000' } }
  };

  ws.mergeCells(1, 1, 1, columns.length + 1);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = `HORARIO - ${nombrePlaza || 'Docente'}`;
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = headerFill;
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  titleCell.border = thinBorder;
  ws.getRow(1).height = 28;

  const headerA = ws.getCell(2, 1);
  headerA.value = 'BLOQUE';
  headerA.font = headerFont;
  headerA.fill = headerFill;
  headerA.alignment = { vertical: 'middle', horizontal: 'center' };
  headerA.border = thinBorder;
  ws.getCell(3, 1).fill = headerFill;
  ws.getCell(3, 1).border = thinBorder;
  ws.mergeCells(2, 1, 3, 1);

  columns.forEach((col, idx) => {
    const colNum = idx + 2;
    const wdCell = ws.getCell(2, colNum);
    wdCell.value = col.weekdayName;
    wdCell.font = headerFont;
    wdCell.fill = headerFill;
    wdCell.alignment = { vertical: 'middle', horizontal: 'center' };
    wdCell.border = thinBorder;
    const dCell = ws.getCell(3, colNum);
    dCell.value = col.dates.map(formatDateShort).join('\n');
    dCell.font = subHeaderFont;
    dCell.fill = headerFill;
    dCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    dCell.border = thinBorder;
  });

  ws.getRow(2).height = 24;
  ws.getRow(3).height = Math.max(20, Math.max(...columns.map(c => c.dates.length), 1) * 14);

  const signatureToCellContent = (sig) => {
    return allBlocks.map((cb, i) => {
      if (cb.type === 'separator') return { type: 'separator', label: cb.label };
      if (cb.type === 'break') return { type: 'break', label: cb.label, turno: cb.turnosLabel || cb.turnoNombre };
      if (sig[i] && sig[i] !== '__BREAK__' && sig[i] !== '__SEPARATOR__') {
        const [codigo, curso, nombreCompleto, docente, turno, grupo] = sig[i].split('|');
        return { type: 'event', text: `${codigo} ${curso}\n${grupo}\n${nombreCompleto ? nombreCompleto + '\n' : ''}${docente}\n${cb.timeRange}`, key: sig[i], turno, grupo };
      }
      return { type: 'empty' };
    });
  };

  const computeRuns = (cellInfos) => {
    const runs = [];
    let i = 0;
    while (i < cellInfos.length) {
      const ci = cellInfos[i];
      if (ci.type === 'separator' || ci.type !== 'event') { i++; continue; }
      let end = i;
      let j = i + 1;
      while (j < cellInfos.length) {
        const cj = cellInfos[j];
        if (cj.type === 'separator' || cj.type === 'break') break;
        if (cj.type === 'event' && cj.key === ci.key) { end = j; j++; } else break;
      }
      runs.push({ start: i, end, key: ci.key });
      i = end + 1;
    }
    return runs;
  };

  const cellsByColumn = columns.map(col => signatureToCellContent(col.signature));
  const runsByColumn  = cellsByColumn.map(computeRuns);
  const findRun = (runs, i) => runs.find(r => i >= r.start && i <= r.end);

  const dataStartRow = 4;
  let ordenClase = 0;

  for (let i = 0; i < allBlocks.length; i++) {
    const cb = allBlocks[i];
    const rowNum = dataStartRow + i;
    const aCell = ws.getCell(rowNum, 1);

    if (cb.type === 'separator') {
      ordenClase = 0;
      ws.mergeCells(rowNum, 1, rowNum, columns.length + 1);
      aCell.value = cb.label;
      aCell.fill = sepFill;
      aCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' }, italic: true };
      aCell.alignment = { vertical: 'middle', horizontal: 'center' };
      aCell.border = thinBorder;
      ws.getRow(rowNum).height = 24;
      continue;
    }

    if (cb.type === 'break') {
      aCell.value = `${cb.label}\n${cb.timeRange}\n(${cb.turnosLabel || cb.turnoNombre})`;
      aCell.fill = breakFill;
      aCell.font = breakFont;
    } else {
      ordenClase++;
      aCell.value = `Bloque ${ordenClase}\n${cb.timeRange}\n(${cb.turnosLabel || cb.turnoNombre})`;
      aCell.fill = blockColFill;
      aCell.font = blockColFont;
    }
    aCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    aCell.border = thinBorder;

    columns.forEach((col, idx) => {
      const colNum = idx + 2;
      const cellInfo = cellsByColumn[idx][i];
      const run = findRun(runsByColumn[idx], i);
      const c = ws.getCell(rowNum, colNum);

      if (run) {
        if (i === run.start) {
          const startBlock = allBlocks[run.start];
          const endBlock   = allBlocks[run.end];
          const combinedRange = `${startBlock.time} - ${endBlock.endTime}`;
          const [codigo, curso, nombreCompleto, docente, , grupo] = run.key.split('|');
          c.value = buildCellValue(codigo, curso, grupo, nombreCompleto, docente, combinedRange, opts);
        } else {
          c.value = '';
        }
        c.fill = eventFill;
        c.font = eventFont;
      } else if (cellInfo.type === 'break') {
        c.value = cellInfo.label;
        c.fill = breakFill;
        c.font = breakFont;
      } else if (cellInfo.type === 'separator') {
        c.value = '';
        c.fill = sepFill;
      } else {
        c.value = '';
        c.font = eventFont;
      }
      c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      c.border = thinBorder;
    });

    ws.getRow(rowNum).height = cb.type === 'break' ? 22 : 48;
  }

  columns.forEach((col, idx) => {
    const colNum = idx + 2;
    runsByColumn[idx].forEach(r => {
      if (r.end > r.start) ws.mergeCells(dataStartRow + r.start, colNum, dataStartRow + r.end, colNum);
    });
  });

  ws.getColumn(1).width = 18;
  for (let i = 0; i < columns.length; i++) ws.getColumn(i + 2).width = 24;

  return true;
};

// ─── buildWorksheetForPlaza: modo individual (sin cache) ────────────────────
const buildWorksheetForPlaza = async (workbook, idPlaza, nombrePlaza, opts = {}) => {
  const sesionesResult = await db.select('VW_SESIONES_AGRUPADAS_DESGLOSE', { ID_PLAZA_DOCENTE: idPlaza });
  const sesiones = sesionesResult?.data?.records || sesionesResult || [];

  if (sesiones.length === 0) return false;

  const lookups = await resolveLookupsIndividual(sesiones);
  if (!lookups) return false;

  return buildWorksheetCore(workbook, nombrePlaza, sesiones, lookups, opts);
};

// ─── buildWorksheetForPlazaFromCache: modo bulk (con cache) ─────────────────
const buildWorksheetForPlazaFromCache = (workbook, idPlaza, nombrePlaza, cache, opts = {}) => {
  const sesiones = cache.sesionesPorPlaza.get(idPlaza) || [];
  if (sesiones.length === 0) return false;

  const lookups = resolveLookupsFromCache(sesiones, cache);
  if (lookups.turnosConBloques.length === 0) return false;

  return buildWorksheetCore(workbook, nombrePlaza, sesiones, lookups, opts);
};

// ════════════════════════════════════════════════════════════════════════════
// EXPORTS PÚBLICOS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Exporta 1 plaza a Excel (modo individual, queries directas)
 */
export const exportPlazaToExcel = async (idPlaza, nombrePlaza, opts = {}) => {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema Horarios';
    workbook.created = new Date();

    const added = await buildWorksheetForPlaza(workbook, idPlaza, nombrePlaza, opts);
    if (!added) {
      alert('No hay sesiones programadas para esta plaza docente');
      return;
    }

    const fileName = `Horario_${nombrePlaza || 'Plaza'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    await downloadWorkbook(workbook, fileName);
  } catch (error) {
    console.error('Error exportando a Excel:', error);
    alert('Error al exportar: ' + error.message);
  }
};

/**
 * Exporta todas las plazas de una sede (modo bulk — 1 carga de sesiones total)
 */
export const exportSedeToExcel = async (idSede, nombreSede, idPeriodo, onProgress, opts = {}) => {
  try {
    const filters = { ID_SEDE: idSede };
    if (idPeriodo) filters.ID_PERIODO = idPeriodo;

    const plazasResult = await db.select('PLAZA_DOCENTE', filters);
    const plazas = (plazasResult?.data?.records || plazasResult || []).filter(p => p.ACTIVO !== false);

    if (plazas.length === 0) {
      alert('No hay plazas docentes para esta sede en el período seleccionado');
      return;
    }

    if (onProgress) onProgress(0, plazas.length);

    const cache = await buildBulkCache(idPeriodo);
    if (!cache) {
      alert('No se encontraron sesiones para el período seleccionado');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema Horarios';
    workbook.created = new Date();

    let processed = 0;
    let added = 0;

    for (const plaza of plazas) {
      const ok = await buildWorksheetForPlazaFromCache(workbook, plaza.ID_PLAZA_DOCENTE, plaza.IDENTIFICADOR_DOCENTE, cache, opts);
      if (ok) added++;
      processed++;
      if (onProgress) onProgress(processed, plazas.length);
    }

    if (added === 0) {
      alert('No se encontraron sesiones para ninguna plaza de esta sede');
      return;
    }

    const fileName = `Horarios_${nombreSede || 'Sede'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    await downloadWorkbook(workbook, fileName);
  } catch (error) {
    console.error('Error exportando sede a Excel:', error);
    alert('Error al exportar: ' + error.message);
  }
};

/**
 * Exporta todas las plazas del período (modo bulk — 1 carga de sesiones total)
 */
export const exportAllPlazasToExcel = async (idPeriodo, onProgress, opts = {}) => {
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
      alert('No se encontraron sesiones para el período seleccionado');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema Horarios';
    workbook.created = new Date();

    let processed = 0;
    let added = 0;

    for (const plaza of plazas) {
      const ok = buildWorksheetForPlazaFromCache(workbook, plaza.ID_PLAZA_DOCENTE, plaza.IDENTIFICADOR_DOCENTE, cache, opts);
      if (ok) added++;
      processed++;
      if (onProgress) onProgress(processed, plazas.length);
    }

    if (added === 0) {
      alert('No se encontraron sesiones para ninguna plaza del período');
      return;
    }

    const fileName = `Horarios_Todas_Plazas_${new Date().toISOString().split('T')[0]}.xlsx`;
    await downloadWorkbook(workbook, fileName);
  } catch (error) {
    console.error('Error exportando todas las plazas a Excel:', error);
    alert('Error al exportar: ' + error.message);
  }
};
