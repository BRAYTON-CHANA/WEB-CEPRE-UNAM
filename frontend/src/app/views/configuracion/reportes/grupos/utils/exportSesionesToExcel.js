import ExcelJS from 'exceljs';
import { db } from '@/shared/api';

// Trae TODOS los registros superando el límite 1000 de Supabase
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

const parseDate = (fechaStr) => {
  const [day, month, year] = fechaStr.split('/').map(Number);
  return new Date(year, month - 1, day);
};

const WEEKDAY_NAMES = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const MONTH_NAMES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

const formatDateShort = (date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = MONTH_NAMES[date.getMonth()];
  return `${day}-${month}`;
};

export const exportSesionesToExcel = async (idGrupo, grupoNombre) => {
  try {
    const sesionesResult = await db.select('VW_SESIONES_PROGRAMADAS', { ID_GRUPO: idGrupo });
    const sesiones = sesionesResult?.data?.records || sesionesResult || [];

    if (sesiones.length === 0) {
      alert('No hay sesiones programadas para exportar');
      return;
    }

    const grupoResult = await db.select('GRUPOS', { ID_GRUPO: idGrupo });
    const grupo = (grupoResult?.data?.records || grupoResult)?.[0];
    
    if (!grupo) {
      alert('No se pudo obtener información del grupo');
      return;
    }

    const turnoResult = await db.select('TURNOS', { ID_TURNO: grupo.ID_TURNO });
    const turno = (turnoResult?.data?.records || turnoResult)?.[0];

    if (!turno) {
      alert('No se encontró el turno del grupo');
      return;
    }

    const horarioResult = await db.select('HORARIOS', { ID_HORARIO: turno.ID_HORARIO });
    const horario = (horarioResult?.data?.records || horarioResult)?.[0];

    const bloquesResult = await db.select('HORARIO_BLOQUES', { ID_HORARIO: turno.ID_HORARIO });
    const bloques = (bloquesResult?.data?.records || bloquesResult || [])
      .sort((a, b) => a.ORDEN - b.ORDEN);

    if (bloques.length === 0) {
      alert('No se encontraron bloques de horario para este grupo');
      return;
    }

    const horaInicioJornada = parseInt(horario?.HORA_INICIO_JORNADA?.split(':')[0]) || 7;
    const startMinutes = horaInicioJornada * 60;
    let currentMinute = startMinutes;

    const customBlocks = bloques.map((b) => {
      const hour = Math.floor(currentMinute / 60);
      const minute = currentMinute % 60;
      const endMinuteTotal = currentMinute + (b.DURACION || 50);
      const endHour = Math.floor(endMinuteTotal / 60);
      const endMinute = endMinuteTotal % 60;

      const fmt = (h, m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const timeRange = `${fmt(hour, minute)} - ${fmt(endHour, endMinute)}`;

      const block = {
        idBloque: b.ID_BLOQUE,
        duration: b.DURACION || 50,
        type: b.TIPO_BLOQUE?.toLowerCase() || 'clase',
        label: b.ETIQUETA || `Bloque ${b.ORDEN}`,
        orden: b.ORDEN,
        time: fmt(hour, minute),
        endTime: fmt(endHour, endMinute),
        timeRange
      };

      currentMinute = endMinuteTotal;
      return block;
    });

    const sesionesPorFecha = new Map();
    for (const s of sesiones) {
      let fechaStr = s.FECHA;
      if (typeof fechaStr === 'string' && fechaStr.includes('T')) {
        fechaStr = fechaStr.split('T')[0];
      }
      
      if (!sesionesPorFecha.has(fechaStr)) {
        sesionesPorFecha.set(fechaStr, []);
      }
      sesionesPorFecha.get(fechaStr).push(s);
    }

    const dateInfos = [];
    for (const [fechaStr, sesionesDelDia] of sesionesPorFecha.entries()) {
      const date = parseDate(fechaStr.includes('/') ? fechaStr : fechaStr.split('-').reverse().join('/'));
      const weekday = date.getDay();

      const signature = customBlocks.map(cb => {
        if (cb.type === 'break') return '__BREAK__';
        
        const sesion = sesionesDelDia.find(s => s.BLOQUE_ORDEN === cb.orden);
        if (sesion) {
          const desc = `${sesion.CODIGO_AREA || ''}|${sesion.NOMBRE_CURSO || ''}|${sesion.DOCENTE_DISPLAY || 'Sin docente'}`;
          return desc;
        }
        return null;
      });

      const sigKey = signature.map(s => s === null ? '_' : s).join('||');
      dateInfos.push({ date, fechaStr, weekday, signature, sigKey });
    }

    const grouped = new Map();
    for (const info of dateInfos) {
      if (!grouped.has(info.weekday)) {
        grouped.set(info.weekday, new Map());
      }
      const byWeekday = grouped.get(info.weekday);
      if (!byWeekday.has(info.sigKey)) {
        byWeekday.set(info.sigKey, { signature: info.signature, dates: [] });
      }
      byWeekday.get(info.sigKey).dates.push(info.date);
    }

    const columns = [];
    for (const [wd, byWeekday] of grouped.entries()) {
      for (const g of byWeekday.values()) {
        g.dates.sort((a, b) => a - b);
        columns.push({
          weekday: wd,
          weekdayName: WEEKDAY_NAMES[wd],
          dates: g.dates,
          signature: g.signature
        });
      }
    }
    columns.sort((a, b) => a.dates[0] - b.dates[0]);

    if (columns.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema Horarios';
    workbook.created = new Date();
    const ws = workbook.addWorksheet(`Horario ${grupoNombre || ''}`.slice(0, 30));

    const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D366F' } };
    const headerFont = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    const subHeaderFont = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    const blockColFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
    const blockColFont = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF2D366F' } };
    const eventFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD8F1EF' } };
    const eventFont = { name: 'Arial', size: 9, color: { argb: 'FF1F2937' } };
    const breakFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
    const breakFont = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF6B7280' } };
    const thinBorder = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };
    const institutionFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };

    const nombrePeriodo = sesiones[0]?.NOMBRE_PERIODO || 'N/A';

    ws.mergeCells(1, 1, 1, columns.length + 1);
    const institutionCell = ws.getCell(1, 1);
    institutionCell.value = 'CENTRO DE ESTUDIOS PREUNIVERSITARIO - UNAM';
    institutionCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    institutionCell.fill = institutionFill;
    institutionCell.alignment = { vertical: 'middle', horizontal: 'center' };
    institutionCell.border = thinBorder;
    ws.getRow(1).height = 26;

    ws.mergeCells(2, 1, 2, columns.length + 1);
    const cicloCell = ws.getCell(2, 1);
    cicloCell.value = `CICLO DE PREPARACIÓN ${nombrePeriodo.toUpperCase()}`;
    cicloCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cicloCell.fill = institutionFill;
    cicloCell.alignment = { vertical: 'middle', horizontal: 'center' };
    cicloCell.border = thinBorder;
    ws.getRow(2).height = 24;

    ws.mergeCells(3, 1, 3, columns.length + 1);
    const titleCell = ws.getCell(3, 1);
    titleCell.value = `HORARIO - ${grupoNombre || 'Grupo'}`;
    titleCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = headerFill;
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.border = thinBorder;
    ws.getRow(3).height = 26;

    const headerA = ws.getCell(4, 1);
    headerA.value = 'BLOQUE';
    headerA.font = headerFont;
    headerA.fill = headerFill;
    headerA.alignment = { vertical: 'middle', horizontal: 'center' };
    headerA.border = thinBorder;

    ws.getCell(5, 1).fill = headerFill;
    ws.getCell(5, 1).border = thinBorder;
    ws.mergeCells(4, 1, 5, 1);

    columns.forEach((col, idx) => {
      const colNum = idx + 2;
      const wdCell = ws.getCell(4, colNum);
      wdCell.value = col.weekdayName;
      wdCell.font = headerFont;
      wdCell.fill = headerFill;
      wdCell.alignment = { vertical: 'middle', horizontal: 'center' };
      wdCell.border = thinBorder;

      const dCell = ws.getCell(5, colNum);
      dCell.value = col.dates.map(formatDateShort).join('\n');
      dCell.font = subHeaderFont;
      dCell.fill = headerFill;
      dCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      dCell.border = thinBorder;
    });

    ws.getRow(4).height = 24;
    const maxDates = Math.max(...columns.map(c => c.dates.length), 1);
    ws.getRow(5).height = Math.max(20, maxDates * 14);

    const signatureToCellContent = (sig) => {
      const cells = [];
      for (let i = 0; i < customBlocks.length; i++) {
        const cb = customBlocks[i];
        if (cb.type === 'break') {
          cells.push({ type: 'break', label: cb.label });
        } else if (sig[i] && sig[i] !== '__BREAK__') {
          const [codigo, curso, docente] = sig[i].split('|');
          const text = `${codigo} ${curso}\n${docente}\n${cb.timeRange}`;
          cells.push({ type: 'event', text, key: sig[i] });
        } else {
          cells.push({ type: 'empty' });
        }
      }
      return cells;
    };

    const computeRuns = (cellInfos) => {
      const runs = [];
      let i = 0;
      while (i < cellInfos.length) {
        const ci = cellInfos[i];
        if (ci.type !== 'event') { i++; continue; }
        let end = i;
        let j = i + 1;
        while (j < cellInfos.length) {
          const cj = cellInfos[j];
          if (cj.type === 'event' && cj.key === ci.key) {
            end = j; j++;
          } else {
            break;
          }
        }
        runs.push({ start: i, end, key: ci.key });
        i = end + 1;
      }
      return runs;
    };

    const cellsByColumn = columns.map(col => signatureToCellContent(col.signature));
    const runsByColumn = cellsByColumn.map(computeRuns);
    const findRun = (runs, i) => runs.find(r => i >= r.start && i <= r.end);

    const dataStartRow = 6;
    let ordenClase = 0;
    for (let i = 0; i < customBlocks.length; i++) {
      const cb = customBlocks[i];
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
        const runs = runsByColumn[idx];
        const run = findRun(runs, i);
        const c = ws.getCell(rowNum, colNum);

        if (run) {
          if (i === run.start) {
            const startBlock = customBlocks[run.start];
            const endBlock = customBlocks[run.end];
            const combinedRange = `${startBlock.time} - ${endBlock.endTime}`;
            const [codigo, curso, docente] = run.key.split('|');
            c.value = `${codigo} ${curso}\n${docente}\n${combinedRange}`;
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
      const runs = runsByColumn[idx];
      runs.forEach(r => {
        if (r.end > r.start) {
          ws.mergeCells(dataStartRow + r.start, colNum, dataStartRow + r.end, colNum);
        }
      });
    });

    ws.getColumn(1).width = 15;
    for (let i = 0; i < columns.length; i++) {
      ws.getColumn(i + 2).width = 22;
    }

    const fileName = `Horario_${grupoNombre || 'Grupo'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    await workbook.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    });

  } catch (error) {
    console.error('Error exportando a Excel:', error);
    alert('Error al exportar: ' + error.message);
  }
};

export const exportAllSesionesToExcel = async (grupos) => {
  try {
    if (!grupos || grupos.length === 0) {
      alert('No hay grupos para exportar');
      return;
    }

    const grupoIds = grupos
      .map(g => g.ID_GRUPO)
      .filter(id => id !== null && id !== undefined);

    if (grupoIds.length === 0) {
      alert('No hay grupos válidos para exportar');
      return;
    }

    // ── 1. Sesiones por grupo (paginado, 1 query por grupo) ──────────────
    const sesionesPorGrupo = new Map();
    for (const idGrupo of grupoIds) {
      const rows = await selectAll('VW_SESIONES_PROGRAMADAS', { ID_GRUPO: idGrupo });
      sesionesPorGrupo.set(idGrupo, rows);
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

    // ── Construir customBlocks por turno ───────────────────────────────────
    const customBlocksByTurno = new Map();
    for (const [turnoId, turno] of turnosMap) {
      if (!turno.ID_HORARIO) continue;
      const horario = horariosMap.get(turno.ID_HORARIO);
      const bloques = bloquesMap.get(turno.ID_HORARIO) || [];
      if (bloques.length === 0) continue;

      const horaInicioJornada = parseInt(horario?.HORA_INICIO_JORNADA?.split(':')[0]) || 7;
      let currentMinute = horaInicioJornada * 60;

      const customBlocks = bloques.map((b) => {
        const hour = Math.floor(currentMinute / 60);
        const minute = currentMinute % 60;
        const endMinuteTotal = currentMinute + (b.DURACION || 50);
        const endHour = Math.floor(endMinuteTotal / 60);
        const endMinute = endMinuteTotal % 60;
        const fmt = (h, m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
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
      customBlocksByTurno.set(turnoId, customBlocks);
    }

    // ── Construir workbook ─────────────────────────────────────────────────
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema Horarios';
    workbook.created = new Date();

    let gruposExportados = 0;
    let gruposSinSesiones = 0;

    for (const grupo of grupos) {
      const idGrupo = grupo.ID_GRUPO;
      if (!idGrupo) continue;

      const nombreGrupo = grupo.NOMBRE_GRUPO || grupo.CODIGO_GRUPO || `Grupo_${idGrupo}`;
      const sesiones = sesionesPorGrupo.get(idGrupo) || [];

      if (sesiones.length === 0) { gruposSinSesiones++; continue; }

      const grupoInfo = gruposMap.get(idGrupo);
      if (!grupoInfo) { gruposSinSesiones++; continue; }

      const turno = turnosMap.get(grupoInfo.ID_TURNO);
      if (!turno) { gruposSinSesiones++; continue; }

      const customBlocks = customBlocksByTurno.get(turno.ID_TURNO);
      if (!customBlocks || customBlocks.length === 0) { gruposSinSesiones++; continue; }

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
          const sesion = sesionesDelDia.find(s => s.BLOQUE_ORDEN === cb.orden);
          if (sesion) return `${sesion.CODIGO_AREA || ''}|${sesion.NOMBRE_CURSO || ''}|${sesion.DOCENTE_DISPLAY || 'Sin docente'}`;
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

      if (columns.length === 0) { gruposSinSesiones++; continue; }

      const ws = workbook.addWorksheet(nombreGrupo.slice(0, 30));

      const headerFill    = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D366F' } };
      const headerFont    = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      const subHeaderFont = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      const blockColFill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
      const blockColFont  = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF2D366F' } };
      const eventFill     = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD8F1EF' } };
      const eventFont     = { name: 'Arial', size: 9, color: { argb: 'FF1F2937' } };
      const breakFill     = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
      const breakFont     = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF6B7280' } };
      const thinBorder    = {
        top:    { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left:   { style: 'thin', color: { argb: 'FF000000' } },
        right:  { style: 'thin', color: { argb: 'FF000000' } }
      };
      const institutionFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
      const nombrePeriodo = sesiones[0]?.NOMBRE_PERIODO || 'N/A';

      ws.mergeCells(1, 1, 1, columns.length + 1);
      const ic = ws.getCell(1, 1);
      ic.value = 'CENTRO DE ESTUDIOS PREUNIVERSITARIO - UNAM';
      ic.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
      ic.fill = institutionFill;
      ic.alignment = { vertical: 'middle', horizontal: 'center' };
      ic.border = thinBorder;
      ws.getRow(1).height = 26;

      ws.mergeCells(2, 1, 2, columns.length + 1);
      const cc = ws.getCell(2, 1);
      cc.value = `CICLO DE PREPARACIÓN ${nombrePeriodo.toUpperCase()}`;
      cc.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cc.fill = institutionFill;
      cc.alignment = { vertical: 'middle', horizontal: 'center' };
      cc.border = thinBorder;
      ws.getRow(2).height = 24;

      ws.mergeCells(3, 1, 3, columns.length + 1);
      const tc = ws.getCell(3, 1);
      tc.value = `HORARIO - ${nombreGrupo}`;
      tc.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
      tc.fill = headerFill;
      tc.alignment = { vertical: 'middle', horizontal: 'center' };
      tc.border = thinBorder;
      ws.getRow(3).height = 26;

      ws.getCell(4, 1).value = 'BLOQUE';
      ws.getCell(4, 1).font = headerFont;
      ws.getCell(4, 1).fill = headerFill;
      ws.getCell(4, 1).alignment = { vertical: 'middle', horizontal: 'center' };
      ws.getCell(4, 1).border = thinBorder;
      ws.getCell(5, 1).fill = headerFill;
      ws.getCell(5, 1).border = thinBorder;
      ws.mergeCells(4, 1, 5, 1);

      columns.forEach((col, idx) => {
        const colNum = idx + 2;
        ws.getCell(4, colNum).value = col.weekdayName;
        ws.getCell(4, colNum).font = headerFont;
        ws.getCell(4, colNum).fill = headerFill;
        ws.getCell(4, colNum).alignment = { vertical: 'middle', horizontal: 'center' };
        ws.getCell(4, colNum).border = thinBorder;
        ws.getCell(5, colNum).value = col.dates.map(formatDateShort).join('\n');
        ws.getCell(5, colNum).font = subHeaderFont;
        ws.getCell(5, colNum).fill = headerFill;
        ws.getCell(5, colNum).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        ws.getCell(5, colNum).border = thinBorder;
      });

      ws.getRow(4).height = 24;
      ws.getRow(5).height = Math.max(20, Math.max(...columns.map(c => c.dates.length), 1) * 14);

      const signatureToCellContent = (sig) => {
        return customBlocks.map((cb, i) => {
          if (cb.type === 'break') return { type: 'break', label: cb.label };
          if (sig[i] && sig[i] !== '__BREAK__') {
            const [codigo, curso, docente] = sig[i].split('|');
            return { type: 'event', text: `${codigo} ${curso}\n${docente}\n${cb.timeRange}`, key: sig[i] };
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
            if (cellInfos[j].type === 'event' && cellInfos[j].key === ci.key) { end = j; j++; } else break;
          }
          runs.push({ start: i, end, key: ci.key });
          i = end + 1;
        }
        return runs;
      };

      const cellsByColumn = columns.map(col => signatureToCellContent(col.signature));
      const runsByColumn  = cellsByColumn.map(computeRuns);
      const findRun = (runs, i) => runs.find(r => i >= r.start && i <= r.end);

      const dataStartRow = 6;
      let ordenClase = 0;
      for (let i = 0; i < customBlocks.length; i++) {
        const cb = customBlocks[i];
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
              const sb = customBlocks[run.start], eb = customBlocks[run.end];
              const [codigo, curso, docente] = run.key.split('|');
              c.value = `${codigo} ${curso}\n${docente}\n${sb.time} - ${eb.endTime}`;
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

      ws.getColumn(1).width = 15;
      for (let i = 0; i < columns.length; i++) ws.getColumn(i + 2).width = 22;

      gruposExportados++;
    }

    if (gruposExportados === 0) {
      alert('No se encontraron grupos con sesiones para exportar');
      return;
    }

    const fileName = `Horarios_Grupos_${new Date().toISOString().split('T')[0]}.xlsx`;
    await workbook.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    });

  } catch (error) {
    console.error('Error exportando todos los grupos:', error);
    alert('Error al exportar: ' + error.message);
  }
};
