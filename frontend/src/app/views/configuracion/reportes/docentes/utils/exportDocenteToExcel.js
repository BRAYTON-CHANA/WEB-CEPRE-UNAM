import ExcelJS from 'exceljs';
import { db } from '@/shared/api';
import {
  buildBulkCache,
  filterSesionesByTurno,
  buildColumnsForSesiones
} from '../../plazas/utils/exportPlazaToExcel';

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

// ─── Resolver lookups para un conjunto de sesiones (individual) ─────────────
const resolveLookupsForSesiones = async (sesiones) => {
  const gpcIds = [...new Set(sesiones.map(s => s.ID_GRUPO_PLAN_CURSO).filter(Boolean))];
  const gpcToGrupo = new Map();
  const grupoIds = new Set();

  for (const gpcId of gpcIds) {
    const rows = await selectAll('GRUPO_PLAN_CURSO', { ID_GRUPO_PLAN_CURSO: gpcId });
    const r = rows[0];
    if (r?.ID_GRUPO) { gpcToGrupo.set(gpcId, r.ID_GRUPO); grupoIds.add(r.ID_GRUPO); }
  }

  const programacionToGrupo = new Map();
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

// ─── Core: construir hoja para un docente ───────────────────────────────────
const buildDocenteWorksheet = (workbook, nombreDocente, sesiones, lookups) => {
  const { programacionToGrupo, gpcToGrupo, grupoToTurno, turnosConBloques } = lookups;

  if (turnosConBloques.length === 0) return false;

  // Agrupar sesiones por plaza
  const sesionesPorPlaza = new Map();
  for (const s of sesiones) {
    const pid = s.ID_PLAZA_DOCENTE;
    if (!pid) continue;
    if (!sesionesPorPlaza.has(pid)) sesionesPorPlaza.set(pid, []);
    sesionesPorPlaza.get(pid).push(s);
  }
  if (sesionesPorPlaza.size === 0) return false;

  // Calcular maxCols para merge del header general
  let maxCols = 2;
  const plazasData = [];
  for (const [idPlaza, sesPlaza] of sesionesPorPlaza.entries()) {
    const s0plz = sesPlaza[0] || {};
    const turnosDeEstaPlaza = [];
    for (const turno of turnosConBloques) {
      const sesTurno = filterSesionesByTurno(sesPlaza, turno.turnoId, gpcToGrupo, grupoToTurno);
      const allBlocks = turno.bloques.map(b => ({ ...b, turnosLabel: turno.turnoNombre }));
      const columns = buildColumnsForSesiones(sesTurno, allBlocks, programacionToGrupo, gpcToGrupo, grupoToTurno);
      if (columns.length > 0) {
        turnosDeEstaPlaza.push({ turno, allBlocks, columns });
        if (columns.length + 1 > maxCols) maxCols = columns.length + 1;
      }
    }
    if (turnosDeEstaPlaza.length > 0) {
      plazasData.push({
        idPlaza,
        identificador: s0plz.DOCENTE_DISPLAY || idPlaza,
        sede: s0plz.NOMBRE_SEDE || '',
        curso: s0plz.NOMBRE_CURSO || '',
        turnos: turnosDeEstaPlaza
      });
    }
  }
  if (plazasData.length === 0) return false;

  // Estilos
  const headerFill     = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D366F' } };
  const headerFont     = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  const subHeaderFont  = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  const blockColFill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
  const blockColFont   = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF2D366F' } };
  const eventFill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD8F1EF' } };
  const eventFont      = { name: 'Arial', size: 9,  color: { argb: 'FF1F2937' } };
  const breakFill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
  const breakFont      = { name: 'Arial', size: 9,  italic: true, color: { argb: 'FF6B7280' } };
  const infoFill       = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAFAFA' } };
  const plazaTitleFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
  const turnoTitleFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
  const thinBorder     = {
    top:    { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    left:   { style: 'thin', color: { argb: 'FF000000' } },
    right:  { style: 'thin', color: { argb: 'FF000000' } }
  };

  const s0 = sesiones[0] || {};
  const periodo = s0.NOMBRE_PERIODO || '';
  const dni     = s0.DOCENTE_DNI    || '';

  const sheetName = `${nombreDocente || 'Docente'}`.slice(0, 31);
  const ws = workbook.addWorksheet(sheetName);

  // ── Fila 1: Título docente ────────────────────────────────────────────────
  ws.mergeCells(1, 1, 1, maxCols);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = `HORARIO - ${nombreDocente || 'Docente'}`;
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = headerFill;
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  titleCell.border = thinBorder;
  ws.getRow(1).height = 28;

  // ── Fila 2: DNI | Período ─────────────────────────────────────────────────
  ws.mergeCells(2, 1, 2, maxCols);
  const infoCell = ws.getCell(2, 1);
  infoCell.value = [dni && `DNI: ${dni}`, periodo && `Período: ${periodo}`].filter(Boolean).join('   |   ');
  infoCell.font = { name: 'Arial', size: 10, color: { argb: 'FF4B5563' } };
  infoCell.fill = infoFill;
  infoCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  infoCell.border = thinBorder;
  ws.getRow(2).height = 18;

  let currentRow = 3;

  // ── Plazas ────────────────────────────────────────────────────────────────
  for (let pi = 0; pi < plazasData.length; pi++) {
    const { identificador, sede, curso, turnos } = plazasData[pi];

    if (pi > 0) currentRow++;

    // Título de plaza — texto negrita azul sobre fondo blanco
    ws.mergeCells(currentRow, 1, currentRow, maxCols);
    const plazaCell = ws.getCell(currentRow, 1);
    plazaCell.value = `PLAZA: ${identificador}${sede ? '  |  Sede: ' + sede : ''}${curso ? '  |  Curso: ' + curso : ''}`;
    plazaCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF2D366F' } };
    plazaCell.fill = plazaTitleFill;
    plazaCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    plazaCell.border = { bottom: { style: 'medium', color: { argb: 'FF2D366F' } }, top: thinBorder.top, left: thinBorder.left, right: thinBorder.right };
    ws.getRow(currentRow).height = 22;
    currentRow++;

    // Turnos de esta plaza
    for (let ti = 0; ti < turnos.length; ti++) {
      const { turno, allBlocks, columns } = turnos[ti];

      if (ti > 0) currentRow++;

      // Título de turno — texto negrita itálica sobre fondo gris claro
      ws.mergeCells(currentRow, 1, currentRow, maxCols);
      const turnoCell = ws.getCell(currentRow, 1);
      turnoCell.value = `  ${turno.turnoNombre}`;
      turnoCell.font = { name: 'Arial', size: 10, bold: true, italic: true, color: { argb: 'FF1F2937' } };
      turnoCell.fill = turnoTitleFill;
      turnoCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 2 };
      turnoCell.border = thinBorder;
      ws.getRow(currentRow).height = 18;
      currentRow++;

      // Encabezado días
      const daysRow  = currentRow;
      const datesRow = currentRow + 1;

      const bHeader = ws.getCell(daysRow, 1);
      bHeader.value = 'BLOQUE';
      bHeader.font = headerFont;
      bHeader.fill = headerFill;
      bHeader.alignment = { vertical: 'middle', horizontal: 'center' };
      bHeader.border = thinBorder;
      ws.getCell(datesRow, 1).fill = headerFill;
      ws.getCell(datesRow, 1).border = thinBorder;
      ws.mergeCells(daysRow, 1, datesRow, 1);

      columns.forEach((col, idx) => {
        const colNum = idx + 2;
        const wdCell = ws.getCell(daysRow, colNum);
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

      ws.getRow(daysRow).height  = 24;
      ws.getRow(datesRow).height = Math.max(20, Math.max(...columns.map(c => c.dates.length), 1) * 14);
      currentRow += 2;

      // Contenido de bloques
      const signatureToCellContent = (sig) => allBlocks.map((cb, i) => {
        if (cb.type === 'break') return { type: 'break', label: cb.label };
        if (sig[i] && sig[i] !== '__BREAK__') {
          const [codigo, curso, nombreCompleto, docente, , grupo] = sig[i].split('|');
          return { type: 'event', key: sig[i], codigo, curso, nombreCompleto, docente, grupo };
        }
        return { type: 'empty' };
      });

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
              const timeRange  = `${startBlock.time} - ${endBlock.endTime}`;
              const [codigo, cursoV, nombreCompleto, docente, , grupo] = run.key.split('|');
              const parts = [];
              if (codigo) parts.push(codigo);
              parts.push(cursoV);
              if (grupo) parts.push(grupo);
              if (nombreCompleto) parts.push(nombreCompleto);
              parts.push(docente);
              parts.push(timeRange);
              c.value = parts.filter(Boolean).join('\n');
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

      columns.forEach((col, idx) => {
        const colNum = idx + 2;
        runsByColumn[idx].forEach(r => {
          if (r.end > r.start) ws.mergeCells(dataStartRow + r.start, colNum, dataStartRow + r.end, colNum);
        });
      });

      currentRow += allBlocks.length;
    }
  }

  ws.getColumn(1).width = 18;
  for (let i = 1; i < maxCols; i++) ws.getColumn(i + 1).width = 24;

  return true;
};

// ════════════════════════════════════════════════════════════════════════════
// EXPORTS PÚBLICOS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Exporta 1 docente a Excel (queries directas)
 */
export const exportDocenteToExcel = async (idDocente, nombreDocente) => {
  try {
    const sesionesResult = await db.select('VW_SESIONES_AGRUPADAS_DESGLOSE', { ID_DOCENTE: idDocente });
    const sesiones = sesionesResult?.data?.records || sesionesResult || [];
    if (sesiones.length === 0) {
      alert('No hay sesiones programadas para este docente');
      return;
    }

    const lookups = await resolveLookupsForSesiones(sesiones);
    if (!lookups || lookups.turnosConBloques.length === 0) {
      alert('No se encontraron datos de horario para este docente');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema Horarios';
    workbook.created = new Date();

    const added = buildDocenteWorksheet(workbook, nombreDocente, sesiones, lookups);
    if (!added) {
      alert('No se encontraron sesiones para exportar');
      return;
    }

    const fileName = `Horario_${nombreDocente || 'Docente'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    await downloadWorkbook(workbook, fileName);
  } catch (error) {
    console.error('Error exportando docente a Excel:', error);
    alert('Error al exportar: ' + error.message);
  }
};

/**
 * Exporta todos los docentes del período (1 hoja por docente)
 */
export const exportAllDocentesToExcel = async (idPeriodo, onProgress) => {
  try {
    const cache = await buildBulkCache(idPeriodo);
    if (!cache) {
      alert('No se encontraron sesiones para el período seleccionado');
      return;
    }

    // Agrupar sesiones por docente
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

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema Horarios';
    workbook.created = new Date();

    let processed = 0;
    let added = 0;

    for (const [idDocente, sesiones] of docentes) {
      const lookups = resolveLookupsFromCache(sesiones, cache);
      if (lookups.turnosConBloques.length > 0) {
        const nombreDocente = sesiones[0]?.DOCENTE_NOMBRE_COMPLETO || `Docente ${idDocente}`;
        const ok = buildDocenteWorksheet(workbook, nombreDocente, sesiones, lookups);
        if (ok) added++;
      }
      processed++;
      if (onProgress) onProgress(processed, docentes.length);
    }

    if (added === 0) {
      alert('No se encontraron sesiones para ningún docente del período');
      return;
    }

    const fileName = `Horarios_Docentes_${new Date().toISOString().split('T')[0]}.xlsx`;
    await downloadWorkbook(workbook, fileName);
  } catch (error) {
    console.error('Error exportando docentes a Excel:', error);
    alert('Error al exportar: ' + error.message);
  }
};
