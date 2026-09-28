import JSZip from 'jszip';
import ExcelJS from 'exceljs';
import { fetchGruposExportData, buildGrupoColumns } from './gruposExportData';
import { buildGrupoWorksheet } from './exportSesionesToExcel';
import { buildGrupoPdfDoc } from './exportSesionesToPdf';
import { sortBySedeArea, getSedeNombre, getAreaNombre, sanitize } from './sedeArea';

const downloadBlob = (blob, fileName) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  window.URL.revokeObjectURL(url);
};

/**
 * Exporta un ZIP con carpetas Sede/Área y un archivo por grupo dentro.
 * format: 'pdf' | 'excel' (default 'pdf')
 */
export const exportGruposToZip = async (grupos, opts = {}, format = 'pdf', onProgress) => {
  try {
    const wantPdf = format === 'pdf' || format === 'both';
    const wantExcel = format === 'excel' || format === 'both';

    const ordered = sortBySedeArea((grupos || []).filter(g => g.ID_GRUPO != null));
    if (ordered.length === 0) {
      alert('No hay grupos para exportar');
      return;
    }

    const { sesionesPorGrupo, customBlocksByTurno } = await fetchGruposExportData(ordered);

    const zip = new JSZip();
    const usedPaths = new Set();
    const uniquePath = (path, ext) => {
      let candidate = `${path}.${ext}`;
      let n = 2;
      while (usedPaths.has(candidate)) candidate = `${path}-${n++}.${ext}`;
      usedPaths.add(candidate);
      return candidate;
    };

    let exported = 0;
    let processed = 0;
    if (onProgress) onProgress(0, ordered.length);

    for (const grupo of ordered) {
      processed++;
      const idGrupo = grupo.ID_GRUPO;
      const nombreGrupo = grupo.NOMBRE_GRUPO || grupo.CODIGO_GRUPO || `Grupo_${idGrupo}`;
      const sesiones = sesionesPorGrupo.get(idGrupo) || [];
      const customBlocks = customBlocksByTurno.get(grupo.ID_TURNO)?.bloques;

      if (sesiones.length === 0 || !customBlocks || customBlocks.length === 0) {
        if (onProgress) onProgress(processed, ordered.length);
        continue;
      }

      const columns = buildGrupoColumns(sesiones, customBlocks, opts.agruparDias === true);
      if (columns.length === 0) {
        if (onProgress) onProgress(processed, ordered.length);
        continue;
      }

      const sede = sesiones[0]?.NOMBRE_SEDE || getSedeNombre(grupo);
      const area = getAreaNombre(grupo);
      const nombrePeriodo = sesiones[0]?.NOMBRE_PERIODO || '';
      const basePath = `${sanitize(sede)}/${sanitize(area)}/${sanitize(`Horario_${grupo.CODIGO_GRUPO || nombreGrupo}`)}`;

      if (wantPdf) {
        const pdfDoc = buildGrupoPdfDoc(nombreGrupo, sede, nombrePeriodo, columns, customBlocks, opts);
        zip.file(uniquePath(basePath, 'pdf'), pdfDoc.output('blob'));
      }

      if (wantExcel) {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Sistema Horarios';
        workbook.created = new Date();
        const sheetName = `Horario ${grupo.CODIGO_GRUPO || nombreGrupo}`.replace(/[*?:\\/\[\]]/g, '-').slice(0, 31);
        buildGrupoWorksheet(workbook, sheetName, nombreGrupo, nombrePeriodo, sede, columns, customBlocks, opts);
        zip.file(uniquePath(basePath, 'xlsx'), await workbook.xlsx.writeBuffer());
      }

      exported++;
      if (onProgress) onProgress(processed, ordered.length);
    }

    if (exported === 0) {
      alert('No se encontraron grupos con sesiones para exportar');
      return;
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    const suffix = format === 'pdf' ? '_PDF' : format === 'excel' ? '_Excel' : '';
    downloadBlob(blob, `Horarios_Grupos${suffix}_${new Date().toISOString().split('T')[0]}.zip`);
  } catch (error) {
    console.error('Error exportando ZIP de grupos:', error);
    alert('Error al exportar ZIP: ' + error.message);
  }
};
