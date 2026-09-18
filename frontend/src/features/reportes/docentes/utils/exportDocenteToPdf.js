import { jsPDF } from 'jspdf';
import { db } from '@/shared/api';
import { buildBulkCache, clusterTurnosCompatibles } from '../../plazas/utils/exportPlazaToExcel';
import { fetchSesionesContext } from '../../shared/turnosData';

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
const buildColumnsPdf = (sesiones, allBlocks, programacionToGrupo, gpcToGrupo, grupoToTurno, agruparDias = true) => {
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
      if (sesion) return `${sesion.CODIGO_AREA || ''}|${sesion.NOMBRE_CURSO || ''}|${sesion.DOCENTE_NOMBRE_COMPLETO || ''}|${sesion.DOCENTE_DISPLAY || 'Sin docente'}|${cb.turnoNombre}|${sesion.NOMBRE_GRUPO || ''}|${sesion.NOMBRE_SEDE || 'Virtual'}`;
      return null;
    });

    const sigKey = signature.map(s => s === null ? '_' : s).join('||');
    dateInfos.push({ date, weekday, signature, sigKey });
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

// Variante con estilos por línea: [{ text, size, bold, rgb }]
const centeredRichLines = (doc, lines, x, y, w, h) => {
  const prepared = [];
  for (const { text, size, bold, rgb } of lines) {
    doc.setFontSize(size);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.splitTextToSize(String(text), w - 2).forEach(s => prepared.push({ s, size, bold, rgb }));
  }
  const totalH = prepared.reduce((acc, l) => acc + l.size * 0.35, 0);
  let cy = y + h / 2 - totalH / 2;
  for (const l of prepared) {
    const lineH = l.size * 0.35;
    doc.setFontSize(l.size);
    doc.setFont('helvetica', l.bold ? 'bold' : 'normal');
    setTextColor(doc, l.rgb || C_DARK_TEXT);
    doc.text(l.s, x + w / 2, cy + lineH * 0.8, { align: 'center' });
    cy += lineH;
  }
};

// ─── Resolver lookups para sesiones individuales ─────────────────────────────
// 1 query JOIN TURNOS×TURNO_BLOQUES vía helper compartido — la vista ya trae
// ID_GRUPO / ID_TURNO / ID_GRUPO_PLAN_CURSO por sesión (sin queries GPC/GRUPOS)
const resolveLookupsIndividual = fetchSesionesContext;

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

// Pocos días (≤3) → vertical; más días → horizontal
const getOrientation = (columns) => (columns.length <= 3 ? 'portrait' : 'landscape');

// ─── Dibujar páginas de docente: UNA PÁGINA POR HORARIO (cluster) ───────────
// Devuelve la cantidad de páginas que agregó al documento.
const drawDocentePage = (doc, nombreDocente, sesiones, lookups, opts = {}) => {
  const { programacionToGrupo, gpcToGrupo, grupoToTurno, turnosConBloques } = lookups;

  const marginL = 10;
  const marginR = 10;

  // Agrupar turnos por distribución de bloques compatible (misma estructura y horas)
  // y fusionar las sesiones de todas las plazas del docente en cada cluster.
  const clusters = clusterTurnosCompatibles(turnosConBloques, sesiones, gpcToGrupo, grupoToTurno);

  // Precalcular columnas por cluster para maxDataCols
  let maxDataCols = 1;
  const clustersData = [];
  for (const cluster of clusters) {
    const sesCluster = cluster.sesiones.map(s => ({ ...s, ID_TURNO: cluster.repTurnoId }));
    const columns = buildColumnsPdf(sesCluster, cluster.bloques, programacionToGrupo, gpcToGrupo, grupoToTurno, opts.agruparDias === true);
    if (columns.length > 0) {
      clustersData.push({ cluster, columns });
      if (columns.length > maxDataCols) maxDataCols = columns.length;
    }
  }

  if (clustersData.length === 0) return 0;

  const blockColW = 28;
  const s0 = sesiones[0] || {};
  const periodo = s0.NOMBRE_PERIODO || '';
  const dni     = s0.DOCENTE_DNI    || '';
  const email   = s0.DOCENTE_EMAIL  || '';
  const telefono = s0.DOCENTE_TELEFONO || '';
  const totalHojas = clustersData.length;

  // ── Una página por cluster de turnos ─────────────────────────────────────
  for (let ci = 0; ci < clustersData.length; ci++) {
    const { cluster, columns } = clustersData[ci];
    const allBlocks = cluster.bloques;

    doc.addPage('a4', getOrientation(columns));

    const PW = doc.internal.pageSize.getWidth();
    const PH = doc.internal.pageSize.getHeight();
    const usableW = PW - marginL - marginR;
    const dataColW  = Math.min(32, (usableW - blockColW) / Math.max(maxDataCols, 1));
    const totalW    = blockColW + dataColW * maxDataCols;
    const startX    = marginL + (usableW - totalW) / 2;

    let y = 6;

    // ── Header general + indicador de hoja ──────────────────────────────────
    const headerH = 7;
    filledRect(doc, startX, y, totalW, headerH, C_BLUE);
    centeredText(doc, `HORARIO - ${nombreDocente || 'Docente'}`, startX, y, totalW, headerH, 9, C_WHITE, true);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    setTextColor(doc, C_WHITE);
    doc.text(`Hoja ${ci + 1} de ${totalHojas}`, marginL + usableW, y + 2, { align: 'right' });
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

    // Línea de plazas participantes — negrita sobre fondo blanco con borde inferior
    const plazaH = 7;
    filledRect(doc, marginL, y, usableW, plazaH, C_WHITE, C_BORDER);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    setTextColor(doc, C_BLUE);
    const plazaLabel = `${cluster.plazas.length === 1 ? 'PLAZA' : 'PLAZAS'}: ${cluster.plazasLabel}`;
    doc.text(plazaLabel, marginL + 3, y + plazaH * 0.68);
    setDrawColor(doc, C_BLUE);
    doc.line(marginL, y + plazaH, marginL + usableW, y + plazaH);
    y += plazaH + 1;

    // Turno(s) de este cluster
    {
      const turnoTotalW = blockColW + dataColW * columns.length;
      const turnoStartX = marginL + (usableW - turnoTotalW) / 2;

      // Título de turno — texto negrita itálica sobre fondo gris muy claro
      const turnoH = 5.5;
      filledRect(doc, marginL, y, usableW, turnoH, C_GRAY_LIGHT, C_BORDER);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bolditalic');
      setTextColor(doc, C_DARK_TEXT);
      const turnoLabel = cluster.turnos.length === 1 ? cluster.turnoLabel : `TURNOS: ${cluster.turnoLabel}`;
      doc.text(`  ${turnoLabel}`, marginL + 3, y + turnoH * 0.70);
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
              const [codigo, curso, nombreCompleto, docente, , grupo, sede] = run.key.split('|');
              const startB = allBlocks[run.start];
              const endB   = allBlocks[run.end];
              const tr = startB.time && endB.endTime ? `${startB.time} - ${endB.endTime}` : '';
              const cellLines = [];
              cellLines.push({ text: (opts.showCodigo !== false && codigo) ? `${codigo} ${curso}` : curso, size: 4, bold: false });
              if (sede)  cellLines.push({ text: sede,  size: 5.5, bold: true });
              if (grupo) cellLines.push({ text: grupo, size: 5.5, bold: true });
              if (opts.showNombreDocente !== false && nombreCompleto) cellLines.push({ text: nombreCompleto, size: 4, bold: false });
              if (opts.showDocente !== false && docente) cellLines.push({ text: docente, size: 4, bold: false });
              if (opts.showHorario !== false && tr) cellLines.push({ text: tr, size: 4, bold: false });
              centeredRichLines(doc, cellLines, cx, ry, dataColW, runH);
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

  return totalHojas;
};

// ════════════════════════════════════════════════════════════════════════════
// EXPORTS PÚBLICOS
// ════════════════════════════════════════════════════════════════════════════

// Construye el jsPDF de un docente en memoria (sin descargar) — una página por
// cluster de turnos compatibles. Devuelve null si no hay datos.
export const buildDocentePdfDoc = (nombreDocente, sesiones, lookups, opts = {}) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pages = drawDocentePage(doc, nombreDocente, sesiones, lookups, opts);
  if (pages === 0) return null;
  doc.deletePage(1); // página inicial en blanco
  return doc;
};

/**
 * Exporta 1 docente a PDF
 */
export const exportDocenteToPdf = async (idDocente, nombreDocente, opts = {}) => {
  try {
    // opts.sesiones/opts.lookups precargados (ej. página /horario) → 0 queries extra
    let sesiones = opts.sesiones;
    if (!sesiones) {
      const sesionesResult = await db.select('VW_SESIONES_AGRUPADAS_DESGLOSE', { ID_DOCENTE: idDocente });
      sesiones = sesionesResult?.data?.records || sesionesResult || [];
    }
    if (sesiones.length === 0) {
      alert('No hay sesiones programadas para este docente');
      return;
    }

    const lookups = opts.lookups || await resolveLookupsIndividual(sesiones);
    if (!lookups || lookups.turnosConBloques.length === 0) {
      alert('No se encontraron datos de horario para este docente');
      return;
    }

    const doc = buildDocentePdfDoc(nombreDocente, sesiones, lookups, opts);
    if (!doc) {
      alert('No hay datos para exportar');
      return;
    }
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
    let totalPages = 0;
    let processed = 0;

    for (const [idDocente, sesiones] of docentes) {
      const lookups = resolveLookupsFromCache(sesiones, cache);
      if (lookups.turnosConBloques.length > 0) {
        const nombreDocente = sesiones[0]?.DOCENTE_NOMBRE_COMPLETO || `Docente ${idDocente}`;
        totalPages += drawDocentePage(doc, nombreDocente, sesiones, lookups, opts);
      }
      processed++;
      if (onProgress) onProgress(processed, docentes.length);
    }

    if (totalPages === 0) {
      alert('No se encontraron sesiones para ningún docente del período');
      return;
    }

    doc.deletePage(1); // página inicial en blanco
    doc.save(`Horarios_Docentes_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Error exportando docentes a PDF:', error);
    alert('Error al exportar PDF: ' + error.message);
  }
};
