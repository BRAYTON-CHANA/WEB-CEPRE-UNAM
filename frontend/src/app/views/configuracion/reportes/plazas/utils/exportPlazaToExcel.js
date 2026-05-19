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
// OPTIMIZADO: Usa queries batch con IN en lugar de N+1 queries individuales
const resolveLookupsIndividual = async (sesiones) => {
  const programacionIds = [...new Set(sesiones.map(s => s.ID_PROGRAMACION).filter(Boolean))];
  const gpcIds = [...new Set(sesiones.map(s => s.ID_GRUPO_PLAN_CURSO).filter(Boolean))];
  const grupoIds = new Set();
  const programacionToGrupo = new Map();
  const gpcToGrupo = new Map();

  // 1. Query batch: PROGRAMACION_GRUPO por múltiples IDs
  if (programacionIds.length > 0) {
    const placeholders = programacionIds.map((_, i) => `$${i + 1}`).join(',');
    const progRows = await db.rawSelect(
      `SELECT * FROM "PROGRAMACION_GRUPO" WHERE "ID_PROGRAMACION" IN (${placeholders})`,
      ...programacionIds
    );
    for (const prog of progRows) {
      if (prog.ID_GRUPO) {
        grupoIds.add(prog.ID_GRUPO);
        programacionToGrupo.set(prog.ID_PROGRAMACION, prog.ID_GRUPO);
      }
    }
  }

  // 2. Query batch: GRUPO_PLAN_CURSO por múltiples IDs
  if (gpcIds.length > 0) {
    const placeholders = gpcIds.map((_, i) => `$${i + 1}`).join(',');
    const gpcRows = await db.rawSelect(
      `SELECT * FROM "GRUPO_PLAN_CURSO" WHERE "ID_GRUPO_PLAN_CURSO" IN (${placeholders})`,
      ...gpcIds
    );
    for (const gpc of gpcRows) {
      if (gpc.ID_GRUPO) {
        grupoIds.add(gpc.ID_GRUPO);
        gpcToGrupo.set(gpc.ID_GRUPO_PLAN_CURSO, gpc.ID_GRUPO);
      }
    }
  }

  if (grupoIds.size === 0) return null;

  // 3. Query batch: GRUPOS por múltiples IDs
  const grupoIdsArray = [...grupoIds];
  const grupoToTurno = new Map();
  const turnoIds = new Set();

  if (grupoIdsArray.length > 0) {
    const placeholders = grupoIdsArray.map((_, i) => `$${i + 1}`).join(',');
    const grupoRows = await db.rawSelect(
      `SELECT * FROM "GRUPOS" WHERE "ID_GRUPO" IN (${placeholders})`,
      ...grupoIdsArray
    );
    for (const grupo of grupoRows) {
      if (grupo.ID_TURNO) {
        turnoIds.add(grupo.ID_TURNO);
        grupoToTurno.set(grupo.ID_GRUPO, grupo.ID_TURNO);
      }
    }
  }

  if (turnoIds.size === 0) return null;

  // 4. Query batch: TURNOS por múltiples IDs
  const turnoIdsArray = [...turnoIds];
  const horarioIds = new Set();
  const turnosMap = new Map();

  if (turnoIdsArray.length > 0) {
    const placeholders = turnoIdsArray.map((_, i) => `$${i + 1}`).join(',');
    const turnoRows = await db.rawSelect(
      `SELECT * FROM "TURNOS" WHERE "ID_TURNO" IN (${placeholders})`,
      ...turnoIdsArray
    );
    for (const turno of turnoRows) {
      if (turno.ID_HORARIO) {
        horarioIds.add(turno.ID_HORARIO);
        turnosMap.set(turno.ID_TURNO, turno);
      }
    }
  }

  if (horarioIds.size === 0) return null;

  // 5. Query batch: HORARIOS por múltiples IDs
  const horarioIdsArray = [...horarioIds];
  const horariosMap = new Map();

  if (horarioIdsArray.length > 0) {
    const placeholders = horarioIdsArray.map((_, i) => `$${i + 1}`).join(',');
    const horarioRows = await db.rawSelect(
      `SELECT * FROM "HORARIOS" WHERE "ID_HORARIO" IN (${placeholders})`,
      ...horarioIdsArray
    );
    for (const h of horarioRows) {
      horariosMap.set(h.ID_HORARIO, h);
    }
  }

  // 6. Query batch: HORARIO_BLOQUES por múltiples horarios
  const horarioBloquesMap = new Map();
  if (horarioIdsArray.length > 0) {
    const placeholders = horarioIdsArray.map((_, i) => `$${i + 1}`).join(',');
    const bloqueRows = await db.rawSelect(
      `SELECT * FROM "HORARIO_BLOQUES" WHERE "ID_HORARIO" IN (${placeholders}) ORDER BY "ORDEN"`,
      ...horarioIdsArray
    );
    for (const b of bloqueRows) {
      if (!horarioBloquesMap.has(b.ID_HORARIO)) {
        horarioBloquesMap.set(b.ID_HORARIO, []);
      }
      horarioBloquesMap.get(b.ID_HORARIO).push(b);
    }
  }

  // 7. Construir turnosConBloques
  const turnosConBloques = [];
  for (const [turnoId, turno] of turnosMap) {
    const horario = horariosMap.get(turno.ID_HORARIO);
    const bloques = horarioBloquesMap.get(turno.ID_HORARIO) || [];
    if (bloques.length > 0) {
      const customBlocks = buildCustomBlocks(turno, horario, bloques);
      turnosConBloques.push({
        turnoId: turno.ID_TURNO,
        turnoNombre: turno.NOMBRE_TURNO,
        horarioId: turno.ID_HORARIO,
        horario,
        bloques: customBlocks
      });
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
  if (opts.showNombreDocente !== false && nombreCompleto) parts.push(nombreCompleto);
  if (opts.showDocente !== false) parts.push(docente);
  if (opts.showHorario !== false) parts.push(horario);
  return parts.filter(Boolean).join('\n');
};

// ─── Filtrar sesiones por turno ──────────────────────────────────────────────
export const filterSesionesByTurno = (sesiones, turnoId, gpcToGrupo, grupoToTurno) => {
  return sesiones.filter(s => {
    const grupoId = gpcToGrupo.get(s.ID_GRUPO_PLAN_CURSO) ?? (s.ID_GRUPO || null);
    return grupoId && grupoToTurno.get(grupoId) === turnoId;
  });
};

// ─── Calcular columnas para un conjunto de sesiones y bloques ────────────────
export const buildColumnsForSesiones = (sesiones, allBlocks, programacionToGrupo, gpcToGrupo, grupoToTurno) => {
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
    dateInfos.push({ date, fechaStr, weekday, signature, sigKey });
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

// ─── Core: construir hoja a partir de sesiones ya resueltas ─────────────────
const buildWorksheetCore = (workbook, nombrePlaza, sesiones, resolvedLookups, opts = {}) => {
  const { programacionToGrupo, gpcToGrupo, grupoToTurno, turnosConBloques } = resolvedLookups;

  if (turnosConBloques.length === 0) return false;

  // Calcular el ancho máximo de columnas entre todos los turnos (para el merge del header)
  let maxCols = 1;
  const turnosData = [];
  for (const turno of turnosConBloques) {
    const sesionesDelTurno = filterSesionesByTurno(sesiones, turno.turnoId, gpcToGrupo, grupoToTurno);
    const allBlocks = turno.bloques.map(b => ({ ...b, turnosLabel: turno.turnoNombre }));
    const columns = buildColumnsForSesiones(sesionesDelTurno, allBlocks, programacionToGrupo, gpcToGrupo, grupoToTurno);
    if (columns.length > 0) {
      turnosData.push({ turno, allBlocks, columns, sesionesDelTurno });
      if (columns.length + 1 > maxCols) maxCols = columns.length + 1;
    }
  }

  if (turnosData.length === 0) return false;

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
  const infoFill1     = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
  const infoFill2     = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAFAFA' } };
  const turnoTitleFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
  const thinBorder    = {
    top:    { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    left:   { style: 'thin', color: { argb: 'FF000000' } },
    right:  { style: 'thin', color: { argb: 'FF000000' } }
  };

  // Extraer datos del docente de la primera sesión disponible
  const s0 = sesiones[0] || {};
  const nombreDocente = s0.DOCENTE_NOMBRE_COMPLETO
    ? s0.DOCENTE_NOMBRE_COMPLETO
    : 'Docente no asignado';
  const docenteEmail = s0.DOCENTE_EMAIL || '';
  const docenteTelefono = s0.DOCENTE_TELEFONO || '';
  const periodo = s0.NOMBRE_PERIODO || '';
  const sede    = s0.NOMBRE_SEDE    || '';
  const curso   = s0.NOMBRE_CURSO   || '';

  // ── Fila 1: Título general ────────────────────────────────────────────────
  ws.mergeCells(1, 1, 1, maxCols);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = `HORARIO - ${nombrePlaza || 'Docente'}`;
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = headerFill;
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  titleCell.border = thinBorder;
  ws.getRow(1).height = 28;

  // ── Fila 2: Nombre docente + contacto ────────────────────────────────────────
  ws.mergeCells(2, 1, 2, maxCols);
  const docenteCell = ws.getCell(2, 1);
  const contactoInfo = [docenteEmail && `Email: ${docenteEmail}`, docenteTelefono && `Tel: ${docenteTelefono}`].filter(Boolean).join('   |   ');
  docenteCell.value = `Docente: ${nombreDocente}${contactoInfo ? '   |   ' + contactoInfo : ''}`;
  docenteCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1F2937' } };
  docenteCell.fill = infoFill1;
  docenteCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  docenteCell.border = thinBorder;
  ws.getRow(2).height = contactoInfo ? 24 : 20;

  // ── Fila 3: Período | Sede | Curso ────────────────────────────────────────
  ws.mergeCells(3, 1, 3, maxCols);
  const metaCell = ws.getCell(3, 1);
  metaCell.value = [periodo && `Período: ${periodo}`, sede && `Sede: ${sede}`, curso && `Curso: ${curso}`].filter(Boolean).join('   |   ');
  metaCell.font = { name: 'Arial', size: 10, color: { argb: 'FF4B5563' } };
  metaCell.fill = infoFill2;
  metaCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  metaCell.border = thinBorder;
  ws.getRow(3).height = 18;

  let currentRow = 4;

  // ── Tablas por turno ──────────────────────────────────────────────────────
  for (let ti = 0; ti < turnosData.length; ti++) {
    const { turno, allBlocks, columns } = turnosData[ti];

    // Separación entre turnos (fila vacía)
    if (ti > 0) {
      currentRow++;
    }

    // Título del turno
    ws.mergeCells(currentRow, 1, currentRow, maxCols);
    const turnoTitleCell = ws.getCell(currentRow, 1);
    turnoTitleCell.value = `\u2550\u2550\u2550  ${turno.turnoNombre}  \u2550\u2550\u2550`;
    turnoTitleCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    turnoTitleCell.fill = turnoTitleFill;
    turnoTitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    turnoTitleCell.border = thinBorder;
    ws.getRow(currentRow).height = 22;
    currentRow++;

    // Encabezado de días — fila superior (día) + inferior (fechas)
    const daysHeaderRow = currentRow;
    const datesRow = currentRow + 1;

    const headerA = ws.getCell(daysHeaderRow, 1);
    headerA.value = 'BLOQUE';
    headerA.font = headerFont;
    headerA.fill = headerFill;
    headerA.alignment = { vertical: 'middle', horizontal: 'center' };
    headerA.border = thinBorder;
    ws.getCell(datesRow, 1).fill = headerFill;
    ws.getCell(datesRow, 1).border = thinBorder;
    ws.mergeCells(daysHeaderRow, 1, datesRow, 1);

    columns.forEach((col, idx) => {
      const colNum = idx + 2;
      const wdCell = ws.getCell(daysHeaderRow, colNum);
      wdCell.value = col.weekdayName;
      wdCell.font = headerFont;
      wdCell.fill = headerFill;
      wdCell.alignment = { vertical: 'middle', horizontal: 'center' };
      wdCell.border = thinBorder;
      const dCell = ws.getCell(datesRow, colNum);
      dCell.value = col.dates.map(formatDateShort).join('\n');
      dCell.font = subHeaderFont;
      dCell.fill = headerFill;
      dCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      dCell.border = thinBorder;
    });

    ws.getRow(daysHeaderRow).height = 24;
    ws.getRow(datesRow).height = Math.max(20, Math.max(...columns.map(c => c.dates.length), 1) * 14);
    currentRow += 2;

    // Contenido de bloques
    const signatureToCellContent = (sig) => {
      return allBlocks.map((cb, i) => {
        if (cb.type === 'break') return { type: 'break', label: cb.label, turno: cb.turnosLabel || cb.turnoNombre };
        if (sig[i] && sig[i] !== '__BREAK__') {
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
        if (ci.type !== 'event') { i++; continue; }
        let end = i, j = i + 1;
        while (j < cellInfos.length) {
          const cj = cellInfos[j];
          if (cj.type === 'break') break;
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

    const dataStartRow = currentRow;
    let ordenClase = 0;

    for (let i = 0; i < allBlocks.length; i++) {
      const cb = allBlocks[i];
      const rowNum = dataStartRow + i;
      const aCell = ws.getCell(rowNum, 1);

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
        } else {
          c.value = '';
          c.font = eventFont;
        }
        c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        c.border = thinBorder;
      });

      ws.getRow(rowNum).height = cb.type === 'break' ? 22 : 48;
    }

    // Merge de runs
    columns.forEach((col, idx) => {
      const colNum = idx + 2;
      runsByColumn[idx].forEach(r => {
        if (r.end > r.start) ws.mergeCells(dataStartRow + r.start, colNum, dataStartRow + r.end, colNum);
      });
    });

    currentRow += allBlocks.length;
  }

  ws.getColumn(1).width = 18;
  for (let i = 1; i < maxCols; i++) ws.getColumn(i + 1).width = 24;

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
