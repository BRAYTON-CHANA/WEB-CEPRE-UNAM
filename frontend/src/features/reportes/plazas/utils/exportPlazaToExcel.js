import ExcelJS from 'exceljs';
import { db } from '@/shared/api';
import { fetchTurnosConBloques, fetchSesionesContext, selectAll } from '../../shared/turnosData';

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

// ─── Paginación y lookups de turnos viven en shared/turnosData.js ───────────

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

// ─── Resolución de lookups sin cache (modo individual) ──────────────────────
// 1 query JOIN TURNOS×TURNO_BLOQUES vía helper compartido.
const resolveLookupsIndividual = fetchSesionesContext;

// ─── Resolución de lookups CON cache (modo bulk) ─────────────────────────────
const resolveLookupsFromCache = (sesiones, cache) => {
  const { gpcToGrupo, grupoToTurno, turnosConBloquesMap } = cache;

  const programacionToGrupo = new Map();
  const localTurnoIds = new Set();
  for (const s of sesiones) {
    if (s.ID_PROGRAMACION && s.ID_GRUPO) {
      programacionToGrupo.set(s.ID_PROGRAMACION, s.ID_GRUPO);
    }
    if (s.ID_TURNO != null) localTurnoIds.add(s.ID_TURNO);
  }

  const turnosConBloques = [...localTurnoIds]
    .map(tid => turnosConBloquesMap.get(tid))
    .filter(Boolean);

  return { programacionToGrupo, gpcToGrupo, grupoToTurno, turnosConBloques };
};

// ─── Pre-cargar cache para exportaciones bulk ────────────────────────────────
/**
 * Carga las sesiones del período (o solo de las plazas indicadas) y resuelve
 * los lookups de turnos/bloques con 1 query JOIN.
 * plazaIds: opcional — limita las sesiones a esas plazas (ej. una sede).
 */
export const buildBulkCache = async (idPeriodo, plazaIds) => {
  // 1. Sesiones: del período completo o filtradas por plazas (IN chunks)
  let allSesiones;
  if (Array.isArray(plazaIds) && plazaIds.length > 0) {
    allSesiones = [];
    for (let i = 0; i < plazaIds.length; i += 100) {
      const chunk = plazaIds.slice(i, i + 100);
      const placeholders = chunk.map((_, j) => `$${j + 1}`).join(',');
      const rows = await db.rawSelect(
        `SELECT * FROM "VW_SESIONES_AGRUPADAS_DESGLOSE" WHERE "ID_PLAZA_DOCENTE" IN (${placeholders})`,
        ...chunk
      );
      allSesiones.push(...(rows || []));
    }
  } else {
    const filters = {};
    if (idPeriodo) filters.ID_PERIODO = idPeriodo;
    allSesiones = await selectAll('VW_SESIONES_AGRUPADAS_DESGLOSE', filters);
  }

  if (allSesiones.length === 0) return null;

  // 2. Lookups derivados directo de la vista (ID_GRUPO / ID_TURNO por sesión)
  const gpcToGrupo = new Map();
  const grupoToTurno = new Map();
  const allTurnoIds = new Set();
  for (const s of allSesiones) {
    if (s.ID_GRUPO_PLAN_CURSO && s.ID_GRUPO) gpcToGrupo.set(s.ID_GRUPO_PLAN_CURSO, s.ID_GRUPO);
    if (s.ID_GRUPO && s.ID_TURNO) grupoToTurno.set(s.ID_GRUPO, s.ID_TURNO);
    if (s.ID_TURNO != null) allTurnoIds.add(s.ID_TURNO);
  }

  if (allTurnoIds.size === 0) return null;

  // 3. Turnos + bloques en 1 query JOIN (sin descargar tablas completas)
  const turnosConBloquesMap = await fetchTurnosConBloques([...allTurnoIds]);

  // 4. Agrupar sesiones por plaza
  const sesionesPorPlaza = new Map();
  for (const s of allSesiones) {
    const pid = s.ID_PLAZA_DOCENTE;
    if (!pid) continue;
    if (!sesionesPorPlaza.has(pid)) sesionesPorPlaza.set(pid, []);
    sesionesPorPlaza.get(pid).push(s);
  }

  return { gpcToGrupo, grupoToTurno, turnosConBloquesMap, sesionesPorPlaza };
};

// Plazas del período vía VW_REPORTE_PLAZAS (PLAZA_DOCENTE ya no tiene ID_PERIODO/ID_SEDE;
// se derivan de CONVOCATORIA_CURSO → CONVOCATORIA). idSede: undefined = todas,
// null/'VIRTUAL' = plazas virtuales.
export const fetchPlazasPeriodo = async (idPeriodo, idSede = undefined) => {
  const res = await db.select('VW_REPORTE_PLAZAS', idPeriodo ? { ID_PERIODO: idPeriodo } : {});
  const rows = res?.data?.records || res || [];
  return rows.filter(p => {
    if (p.PLAZA_ACTIVO === false) return false;
    if (idSede === undefined) return true;
    if (idSede === null || idSede === 'VIRTUAL') return p.ID_SEDE == null;
    return p.ID_SEDE === idSede;
  });
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

// ─── Resolver el turno de una sesión ─────────────────────────────────────────
export const resolveSesionTurnoId = (s, gpcToGrupo, grupoToTurno) => {
  if (s.ID_TURNO != null) return s.ID_TURNO;
  const grupoId = gpcToGrupo.get(s.ID_GRUPO_PLAN_CURSO) ?? (s.ID_GRUPO || null);
  return grupoId ? grupoToTurno.get(grupoId) : null;
};

// ─── Filtrar sesiones por turno ──────────────────────────────────────────────
export const filterSesionesByTurno = (sesiones, turnoId, gpcToGrupo, grupoToTurno) => {
  return sesiones.filter(s => resolveSesionTurnoId(s, gpcToGrupo, grupoToTurno) === turnoId);
};

// ─── Unir lista en español: A / A y B / A, B y C ─────────────────────────────
export const joinListEs = (items) => {
  const list = items.filter(Boolean);
  if (list.length <= 1) return list[0] || '';
  return `${list.slice(0, -1).join(', ')} y ${list[list.length - 1]}`;
};

// ─── Agrupar turnos compatibles (misma distribución de bloques y horas) ───────
// Devuelve clusters en orden de primera aparición, cada uno con las sesiones
// del docente cuyos turnos pertenecen al cluster y las plazas participantes.
export const clusterTurnosCompatibles = (turnosConBloques, sesiones, gpcToGrupo, grupoToTurno) => {
  const bySig = new Map();
  const clusters = [];
  for (const turno of turnosConBloques) {
    const sig = turno.bloques.map(b => `${b.type}|${b.time}|${b.endTime}`).join('||');
    let c = bySig.get(sig);
    if (!c) {
      c = { turnos: [], turnoIds: new Set(), repTurnoId: turno.turnoId, bloquesBase: turno.bloques };
      bySig.set(sig, c);
      clusters.push(c);
    }
    c.turnos.push(turno);
    c.turnoIds.add(turno.turnoId);
  }

  for (const c of clusters) {
    c.turnoLabel = joinListEs(c.turnos.map(t => t.turnoNombre));
    c.bloques = c.bloquesBase.map(b => ({
      ...b,
      turnoId: c.repTurnoId,
      turnoNombre: c.turnoLabel,
      turnosLabel: c.turnoLabel
    }));
    c.sesiones = sesiones.filter(s => c.turnoIds.has(resolveSesionTurnoId(s, gpcToGrupo, grupoToTurno)));

    const plazasMap = new Map();
    for (const s of c.sesiones) {
      if (!s.ID_PLAZA_DOCENTE || plazasMap.has(s.ID_PLAZA_DOCENTE)) continue;
      plazasMap.set(s.ID_PLAZA_DOCENTE, {
        idPlaza: s.ID_PLAZA_DOCENTE,
        identificador: s.DOCENTE_DISPLAY || String(s.ID_PLAZA_DOCENTE),
        sede: s.NOMBRE_SEDE || '',
        curso: s.NOMBRE_CURSO || ''
      });
    }
    c.plazas = [...plazasMap.values()];
    c.plazasLabel = joinListEs(c.plazas.map(p => `${p.identificador}${p.sede ? ` · ${p.sede}` : ''}${p.curso ? ` · ${p.curso}` : ''}`));
  }

  return clusters.filter(c => c.sesiones.length > 0);
};

// ─── Calcular columnas para un conjunto de sesiones y bloques ────────────────
// agruparDias = true  → separa por día de semana + patrón (headers LUNES, SÁBADO...)
// agruparDias = false → separa solo por patrón (headers DÍA 1, DÍA 2...)
export const buildColumnsForSesiones = (sesiones, allBlocks, programacionToGrupo, gpcToGrupo, grupoToTurno, agruparDias = true) => {
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
      if (sesion) return `${sesion.CODIGO_AREA || ''}|${sesion.NOMBRE_CURSO || ''}|${sesion.DOCENTE_NOMBRE_COMPLETO || ''}|${sesion.DOCENTE_DISPLAY || 'Sin docente'}|${cb.turnoNombre}|${sesion.NOMBRE_GRUPO || ''}|${sesion.NOMBRE_SEDE || 'Virtual'}`;
      return null;
    });

    const sigKey = signature.map(s => s === null ? '_' : s).join('||');
    dateInfos.push({ date, fechaStr, weekday, signature, sigKey });
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

// ─── Core: construir hoja a partir de sesiones ya resueltas ─────────────────
const buildWorksheetCore = (workbook, nombrePlaza, sesiones, resolvedLookups, opts = {}) => {
  const { programacionToGrupo, gpcToGrupo, grupoToTurno, turnosConBloques } = resolvedLookups;

  if (turnosConBloques.length === 0) return false;

  const turnosData = [];
  for (const turno of turnosConBloques) {
    const sesionesDelTurno = filterSesionesByTurno(sesiones, turno.turnoId, gpcToGrupo, grupoToTurno);
    const allBlocks = turno.bloques.map(b => ({ ...b, turnosLabel: turno.turnoNombre }));
    const columns = buildColumnsForSesiones(sesionesDelTurno, allBlocks, programacionToGrupo, gpcToGrupo, grupoToTurno, opts.agruparDias === true);
    if (columns.length > 0) {
      turnosData.push({ turno, allBlocks, columns, sesionesDelTurno });
    }
  }

  if (turnosData.length === 0) return false;

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

  const usedNames = new Set(workbook.worksheets.map(w => w.name));

  // ── Una pestaña por turno ─────────────────────────────────────────────────
  for (let ti = 0; ti < turnosData.length; ti++) {
    const { turno, allBlocks, columns } = turnosData[ti];
    const maxCols = columns.length + 1;

    // Nombre de pestaña: único, sin caracteres inválidos, máx 31 chars
    const baseName = `${nombrePlaza || 'Plaza'} - ${turno.turnoNombre}`
      .replace(/[:*?/\\[\]]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    let wsName = baseName.slice(0, 31) || `Hoja ${ti + 1}`;
    let dup = 2;
    while (usedNames.has(wsName)) {
      wsName = `${baseName.slice(0, 27)}-${dup}`.slice(0, 31);
      dup++;
    }
    usedNames.add(wsName);

    // Crear hoja Excel
    const ws = workbook.addWorksheet(wsName);

    // ── Fila 1: Título general + indicador de hoja ──────────────────────────
    ws.mergeCells(1, 1, 1, maxCols);
    const titleCell = ws.getCell(1, 1);
    titleCell.value = `HORARIO - ${nombrePlaza || 'Docente'}`;
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = headerFill;
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.border = thinBorder;
    ws.getRow(1).height = 28;

    // ── Fila 2: Nombre docente + contacto ────────────────────────────────────
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
        aCell.value = `${cb.label}\n${cb.timeRange}`;
        aCell.fill = breakFill;
        aCell.font = breakFont;
      } else {
        ordenClase++;
        aCell.value = `Bloque ${ordenClase}\n${cb.timeRange}`;
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

    ws.getColumn(1).width = 18;
    for (let i = 1; i < maxCols; i++) ws.getColumn(i + 1).width = 24;
  }

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
export const buildWorksheetForPlazaFromCache = (workbook, idPlaza, nombrePlaza, cache, opts = {}) => {
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
    const plazas = await fetchPlazasPeriodo(idPeriodo, idSede);

    if (plazas.length === 0) {
      alert('No hay plazas docentes para esta sede en el período seleccionado');
      return;
    }

    if (onProgress) onProgress(0, plazas.length);

    const cache = await buildBulkCache(idPeriodo, plazas.map(p => p.ID_PLAZA_DOCENTE));
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
    const plazas = await fetchPlazasPeriodo(idPeriodo);

    if (plazas.length === 0) {
      alert('No hay plazas docentes para el período seleccionado');
      return;
    }

    if (onProgress) onProgress(0, plazas.length);

    const cache = await buildBulkCache(idPeriodo, plazas.map(p => p.ID_PLAZA_DOCENTE));
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
