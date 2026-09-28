import ExcelJS from 'exceljs';
import { db } from '@/shared/api';
import { fetchTurnosConBloques } from '../../shared/turnosData';
import { buildGrupoColumns, fetchGruposExportData, formatDateShort } from './gruposExportData';
import { sortBySedeArea } from './sedeArea';

const buildCellValue = (codigo, curso, nombreCompleto, docente, horario, opts = {}) => {
  const parts = [];
  if (opts.showCodigo !== false && codigo) parts.push(codigo);
  parts.push(curso);
  if (opts.showNombreDocente !== false && nombreCompleto) parts.push(nombreCompleto);
  if (opts.showDocente !== false) parts.push(docente);
  if (opts.showHorario !== false) parts.push(horario);
  return parts.filter(Boolean).join('\n');
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

const newWorkbook = () => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema Horarios';
  workbook.created = new Date();
  return workbook;
};

// ─── Construir la hoja de horario de un grupo ────────────────────────────────

export const buildGrupoWorksheet = (workbook, sheetName, nombreGrupo, nombrePeriodo, nombreSede, columns, customBlocks, opts = {}) => {
  const ws = workbook.addWorksheet(sheetName);

  const headerFill    = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D366F' } };
  const headerFont    = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  const subHeaderFont = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  const blockColFill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
  const blockColFont  = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF2D366F' } };
  const eventFill     = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD8F1EF' } };
  const eventFont     = { name: 'Arial', size: 10, color: { argb: 'FF1F2937' } };
  const breakFill     = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
  const breakFont     = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF6B7280' } };
  const thinBorder    = {
    top:    { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    left:   { style: 'thin', color: { argb: 'FF000000' } },
    right:  { style: 'thin', color: { argb: 'FF000000' } }
  };
  const institutionFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };

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
  cc.value = `CICLO DE PREPARACIÓN ${(nombrePeriodo || 'N/A').toUpperCase()}`;
  cc.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  cc.fill = institutionFill;
  cc.alignment = { vertical: 'middle', horizontal: 'center' };
  cc.border = thinBorder;
  ws.getRow(2).height = 24;

  ws.mergeCells(3, 1, 3, columns.length + 1);
  const tc = ws.getCell(3, 1);
  tc.value = `HORARIO - ${nombreSede} - ${nombreGrupo || 'Grupo'}`;
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
          const [codigo, curso, nombreCompleto, docente] = run.key.split('|');
          c.value = buildCellValue(codigo, curso, nombreCompleto, docente, `${sb.time} - ${eb.endTime}`, opts);
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
    ws.getRow(rowNum).height = cb.type === 'break' ? 26 : 56;
  }

  columns.forEach((col, idx) => {
    const colNum = idx + 2;
    runsByColumn[idx].forEach(r => {
      if (r.end > r.start) ws.mergeCells(dataStartRow + r.start, colNum, dataStartRow + r.end, colNum);
    });
  });

  ws.getColumn(1).width = 15;
  for (let i = 0; i < columns.length; i++) ws.getColumn(i + 2).width = 22;

  return ws;
};

// ─── Fetch datos de un solo grupo ────────────────────────────────────────────

const fetchGrupoData = async (idGrupo, idTurno) => {
  const sesionesResult = await db.select('VW_SESIONES_AGRUPADAS_DESGLOSE', { ID_GRUPO: idGrupo });
  const sesiones = sesionesResult?.data?.records || sesionesResult || [];
  if (sesiones.length === 0) return null;

  const turnoId = idTurno ?? sesiones.find(s => s.ID_TURNO != null)?.ID_TURNO;
  if (turnoId == null) return null;

  const turnosMap = await fetchTurnosConBloques([turnoId]);
  const customBlocks = turnosMap.get(turnoId)?.bloques || [];
  if (customBlocks.length === 0) return null;

  return { sesiones, customBlocks };
};

// ════════════════════════════════════════════════════════════════════════════
// EXPORTS PÚBLICOS
// ════════════════════════════════════════════════════════════════════════════

export const exportSesionesToExcel = async (idGrupo, grupoNombre, opts = {}) => {
  try {
    const data = await fetchGrupoData(idGrupo, opts.idTurno);
    if (!data) {
      alert('No hay sesiones o bloques programados para exportar');
      return;
    }
    const { sesiones, customBlocks } = data;

    const columns = buildGrupoColumns(sesiones, customBlocks, opts.agruparDias === true);
    if (columns.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    const workbook = newWorkbook();
    const sheetName = `Horario ${grupoNombre || ''}`.replace(/[*?:\\/\[\]]/g, '-').slice(0, 31);
    const nombrePeriodo = sesiones[0]?.NOMBRE_PERIODO || 'N/A';
    const nombreSede = sesiones[0]?.NOMBRE_SEDE || 'Virtual';
    buildGrupoWorksheet(workbook, sheetName, grupoNombre, nombrePeriodo, nombreSede, columns, customBlocks, opts);

    await downloadWorkbook(workbook, `Horario_${grupoNombre || 'Grupo'}_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Error exportando a Excel:', error);
    alert('Error al exportar: ' + error.message);
  }
};

export const exportAllSesionesToExcel = async (grupos, opts = {}) => {
  try {
    if (!grupos || grupos.length === 0) {
      alert('No hay grupos para exportar');
      return;
    }

    // Orden sede → área → código de grupo → hojas ordenadas en el Excel
    const ordered = sortBySedeArea(grupos.filter(g => g.ID_GRUPO != null));
    if (ordered.length === 0) {
      alert('No hay grupos válidos para exportar');
      return;
    }

    const { sesionesPorGrupo, customBlocksByTurno } = await fetchGruposExportData(ordered);

    const workbook = newWorkbook();
    let gruposExportados = 0;
    const usedSheetNames = new Set();

    for (const grupo of ordered) {
      const idGrupo = grupo.ID_GRUPO;
      const nombreGrupo = grupo.NOMBRE_GRUPO || grupo.CODIGO_GRUPO || `Grupo_${idGrupo}`;
      const sesiones = sesionesPorGrupo.get(idGrupo) || [];
      if (sesiones.length === 0) continue;

      const customBlocks = customBlocksByTurno.get(grupo.ID_TURNO)?.bloques;
      if (!customBlocks || customBlocks.length === 0) continue;

      const columns = buildGrupoColumns(sesiones, customBlocks, opts.agruparDias === true);
      if (columns.length === 0) continue;

      let sheetName = String(grupo.CODIGO_GRUPO || nombreGrupo).replace(/[*?:\\/\[\]]/g, '-').slice(0, 31);
      if (usedSheetNames.has(sheetName)) {
        const base = sheetName.slice(0, 26);
        let n = 2;
        while (usedSheetNames.has(`${base}-${n}`)) n++;
        sheetName = `${base}-${n}`;
      }
      usedSheetNames.add(sheetName);

      const nombrePeriodo = sesiones[0]?.NOMBRE_PERIODO || 'N/A';
      const nombreSede = sesiones[0]?.NOMBRE_SEDE || 'Virtual';
      buildGrupoWorksheet(workbook, sheetName, nombreGrupo, nombrePeriodo, nombreSede, columns, customBlocks, opts);
      gruposExportados++;
    }

    if (gruposExportados === 0) {
      alert('No se encontraron grupos con sesiones para exportar');
      return;
    }

    await downloadWorkbook(workbook, `Horarios_Grupos_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Error exportando todos los grupos:', error);
    alert('Error al exportar: ' + error.message);
  }
};
