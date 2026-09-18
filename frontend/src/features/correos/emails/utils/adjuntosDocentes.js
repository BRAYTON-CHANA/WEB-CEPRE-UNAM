import ExcelJS from 'exceljs';
import { db } from '@/shared/api';
import { buildBulkCache } from '@/features/reportes/plazas/utils/exportPlazaToExcel';
import { resolveLookupsFromCache, buildDocenteWorksheet } from '@/features/reportes/docentes/utils/exportDocenteToExcel';
import { buildDocentePdfDoc } from '@/features/reportes/docentes/utils/exportDocenteToPdf';

// Nombre de archivo seguro: ASCII puro para que no se corrompa en headers
// de correo ni sistemas de archivos (el contenido interno sí conserva tildes).
const sanitize = (name) =>
  String(name || 'Sin nombre')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '');

const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
};

// Sesiones de un docente dentro del cache bulk (sesionesPorPlaza aplanado).
const sesionesDeDocente = (cache, idDocente) => {
  const sesiones = [];
  for (const [, sesPlaza] of cache.sesionesPorPlaza.entries()) {
    for (const s of sesPlaza) {
      if (s.ID_DOCENTE === idDocente) sesiones.push(s);
    }
  }
  return sesiones;
};

// Período de cada destinatario: prioriza rowData.ID_PERIODO; si falta,
// consulta el view una sola vez para los que no lo tienen.
const resolvePeriodos = async (recipients) => {
  const periodoPorId = new Map();
  const faltantes = [];
  for (const r of recipients) {
    const idPeriodo = r.rowData?.ID_PERIODO;
    if (idPeriodo != null) periodoPorId.set(r.id, idPeriodo);
    else faltantes.push(r);
  }
  if (faltantes.length > 0) {
    const rows = (await db.select('VW_CORREO_DOCENTES')) || [];
    const byDocente = new Map(rows.map((row) => [row.ID_DOCENTE, row.ID_PERIODO]));
    for (const r of faltantes) {
      const idPeriodo = byDocente.get(Number(r.id));
      if (idPeriodo != null) periodoPorId.set(r.id, idPeriodo);
    }
  }
  return periodoPorId;
};

/**
 * Genera los horarios personalizados de cada docente destinatario.
 * Reutiliza los builders de reportes docentes (mismo layout que el ZIP).
 *
 * @param {Array} recipients - chips de destinatarios ({id, email, label, rowData})
 * @param {Array<string>} formatIds - 'pdf' y/o 'excel'
 * @param {(current: number, total: number) => void} [onProgress]
 * @param {Object} [opts] - opciones de contenido (showCodigo, showDocente, showHorario, showNombreDocente, agruparDias)
 * @returns {{ adjuntosPorDestinatario: Map<any, Array>, omitidos: Array }}
 */
export const buildAdjuntosDocentes = async (recipients, formatIds, onProgress, opts = {}) => {
  const wantPdf = formatIds.includes('pdf');
  const wantExcel = formatIds.includes('excel');

  const periodoPorId = await resolvePeriodos(recipients);

  // Un cache por período
  const cachesPorPeriodo = new Map();
  for (const idPeriodo of new Set(periodoPorId.values())) {
    cachesPorPeriodo.set(idPeriodo, await buildBulkCache(idPeriodo));
  }

  const adjuntosPorDestinatario = new Map();
  const omitidos = [];
  let processed = 0;
  if (onProgress) onProgress(0, recipients.length);

  for (const r of recipients) {
    processed++;
    const adjuntos = [];
    try {
      const idDocente = Number(r.id);
      const cache = cachesPorPeriodo.get(periodoPorId.get(r.id));
      const sesiones = cache ? sesionesDeDocente(cache, idDocente) : [];
      const nombre = r.rowData?.NOMBRE_COMPLETO || r.label || `Docente ${idDocente}`;

      if (sesiones.length > 0) {
        const lookups = resolveLookupsFromCache(sesiones, cache);
        if (lookups.turnosConBloques.length > 0) {
          const base = sanitize(`Horario_${nombre}`);

          if (wantPdf) {
            const pdfDoc = buildDocentePdfDoc(nombre, sesiones, lookups, opts);
            if (pdfDoc) {
              const base64 = pdfDoc.output('datauristring').split(',')[1];
              adjuntos.push({ filename: `${base}.pdf`, contentType: 'application/pdf', content: base64 });
            }
          }

          if (wantExcel) {
            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'Sistema Horarios';
            workbook.created = new Date();
            if (buildDocenteWorksheet(workbook, nombre, sesiones, lookups, opts)) {
              const buffer = await workbook.xlsx.writeBuffer();
              adjuntos.push({
                filename: `${base}.xlsx`,
                contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                content: arrayBufferToBase64(buffer),
              });
            }
          }
        }
      }

      if (adjuntos.length === 0) omitidos.push(nombre);
    } catch (err) {
      console.error(`[adjuntosDocentes] Error generando horario de ${r.label}:`, err);
      omitidos.push(r.label || r.email);
    }
    adjuntosPorDestinatario.set(r.id, adjuntos);
    if (onProgress) onProgress(processed, recipients.length);
  }

  return { adjuntosPorDestinatario, omitidos };
};
