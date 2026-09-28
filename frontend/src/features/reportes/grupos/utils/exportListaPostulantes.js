import ExcelJS from 'exceljs';
import { db } from '@/shared/api';
import { sortBySedeArea } from './sedeArea';

export const exportListaPostulantes = async (idPeriodo, grupos) => {
  try {
    const postulantes = await db.rawSelect(
      `SELECT * FROM "VW_POSTULANTES" WHERE "ID_PERIODO" = $1`,
      idPeriodo
    ) || [];

    if (postulantes.length === 0) {
      alert('No hay postulantes para exportar en este período');
      return;
    }

    const nombrePeriodo = postulantes[0]?.NOMBRE_PERIODO || 'N/A';

    // Orden de grupos igual que los demás exports: sede → área → código
    const ordenGrupo = new Map();
    sortBySedeArea((grupos || []).filter(g => g.ID_GRUPO != null))
      .forEach((g, i) => ordenGrupo.set(g.ID_GRUPO, i));

    const grupoLabel = (p) => {
      const codigo = p.CODIGO_GRUPO || '';
      const nombre = p.NOMBRE_GRUPO || '';
      if (codigo && nombre) return `${codigo} — ${nombre}`;
      return codigo || nombre || 'Sin grupo';
    };

    // La vista expone los apellidos en columnas separadas (posiblemente con
    // prefijo USUARIO_); se concatenan y se usa NOMBRE_COMPLETO como respaldo.
    const apellidosDe = (p) =>
      p.APELLIDOS ||
      [p.APELLIDO_PATERNO || p.USUARIO_APELLIDO_PATERNO,
       p.APELLIDO_MATERNO || p.USUARIO_APELLIDO_MATERNO]
        .filter(Boolean).join(' ').trim() ||
      p.NOMBRE_COMPLETO || '';
    const nombresDe = (p) =>
      p.NOMBRES || p.USUARIO_NOMBRES || '';

    const filas = [...postulantes].sort((a, b) => {
      const oa = a.ID_GRUPO != null && ordenGrupo.has(a.ID_GRUPO) ? ordenGrupo.get(a.ID_GRUPO) : Number.MAX_SAFE_INTEGER;
      const ob = b.ID_GRUPO != null && ordenGrupo.has(b.ID_GRUPO) ? ordenGrupo.get(b.ID_GRUPO) : Number.MAX_SAFE_INTEGER;
      if (oa !== ob) return oa - ob;
      return apellidosDe(a).localeCompare(apellidosDe(b)) ||
             nombresDe(a).localeCompare(nombresDe(b));
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema Horarios';
    workbook.created = new Date();

    const institutionFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
    const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D366F' } };
    const titleFont = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    const headerFont = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    const dataFont = { name: 'Arial', size: 10, color: { argb: 'FF1F2937' } };
    const thinBorder = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };

    const NUM_COLS = 5;
    const ws = workbook.addWorksheet('Postulantes');

    // Encabezado institucional
    ws.mergeCells(1, 1, 1, NUM_COLS);
    const ic = ws.getCell(1, 1);
    ic.value = 'CENTRO DE ESTUDIOS PREUNIVERSITARIO - UNAM';
    ic.font = titleFont;
    ic.fill = institutionFill;
    ic.alignment = { vertical: 'middle', horizontal: 'center' };
    ws.getRow(1).height = 26;

    ws.mergeCells(2, 1, 2, NUM_COLS);
    const cc = ws.getCell(2, 1);
    cc.value = `CICLO DE PREPARACIÓN ${String(nombrePeriodo).toUpperCase()}`;
    cc.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cc.fill = institutionFill;
    cc.alignment = { vertical: 'middle', horizontal: 'center' };
    ws.getRow(2).height = 24;

    ws.mergeCells(3, 1, 3, NUM_COLS);
    const tc = ws.getCell(3, 1);
    tc.value = `LISTA DE POSTULANTES — ${filas.length} REGISTROS`;
    tc.font = titleFont;
    tc.fill = headerFill;
    tc.alignment = { vertical: 'middle', horizontal: 'center' };
    ws.getRow(3).height = 26;

    // Headers de tabla
    const headers = ['N°', 'APELLIDOS', 'NOMBRES', 'DNI', 'GRUPO'];
    headers.forEach((h, i) => {
      const cell = ws.getCell(4, i + 1);
      cell.value = h;
      cell.font = headerFont;
      cell.fill = headerFill;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = thinBorder;
    });
    ws.getRow(4).height = 22;

    // Datos
    filas.forEach((p, idx) => {
      const rowNum = 5 + idx;
      const values = [
        idx + 1,
        apellidosDe(p),
        nombresDe(p),
        p.DNI || '',
        grupoLabel(p)
      ];
      values.forEach((v, i) => {
        const cell = ws.getCell(rowNum, i + 1);
        cell.value = v;
        cell.font = dataFont;
        cell.border = thinBorder;
        cell.alignment = {
          vertical: 'middle',
          horizontal: i === 0 || i === 3 ? 'center' : 'left',
        };
      });
      ws.getRow(rowNum).height = 18;
    });

    ws.getColumn(1).width = 6;
    ws.getColumn(2).width = 32;
    ws.getColumn(3).width = 32;
    ws.getColumn(4).width = 14;
    ws.getColumn(5).width = 38;

    const fileName = `Postulantes_Grupos_${nombrePeriodo}_${new Date().toISOString().split('T')[0]}.xlsx`
      .replace(/[*?:\\/\[\]]/g, '-');
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

  } catch (error) {
    console.error('Error exportando lista de postulantes:', error);
    alert('Error al exportar: ' + error.message);
  }
};

export default exportListaPostulantes;
