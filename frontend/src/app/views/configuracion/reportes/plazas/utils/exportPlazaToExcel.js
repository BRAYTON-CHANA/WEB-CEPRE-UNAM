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

/**
 * Exporta sesiones programadas de una plaza docente a Excel
 * @param {number} idPlaza - ID de la plaza docente
 * @param {string} nombrePlaza - Nombre/identificador de la plaza
 */
export const exportPlazaToExcel = async (idPlaza, nombrePlaza) => {
  try {
    // 1. Obtener sesiones de la plaza docente desde la vista
    const sesionesResult = await db.select('VW_SESIONES_PROGRAMADAS', { ID_PLAZA_DOCENTE: idPlaza });
    const sesiones = sesionesResult?.data?.records || sesionesResult || [];

    if (sesiones.length === 0) {
      alert('No hay sesiones programadas para esta plaza docente');
      return;
    }

    // 2. Obtener los grupos únicos de las sesiones
    // Sesion -> ID_PROGRAMACION -> PROGRAMACION_GRUPO -> ID_GRUPO
    const programacionIds = [...new Set(sesiones.map(s => s.ID_PROGRAMACION).filter(Boolean))];
    const grupoIds = new Set();
    const programacionToGrupo = new Map();
    
    for (const progId of programacionIds) {
      const progResult = await db.select('PROGRAMACION_GRUPO', { ID_PROGRAMACION: progId });
      const prog = (progResult?.data?.records || progResult)?.[0];
      if (prog?.ID_GRUPO) {
        grupoIds.add(prog.ID_GRUPO);
        programacionToGrupo.set(progId, prog.ID_GRUPO);
      }
    }

    // También verificar via ID_GRUPO_PLAN_CURSO -> GRUPO_PLAN_CURSO -> ID_GRUPO
    const gpcIds = [...new Set(sesiones.map(s => s.ID_GRUPO_PLAN_CURSO).filter(Boolean))];
    const gpcToGrupo = new Map();
    
    for (const gpcId of gpcIds) {
      const gpcResult = await db.select('GRUPO_PLAN_CURSO', { ID_GRUPO_PLAN_CURSO: gpcId });
      const gpc = (gpcResult?.data?.records || gpcResult)?.[0];
      if (gpc?.ID_GRUPO) {
        grupoIds.add(gpc.ID_GRUPO);
        gpcToGrupo.set(gpcId, gpc.ID_GRUPO);
      }
    }

    if (grupoIds.size === 0) {
      alert('No se encontraron grupos asociados a las sesiones');
      return;
    }

    // 3. Obtener los turnos de cada grupo
    const turnoIds = new Set();
    const grupoToTurno = new Map();
    
    for (const grupoId of grupoIds) {
      const grupoResult = await db.select('GRUPOS', { ID_GRUPO: grupoId });
      const grupo = (grupoResult?.data?.records || grupoResult)?.[0];
      if (grupo?.ID_TURNO) {
        turnoIds.add(grupo.ID_TURNO);
        grupoToTurno.set(grupoId, grupo.ID_TURNO);
      }
    }

    if (turnoIds.size === 0) {
      alert('No se encontraron turnos asociados a los grupos');
      return;
    }

    // 4. Para cada turno, obtener su horario y bloques
    const turnosConBloques = [];
    for (const turnoId of turnoIds) {
      const turnoResult = await db.select('TURNOS', { ID_TURNO: turnoId });
      const turno = (turnoResult?.data?.records || turnoResult)?.[0];

      if (!turno || !turno.ID_HORARIO) continue;

      const horarioResult = await db.select('HORARIOS', { ID_HORARIO: turno.ID_HORARIO });
      const horario = (horarioResult?.data?.records || horarioResult)?.[0];

      const bloquesResult = await db.select('HORARIO_BLOQUES', { ID_HORARIO: turno.ID_HORARIO });
      const bloques = (bloquesResult?.data?.records || bloquesResult || [])
        .sort((a, b) => a.ORDEN - b.ORDEN);

      if (bloques.length > 0) {
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

        turnosConBloques.push({
          turnoId: turno.ID_TURNO,
          turnoNombre: turno.NOMBRE_TURNO,
          horarioId: turno.ID_HORARIO,
          horario,
          bloques: customBlocks
        });
      }
    }

    if (turnosConBloques.length === 0) {
      alert('No se encontraron bloques de horario para los turnos del docente');
      return;
    }

    // 5. Agrupar turnos por horario (si comparten el mismo horario, se combinan)
    const horariosUnicos = new Map();
    for (const t of turnosConBloques) {
      if (!horariosUnicos.has(t.horarioId)) {
        horariosUnicos.set(t.horarioId, {
          horarioId: t.horarioId,
          horario: t.horario,
          turnos: [],
          bloques: t.bloques
        });
      }
      horariosUnicos.get(t.horarioId).turnos.push(t.turnoNombre);
    }

    // 6. Combinar todos los bloques de todos los horarios
    // Si son horarios diferentes, se ponen uno debajo del otro
    const allBlocks = [];
    let horarioIndex = 0;
    for (const [horarioId, horarioData] of horariosUnicos) {
      horarioIndex++;
      // Agregar un separador entre horarios si hay más de uno
      if (horariosUnicos.size > 1 && allBlocks.length > 0) {
        allBlocks.push({
          type: 'separator',
          label: `--- ${horarioData.turnos.join(' / ')} ---`,
          orden: 0,
          time: '',
          endTime: '',
          timeRange: '',
          turnoNombre: horarioData.turnos.join('/'),
          horarioIndex
        });
      }
      
      for (const bloque of horarioData.bloques) {
        allBlocks.push({
          ...bloque,
          horarioIndex,
          turnosLabel: horarioData.turnos.join(' / ')
        });
      }
    }

    // 6. Agrupar sesiones por fecha
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

    // 7. Construir info por fecha con firma de bloques
    const dateInfos = [];
    for (const [fechaStr, sesionesDelDia] of sesionesPorFecha.entries()) {
      const date = parseDate(fechaStr.includes('/') ? fechaStr : fechaStr.split('-').reverse().join('/'));
      const weekday = date.getDay();

      // Determinar a qué turno/horario pertenece cada sesión
      const sesionesConTurno = sesionesDelDia.map(s => {
        let grupoId = null;
        // Buscar grupo via ID_PROGRAMACION
        if (s.ID_PROGRAMACION && programacionToGrupo.has(s.ID_PROGRAMACION)) {
          grupoId = programacionToGrupo.get(s.ID_PROGRAMACION);
        }
        // O via ID_GRUPO_PLAN_CURSO
        if (!grupoId && s.ID_GRUPO_PLAN_CURSO && gpcToGrupo.has(s.ID_GRUPO_PLAN_CURSO)) {
          grupoId = gpcToGrupo.get(s.ID_GRUPO_PLAN_CURSO);
        }
        
        const turnoId = grupoId ? grupoToTurno.get(grupoId) : null;
        return { ...s, turnoId };
      });

      // Construir firma: qué hay en cada bloque combinado
      const signature = allBlocks.map(cb => {
        if (cb.type === 'break') return '__BREAK__';
        if (cb.type === 'separator') return '__SEPARATOR__';
        
        // Buscar sesión que coincida con el bloque (por orden y turno)
        const sesion = sesionesConTurno.find(s => 
          s.BLOQUE_ORDEN === cb.orden && s.turnoId === cb.turnoId
        );
        if (sesion) {
          const desc = `${sesion.CODIGO_AREA || ''}|${sesion.NOMBRE_CURSO || ''}|${sesion.DOCENTE_DISPLAY || 'Sin docente'}|${cb.turnoNombre}|${sesion.NOMBRE_GRUPO || ''}`;
          return desc;
        }
        return null;
      });

      const sigKey = signature.map(s => s === null ? '_' : s).join('||');
      dateInfos.push({ date, fechaStr, weekday, signature, sigKey });
    }

    // 8. Agrupar por (weekday, sigKey)
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

    // 9. Construir columnas ordenadas
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

    // 10. === Construir Excel ===
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema Horarios';
    workbook.created = new Date();
    const ws = workbook.addWorksheet(`Horario ${nombrePlaza || ''}`.slice(0, 30));

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

    // Título principal (sin encabezado institucional como pidió el usuario)
    ws.mergeCells(1, 1, 1, columns.length + 1);
    const titleCell = ws.getCell(1, 1);
    titleCell.value = `HORARIO - ${nombrePlaza || 'Docente'}`;
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = headerFill;
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.border = thinBorder;
    ws.getRow(1).height = 28;

    // Header weekday + fechas
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

    // 11. Calcular runs para merge
    const signatureToCellContent = (sig) => {
      const cells = [];
      for (let i = 0; i < allBlocks.length; i++) {
        const cb = allBlocks[i];
        if (cb.type === 'separator') {
          cells.push({ type: 'separator', label: cb.label });
        } else if (cb.type === 'break') {
          cells.push({ type: 'break', label: cb.label, turno: cb.turnosLabel || cb.turnoNombre });
        } else if (sig[i] && sig[i] !== '__BREAK__' && sig[i] !== '__SEPARATOR__') {
          const [codigo, curso, docente, turno, grupo] = sig[i].split('|');
          const text = `${codigo} ${curso}\n${grupo}\n${docente}\n${cb.timeRange}`;
          cells.push({ type: 'event', text, key: sig[i], turno, grupo });
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
        // Saltar separadores y breaks
        if (ci.type === 'separator') { i++; continue; }
        if (ci.type !== 'event') { i++; continue; }
        let end = i;
        let j = i + 1;
        while (j < cellInfos.length) {
          const cj = cellInfos[j];
          // No cruzar separadores o breaks
          if (cj.type === 'separator' || cj.type === 'break') break;
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

    // 12. Filas de datos
    const dataStartRow = 4;
    let ordenClase = 0;
    let horarioActual = null;
    for (let i = 0; i < allBlocks.length; i++) {
      const cb = allBlocks[i];
      const rowNum = dataStartRow + i;

      const aCell = ws.getCell(rowNum, 1);
      
      if (cb.type === 'separator') {
        // Reiniciar contador de bloques para nuevo horario
        ordenClase = 0;
        horarioActual = cb.horarioIndex;
        ws.mergeCells(rowNum, 1, rowNum, columns.length + 1);
        aCell.value = cb.label;
        aCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D366F' } };
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
        const runs = runsByColumn[idx];
        const run = findRun(runs, i);
        const c = ws.getCell(rowNum, colNum);

        if (run) {
          if (i === run.start) {
            const startBlock = allBlocks[run.start];
            const endBlock = allBlocks[run.end];
            const combinedRange = `${startBlock.time} - ${endBlock.endTime}`;
            const [codigo, curso, docente, turno, grupo] = run.key.split('|');
            c.value = `${codigo} ${curso}\n${grupo}\n${docente}\n${combinedRange}`;
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
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D366F' } };
        } else {
          c.value = '';
          c.font = eventFont;
        }
        c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        c.border = thinBorder;
      });

      ws.getRow(rowNum).height = cb.type === 'break' ? 22 : 48;
    }

    // 13. Aplicar merges
    columns.forEach((col, idx) => {
      const colNum = idx + 2;
      const runs = runsByColumn[idx];
      runs.forEach(r => {
        if (r.end > r.start) {
          ws.mergeCells(dataStartRow + r.start, colNum, dataStartRow + r.end, colNum);
        }
      });
    });

    // Ajustar anchos de columna
    ws.getColumn(1).width = 18;
    for (let i = 0; i < columns.length; i++) {
      ws.getColumn(i + 2).width = 24;
    }

    // 14. Descargar archivo
    const fileName = `Horario_${nombrePlaza || 'Plaza'}_${new Date().toISOString().split('T')[0]}.xlsx`;
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
