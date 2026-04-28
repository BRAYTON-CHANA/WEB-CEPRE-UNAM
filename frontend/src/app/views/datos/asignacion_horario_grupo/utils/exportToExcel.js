import ExcelJS from 'exceljs';
import { parseDate } from './transformers';

/**
 * Genera bloques con timeRange igual que useCalendar.generateCustomBlocks
 * @param {Array} customBlocks - [{ duration, type, label, idBloque }]
 * @param {number} startHour - Hora inicio jornada
 * @returns {Array} bloques con time, endTime, timeRange
 */
const generateBlocksWithTime = (customBlocks, startHour) => {
  const startMinutes = startHour * 60;
  let currentMinute = startMinutes;
  const blocks = [];

  customBlocks.forEach((cb, index) => {
    const hour = Math.floor(currentMinute / 60);
    const minute = currentMinute % 60;
    const endMinuteTotal = currentMinute + cb.duration;
    const endHour = Math.floor(endMinuteTotal / 60);
    const endMinute = endMinuteTotal % 60;

    const fmt = (h, m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

    blocks.push({
      index,
      type: cb.type || 'clase',
      label: cb.label || `Bloque ${index + 1}`,
      duration: cb.duration,
      time: fmt(hour, minute),
      endTime: fmt(endHour, endMinute),
      timeRange: `${fmt(hour, minute)} - ${fmt(endHour, endMinute)}`
    });

    currentMinute = endMinuteTotal;
  });

  return blocks;
};

const WEEKDAY_NAMES = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Lun primero
const MONTH_NAMES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

const formatDateShort = (date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = MONTH_NAMES[date.getMonth()];
  return `${day}-${month}`;
};

/**
 * Construye firma de un día: array length = customBlocks.length.
 * Cada posición: 'BREAK' si bloque break, descripción curso si tiene asignación, null si libre.
 */
const buildSignature = (customBlocks, recordsByOrden) => {
  const sig = [];
  for (let i = 0; i < customBlocks.length; i++) {
    const cb = customBlocks[i];
    if (cb.type === 'break') {
      sig.push('__BREAK__');
    } else {
      const rec = recordsByOrden[i + 1]; // ORDEN BD = customBlock index + 1
      if (rec) {
        const desc = `${rec.CODIGO_COMPARTIDO || ''}|${rec.NOMBRE_CURSO || ''}|${rec.NOMBRE_COMPLETO_DOCENTE || 'Sin docente'}`;
        sig.push(desc);
      } else {
        sig.push(null);
      }
    }
  }
  return sig;
};

/**
 * Convierte signature en array de eventos por bloque (índice = customBlocks index)
 */
const signatureToCellContent = (sig, customBlocks, blocksWithTime) => {
  const cells = [];
  for (let i = 0; i < customBlocks.length; i++) {
    const cb = customBlocks[i];
    const block = blocksWithTime[i];
    if (cb.type === 'break') {
      cells.push({ type: 'break', label: cb.label });
    } else if (sig[i] && sig[i] !== '__BREAK__') {
      const [codigo, curso, docente] = sig[i].split('|');
      const text = `${codigo} ${curso}\n${docente}\n${block.timeRange}`;
      cells.push({ type: 'event', text, key: sig[i] });
    } else {
      cells.push({ type: 'empty' });
    }
  }
  return cells;
};

/**
 * Exporta horario de grupo a Excel con agrupamiento de fechas similares
 * @param {Object} asignacionData - Response VW_ASIGNACION_HORARIO {data: {records}}
 * @param {Array} customBlocks - Bloques del horario [{duration, type, label, idBloque}]
 * @param {number} calendarStartHour - Hora inicio jornada (ej: 7)
 * @param {string} grupoNombre - Nombre del grupo
 */
export const exportHorarioToExcel = async (asignacionData, customBlocks, calendarStartHour, grupoNombre) => {
  const records = asignacionData?.data?.records || [];
  const claseRecords = records.filter(r => r.TIPO_BLOQUE === 'clase');

  if (claseRecords.length === 0) {
    alert('No hay asignaciones para exportar');
    return;
  }

  // Agrupar registros por fecha (string DD/MM/YYYY)
  const recordsByDate = new Map();
  for (const r of claseRecords) {
    if (!recordsByDate.has(r.FECHA)) {
      recordsByDate.set(r.FECHA, {});
    }
    recordsByDate.get(r.FECHA)[r.ORDEN] = r;
  }

  // Construir info por fecha: { date, weekday, signature, sigKey }
  const dateInfos = [];
  for (const [fechaStr, recordsByOrden] of recordsByDate.entries()) {
    const date = parseDate(fechaStr);
    const weekday = date.getDay();
    const signature = buildSignature(customBlocks, recordsByOrden);
    const sigKey = signature.map(s => s === null ? '_' : s).join('||');
    dateInfos.push({ date, fechaStr, weekday, signature, sigKey });
  }

  // Agrupar por (weekday, sigKey)
  // Map<weekday, Map<sigKey, { signature, dates: [] }>>
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

  // Construir lista ordenada de columnas
  // Aplanar todos los grupos y ordenar por primera fecha global
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

  // Generar bloques con tiempo
  const blocksWithTime = generateBlocksWithTime(customBlocks, calendarStartHour);

  // === Construir Excel ===
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema Horarios';
  workbook.created = new Date();
  const ws = workbook.addWorksheet(`Horario ${grupoNombre || ''}`.slice(0, 30));

  // Estilos comunes
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

  // Título principal (fila 1)
  ws.mergeCells(1, 1, 1, columns.length + 1);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = `HORARIO - ${grupoNombre || 'Grupo'}`;
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = headerFill;
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  titleCell.border = thinBorder;
  ws.getRow(1).height = 28;

  // Header weekday (fila 2) + sub-header fechas (fila 3)
  // Columna A header: "BLOQUE"
  const headerRow = ws.getRow(2);
  const datesRow = ws.getRow(3);

  const headerA = ws.getCell(2, 1);
  headerA.value = 'BLOQUE';
  headerA.font = headerFont;
  headerA.fill = headerFill;
  headerA.alignment = { vertical: 'middle', horizontal: 'center' };
  headerA.border = thinBorder;

  const datesA = ws.getCell(3, 1);
  datesA.value = '';
  datesA.fill = headerFill;
  datesA.border = thinBorder;

  ws.mergeCells(2, 1, 3, 1);

  columns.forEach((col, idx) => {
    const colNum = idx + 2;
    // Header weekday
    const wdCell = ws.getCell(2, colNum);
    wdCell.value = col.weekdayName;
    wdCell.font = headerFont;
    wdCell.fill = headerFill;
    wdCell.alignment = { vertical: 'middle', horizontal: 'center' };
    wdCell.border = thinBorder;

    // Sub-header fechas (multilínea)
    const dCell = ws.getCell(3, colNum);
    dCell.value = col.dates.map(formatDateShort).join('\n');
    dCell.font = subHeaderFont;
    dCell.fill = headerFill;
    dCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    dCell.border = thinBorder;
  });

  ws.getRow(2).height = 24;
  // Altura fila fechas según número de fechas máximo
  const maxDates = Math.max(...columns.map(c => c.dates.length), 1);
  ws.getRow(3).height = Math.max(20, maxDates * 14);

  // Filas de datos: una por bloque (incluye breaks)
  // Pre-calcular contenido por columna
  const cellsByColumn = columns.map(col => signatureToCellContent(col.signature, customBlocks, blocksWithTime));

  // Pre-calcular runs por columna (autoMerge contiguo, breaks rompen)
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

  const runsByColumn = cellsByColumn.map(computeRuns);

  // Mapa rápido: para cada (col, i) encontrar run que lo contiene
  const findRun = (runs, i) => runs.find(r => i >= r.start && i <= r.end);

  const dataStartRow = 4;
  let ordenClase = 0;
  for (let i = 0; i < customBlocks.length; i++) {
    const cb = customBlocks[i];
    const block = blocksWithTime[i];
    const rowNum = dataStartRow + i;
    const row = ws.getRow(rowNum);

    // Columna A: etiqueta bloque
    const aCell = ws.getCell(rowNum, 1);
    if (cb.type === 'break') {
      aCell.value = `${cb.label}\n${block.timeRange}`;
      aCell.fill = breakFill;
      aCell.font = breakFont;
    } else {
      ordenClase++;
      aCell.value = `Bloque ${ordenClase}\n${block.timeRange}`;
      aCell.fill = blockColFill;
      aCell.font = blockColFont;
    }
    aCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    aCell.border = thinBorder;

    // Para cada columna, llenar celda
    columns.forEach((col, idx) => {
      const colNum = idx + 2;
      const cellInfo = cellsByColumn[idx][i];
      const runs = runsByColumn[idx];
      const run = findRun(runs, i);
      const c = ws.getCell(rowNum, colNum);

      if (run) {
        // Celda pertenece a un run
        if (i === run.start) {
          // Top-left del merge: texto con timeRange combinado
          const startBlock = blocksWithTime[run.start];
          const endBlock = blocksWithTime[run.end];
          const combinedRange = `${startBlock.time} - ${endBlock.endTime}`;
          const [codigo, curso, docente] = run.key.split('|');
          c.value = `${codigo} ${curso}\n${docente}\n${combinedRange}`;
        } else {
          // Dentro del run (incluye break swallow): blank, será mergeada
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

    row.height = cb.type === 'break' ? 22 : 48;
  }

  // === Aplicar merges ===
  columns.forEach((col, idx) => {
    const colNum = idx + 2;
    const runs = runsByColumn[idx];
    runs.forEach(r => {
      if (r.end > r.start) {
        ws.mergeCells(dataStartRow + r.start, colNum, dataStartRow + r.end, colNum);
      }
    });
  });

  // Anchos de columnas
  ws.getColumn(1).width = 22;
  for (let i = 0; i < columns.length; i++) {
    ws.getColumn(i + 2).width = 22;
  }

  // === Descargar ===
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
};
