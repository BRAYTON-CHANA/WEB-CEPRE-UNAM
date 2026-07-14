import ExcelJS from 'exceljs';

const HEADER_FILL = 'FF1F3864';
const HEADER_FONT = 'FFFFFFFF';
const BORDER = 'FF000000';

const sanitizeFileName = (value) => {
  if (!value) return 'sin_periodo';
  return String(value)
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9ñÑáéíóúÁÉÍÓÚ_-]/g, '');
};

const getColumnWidth = (value) => {
  if (!value) return 10;
  const length = String(value).length;
  return Math.min(Math.max(length + 2, 10), 50);
};

export const exportPostulantes = async (records, idPeriodo) => {
  try {
    if (!records || records.length === 0) {
      alert('No hay postulantes para exportar en el período seleccionado');
      return;
    }

    const periodoNombre = records[0]?.NOMBRE_PERIODO || idPeriodo || 'sin_periodo';

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CEPRE UNAM';
    workbook.created = new Date();

    const ws = workbook.addWorksheet('Postulantes');

    const headers = ['SEDE', 'GRUPO', 'CARRERA', 'APELLIDOS', 'NOMBRES'];
    const headerRow = ws.addRow(headers);

    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: HEADER_FILL }
      };
      cell.font = { bold: true, color: { argb: HEADER_FONT } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: BORDER } },
        bottom: { style: 'thin', color: { argb: BORDER } },
        left: { style: 'thin', color: { argb: BORDER } },
        right: { style: 'thin', color: { argb: BORDER } }
      };
    });

    const rows = records.map((row) => ({
      SEDE: row.NOMBRE_SEDE || '',
      GRUPO: row.CODIGO_GRUPO || row.NOMBRE_GRUPO || '',
      CARRERA: row.NOMBRE_CARRERA || '',
      APELLIDOS: row.APELLIDOS || '',
      NOMBRES: row.NOMBRES || ''
    }));

    rows.forEach((item) => {
      const r = ws.addRow([item.SEDE, item.GRUPO, item.CARRERA, item.APELLIDOS, item.NOMBRES]);
      r.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: BORDER } },
          bottom: { style: 'thin', color: { argb: BORDER } },
          left: { style: 'thin', color: { argb: BORDER } },
          right: { style: 'thin', color: { argb: BORDER } }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      });
    });

    [ws.getColumn(1), ws.getColumn(2), ws.getColumn(3), ws.getColumn(4), ws.getColumn(5)].forEach((col, index) => {
      const key = headers[index];
      const maxLength = Math.max(
        key.length,
        ...rows.map((r) => String(r[key]).length)
      );
      col.width = getColumnWidth('x'.repeat(maxLength));
    });

    ws.getRow(1).height = 22;
    ws.autoFilter = 'A1:E1';

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    const fecha = new Date().toISOString().split('T')[0];
    a.download = `Postulantes_${sanitizeFileName(periodoNombre)}_${fecha}.xlsx`;

    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error exportando postulantes:', error);
    alert('Error al exportar: ' + error.message);
  }
};

export default exportPostulantes;
