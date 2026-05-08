import ExcelJS from 'exceljs';
import { db } from '@/shared/api';

/**
 * Parsea fecha DD/MM/YYYY a Date
 */
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

/**
 * Exporta sesiones programadas de un grupo a Excel en formato horario
 * @param {number} idGrupo - ID del grupo
 * @param {string} grupoNombre - Nombre del grupo para el título
 */
export const exportSesionesToExcel = async (idGrupo, grupoNombre) => {
  try {
    // 1. Obtener sesiones del grupo
    const sesionesResult = await db.select('VW_SESIONES_PROGRAMADAS', { ID_GRUPO: idGrupo });
    const sesiones = sesionesResult?.data?.records || sesionesResult || [];

    if (sesiones.length === 0) {
      alert('No hay sesiones programadas para exportar');
      return;
    }

    // 2. Obtener bloques del horario del grupo (via turno)
    // Primero necesitamos el ID_TURNO del grupo, luego el ID_HORARIO del turno
    const grupoResult = await db.select('GRUPOS', { ID_GRUPO: idGrupo });
    const grupo = (grupoResult?.data?.records || grupoResult)?.[0];
    
    if (!grupo) {
      alert('No se pudo obtener información del grupo');
      return;
    }

    // Obtener el turno para conseguir el ID_HORARIO
    const turnoResult = await db.select('TURNOS', { ID_TURNO: grupo.ID_TURNO });
    const turno = (turnoResult?.data?.records || turnoResult)?.[0];

    if (!turno) {
      alert('No se encontró el turno del grupo');
      return;
    }

    // Obtener el horario para conseguir HORA_INICIO_JORNADA
    const horarioResult = await db.select('HORARIOS', { ID_HORARIO: turno.ID_HORARIO });
    const horario = (horarioResult?.data?.records || horarioResult)?.[0];

    // Obtener bloques del horario
    const bloquesResult = await db.select('HORARIO_BLOQUES', { ID_HORARIO: turno.ID_HORARIO });
    const bloques = (bloquesResult?.data?.records || bloquesResult || [])
      .sort((a, b) => a.ORDEN - b.ORDEN);

    if (bloques.length === 0) {
      alert('No se encontraron bloques de horario para este grupo');
      return;
    }

    // 3. Generar bloques con tiempos (simular customBlocks)
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

    // 4. Agrupar sesiones por fecha
    const sesionesPorFecha = new Map();
    for (const s of sesiones) {
      // Convertir fecha a string consistente
      let fechaStr = s.FECHA;
      if (typeof fechaStr === 'string' && fechaStr.includes('T')) {
        fechaStr = fechaStr.split('T')[0];
      }
      
      if (!sesionesPorFecha.has(fechaStr)) {
        sesionesPorFecha.set(fechaStr, []);
      }
      sesionesPorFecha.get(fechaStr).push(s);
    }

    // 5. Construir info por fecha con firma de bloques
    const dateInfos = [];
    for (const [fechaStr, sesionesDelDia] of sesionesPorFecha.entries()) {
      const date = parseDate(fechaStr.includes('/') ? fechaStr : fechaStr.split('-').reverse().join('/'));
      const weekday = date.getDay();

      // Construir firma: qué hay en cada bloque
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

    // 6. Agrupar por (weekday, sigKey)
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

    // 7. Construir columnas ordenadas
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

    // 8. === Construir Excel ===
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema Horarios';
    workbook.created = new Date();
    const ws = workbook.addWorksheet(`Horario ${grupoNombre || ''}`.slice(0, 30));

    // Estilos
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

    // Título principal
    ws.mergeCells(1, 1, 1, columns.length + 1);
    const titleCell = ws.getCell(1, 1);
    titleCell.value = `HORARIO - ${grupoNombre || 'Grupo'}`;
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = headerFill;
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.border = thinBorder;
    ws.getRow(1).height = 28;

    // Header weekday + fechas
    const headerRow = ws.getRow(2);
    const datesRow = ws.getRow(3);

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
    const maxDates = Math.max(...columns.map(c => c.dates.length), 1);
    ws.getRow(3).height = Math.max(20, maxDates * 14);

    // 9. Calcular runs para merge
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

    // 10. Filas de datos
    const dataStartRow = 4;
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

    // 11. Aplicar merges
    columns.forEach((col, idx) => {
      const colNum = idx + 2;
      const runs = runsByColumn[idx];
      runs.forEach(r => {
        if (r.end > r.start) {
          ws.mergeCells(dataStartRow + r.start, colNum, dataStartRow + r.end, colNum);
        }
      });
    });

    // 12. Anchos y descarga
    ws.getColumn(1).width = 22;
    for (let i = 0; i < columns.length; i++) {
      ws.getColumn(i + 2).width = 22;
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = (grupoNombre || 'Horario').replace(/[^a-zA-Z0-9]/g, '_');
    a.download = `Horario_${safeName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Error exportando sesiones:', error);
    alert('Error al exportar: ' + error.message);
  }
};

/**
 * Exporta sesiones de todos los grupos a un Excel con múltiples hojas
 * @param {Array} grupos - Array de grupos desde VW_GRUPOS
 */
export const exportAllSesionesToExcel = async (grupos) => {
  try {
    if (!grupos || grupos.length === 0) {
      alert('No hay grupos para exportar');
      return;
    }

    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema Horarios';
    workbook.created = new Date();

    let gruposExportados = 0;
    let gruposSinSesiones = 0;

    // Procesar cada grupo
    for (const grupo of grupos) {
      const idGrupo = grupo.ID_GRUPO;
      
      // Saltar grupos sin ID válido
      if (!idGrupo || idGrupo === null || idGrupo === undefined) {
        continue;
      }
      
      const nombreGrupo = grupo.NOMBRE_GRUPO || grupo.CODIGO_GRUPO || `Grupo_${idGrupo}`;
      const sheetName = nombreGrupo.slice(0, 30); // Excel limita nombres de hoja a 31 chars

      // Obtener sesiones del grupo
      const sesionesResult = await db.select('VW_SESIONES_PROGRAMADAS', { ID_GRUPO: idGrupo });
      const sesiones = sesionesResult?.data?.records || sesionesResult || [];

      if (sesiones.length === 0) {
        gruposSinSesiones++;
        continue; // Saltar grupos sin sesiones
      }

      // Obtener información del horario
      const grupoResult = await db.select('GRUPOS', { ID_GRUPO: idGrupo });
      const grupoData = (grupoResult?.data?.records || grupoResult)?.[0];
      
      if (!grupoData) continue;

      const turnoResult = await db.select('TURNOS', { ID_TURNO: grupoData.ID_TURNO });
      const turno = (turnoResult?.data?.records || turnoResult)?.[0];
      if (!turno) continue;

      const horarioResult = await db.select('HORARIOS', { ID_HORARIO: turno.ID_HORARIO });
      const horario = (horarioResult?.data?.records || horarioResult)?.[0];

      const bloquesResult = await db.select('HORARIO_BLOQUES', { ID_HORARIO: turno.ID_HORARIO });
      const bloques = (bloquesResult?.data?.records || bloquesResult || [])
        .sort((a, b) => a.ORDEN - b.ORDEN);

      if (bloques.length === 0) continue;

      // Crear hoja para este grupo
      const ws = workbook.addWorksheet(sheetName);

      // Generar customBlocks
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
        const block = {
          idBloque: b.ID_BLOQUE,
          duration: b.DURACION || 50,
          type: b.TIPO_BLOQUE?.toLowerCase() || 'clase',
          label: b.ETIQUETA || `Bloque ${b.ORDEN}`,
          orden: b.ORDEN,
          time: fmt(hour, minute),
          endTime: fmt(endHour, endMinute),
          timeRange: `${fmt(hour, minute)} - ${fmt(endHour, endMinute)}`
        };
        currentMinute = endMinuteTotal;
        return block;
      });

      // Procesar sesiones por fecha
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

      // Construir columnas
      const WEEKDAY_NAMES = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
      const MONTH_NAMES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
      const parseDate = (fechaStr) => {
        if (fechaStr.includes('/')) {
          const [day, month, year] = fechaStr.split('/').map(Number);
          return new Date(year, month - 1, day);
        } else {
          const [year, month, day] = fechaStr.split('-').map(Number);
          return new Date(year, month - 1, day);
        }
      };
      const formatDateShort = (date) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = MONTH_NAMES[date.getMonth()];
        return `${day}-${month}`;
      };

      const dateInfos = [];
      for (const [fechaStr, sesionesDelDia] of sesionesPorFecha.entries()) {
        const date = parseDate(fechaStr);
        const weekday = date.getDay();
        const signature = customBlocks.map(cb => {
          if (cb.type === 'break') return '__BREAK__';
          const sesion = sesionesDelDia.find(s => s.BLOQUE_ORDEN === cb.orden);
          if (sesion) {
            return `${sesion.CODIGO_AREA || ''}|${sesion.NOMBRE_CURSO || ''}|${sesion.DOCENTE_DISPLAY || 'Sin docente'}`;
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

      if (columns.length === 0) continue;

      // Estilos
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

      // Título
      ws.mergeCells(1, 1, 1, columns.length + 1);
      const titleCell = ws.getCell(1, 1);
      titleCell.value = `HORARIO - ${nombreGrupo}`;
      titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = headerFill;
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      titleCell.border = thinBorder;
      ws.getRow(1).height = 28;

      // Headers
      ws.getCell(2, 1).value = 'BLOQUE';
      ws.getCell(2, 1).font = headerFont;
      ws.getCell(2, 1).fill = headerFill;
      ws.getCell(2, 1).alignment = { vertical: 'middle', horizontal: 'center' };
      ws.getCell(2, 1).border = thinBorder;
      ws.getCell(3, 1).fill = headerFill;
      ws.getCell(3, 1).border = thinBorder;
      ws.mergeCells(2, 1, 3, 1);

      columns.forEach((col, idx) => {
        const colNum = idx + 2;
        ws.getCell(2, colNum).value = col.weekdayName;
        ws.getCell(2, colNum).font = headerFont;
        ws.getCell(2, colNum).fill = headerFill;
        ws.getCell(2, colNum).alignment = { vertical: 'middle', horizontal: 'center' };
        ws.getCell(2, colNum).border = thinBorder;
        ws.getCell(3, colNum).value = col.dates.map(formatDateShort).join('\n');
        ws.getCell(3, colNum).font = subHeaderFont;
        ws.getCell(3, colNum).fill = headerFill;
        ws.getCell(3, colNum).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        ws.getCell(3, colNum).border = thinBorder;
      });

      ws.getRow(2).height = 24;
      const maxDates = Math.max(...columns.map(c => c.dates.length), 1);
      ws.getRow(3).height = Math.max(20, maxDates * 14);

      // Datos
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

      const dataStartRow = 4;
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

      // Merges
      columns.forEach((col, idx) => {
        const colNum = idx + 2;
        const runs = runsByColumn[idx];
        runs.forEach(r => {
          if (r.end > r.start) {
            ws.mergeCells(dataStartRow + r.start, colNum, dataStartRow + r.end, colNum);
          }
        });
      });

      // Anchos
      ws.getColumn(1).width = 22;
      for (let i = 0; i < columns.length; i++) {
        ws.getColumn(i + 2).width = 22;
      }

      gruposExportados++;
    }

    if (gruposExportados === 0) {
      alert('Ningún grupo tiene sesiones para exportar');
      return;
    }

    // Descargar archivo
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fecha = new Date().toISOString().slice(0, 10);
    a.download = `Horarios_Grupos_${fecha}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (gruposSinSesiones > 0) {
      alert(`Exportados ${gruposExportados} grupos. ${gruposSinSesiones} grupos sin sesiones.`);
    }

  } catch (error) {
    console.error('Error exportando todos los grupos:', error);
    alert('Error al exportar: ' + error.message);
  }
};
