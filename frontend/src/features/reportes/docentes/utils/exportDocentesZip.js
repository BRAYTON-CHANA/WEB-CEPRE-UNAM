import JSZip from 'jszip';
import ExcelJS from 'exceljs';
import { buildBulkCache } from '../../plazas/utils/exportPlazaToExcel';
import { resolveLookupsFromCache, buildDocenteWorksheet } from './exportDocenteToExcel';
import { buildDocentePdfDoc } from './exportDocenteToPdf';

// Nombre de archivo/carpeta seguro: ASCII puro para evitar corrupción de
// tildes al extraer el ZIP (el contenido interno sí conserva tildes).
const sanitize = (name) =>
  String(name || 'Sin nombre')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '');

const downloadBlob = (blob, fileName) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  window.URL.revokeObjectURL(url);
};

/**
 * Exporta un ZIP con una carpeta por docente; dentro, su horario completo
 * (layout de docente: secciones por cluster de turnos compatibles).
 * format: 'pdf' | 'excel' | 'both' (default 'both')
 */
export const exportDocentesToZip = async (idPeriodo, onProgress, opts = {}, format = 'both') => {
  try {
    const wantPdf = format === 'both' || format === 'pdf';
    const wantExcel = format === 'both' || format === 'excel';

    const cache = await buildBulkCache(idPeriodo);
    if (!cache) {
      alert('No se encontraron sesiones para el período seleccionado');
      return;
    }

    // Agrupar sesiones por docente
    const docentes = new Map();
    for (const [, sesPlaza] of cache.sesionesPorPlaza.entries()) {
      for (const s of sesPlaza) {
        const idDoc = s.ID_DOCENTE;
        if (!idDoc) continue;
        if (!docentes.has(idDoc)) {
          docentes.set(idDoc, {
            nombre: s.DOCENTE_NOMBRE_COMPLETO || `Docente ${idDoc}`,
            dni: s.DOCENTE_DNI || '',
            sesiones: []
          });
        }
        docentes.get(idDoc).sesiones.push(s);
      }
    }

    if (docentes.size === 0) {
      alert('No hay docentes con sesiones en el período seleccionado');
      return;
    }

    const zip = new JSZip();
    const usedFolders = new Set();
    let processed = 0;
    if (onProgress) onProgress(0, docentes.size);

    for (const docente of docentes.values()) {
      const lookups = resolveLookupsFromCache(docente.sesiones, cache);
      processed++;
      if (lookups.turnosConBloques.length === 0) {
        if (onProgress) onProgress(processed, docentes.size);
        continue;
      }

      let folderName = sanitize(docente.nombre);
      if (usedFolders.has(folderName)) folderName = `${folderName} (${docente.dni || 'docente'})`;
      usedFolders.add(folderName);
      const folder = zip.folder(folderName);

      const usedFiles = new Set();
      const uniqueName = (base, ext) => {
        let candidate = `${base}.${ext}`;
        let n = 2;
        while (usedFiles.has(candidate)) candidate = `${base}-${n++}.${ext}`;
        usedFiles.add(candidate);
        return candidate;
      };

      const base = sanitize(`Horario_${docente.nombre}`);

      if (wantPdf) {
        const pdfDoc = buildDocentePdfDoc(docente.nombre, docente.sesiones, lookups, opts);
        if (pdfDoc) folder.file(uniqueName(base, 'pdf'), pdfDoc.output('blob'));
      }

      if (wantExcel) {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Sistema Horarios';
        workbook.created = new Date();
        if (buildDocenteWorksheet(workbook, docente.nombre, docente.sesiones, lookups, opts)) {
          folder.file(uniqueName(base, 'xlsx'), await workbook.xlsx.writeBuffer());
        }
      }

      if (onProgress) onProgress(processed, docentes.size);
    }

    if (usedFolders.size === 0) {
      alert('No se encontraron datos de horario para exportar');
      return;
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    const suffix = format === 'pdf' ? '_PDF' : format === 'excel' ? '_Excel' : '';
    downloadBlob(blob, `Horarios_Docentes${suffix}_${new Date().toISOString().split('T')[0]}.zip`);
  } catch (error) {
    console.error('Error exportando ZIP de docentes:', error);
    alert('Error al exportar ZIP: ' + error.message);
  }
};
