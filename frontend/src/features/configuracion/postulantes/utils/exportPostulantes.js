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

    // ========================================
    // Hoja 2: Resumen (tabla cruzada Carrera x Sede)
    // ========================================
    const sedesUnicas = [...new Set(records.map(r => r.NOMBRE_SEDE || 'Sin sede').filter(Boolean))];
    const carrerasUnicas = [...new Set(records.map(r => r.NOMBRE_CARRERA || 'Sin carrera').filter(Boolean))];

    const conteo = {};
    records.forEach(r => {
      const sede = r.NOMBRE_SEDE || 'Sin sede';
      const carrera = r.NOMBRE_CARRERA || 'Sin carrera';
      const key = `${carrera}|||${sede}`;
      conteo[key] = (conteo[key] || 0) + 1;
    });

    const ws2 = workbook.addWorksheet('Resumen');

    // Header: CARRERA | Sede1 | Sede2 | ... | TOTAL
    const headers2 = ['CARRERA', ...sedesUnicas, 'TOTAL'];
    const headerRow2 = ws2.addRow(headers2);
    headerRow2.eachCell((cell) => {
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

    // Filas: una por carrera
    carrerasUnicas.forEach(carrera => {
      let totalCarrera = 0;
      const rowData = [carrera];
      sedesUnicas.forEach(sede => {
        const count = conteo[`${carrera}|||${sede}`] || 0;
        rowData.push(count);
        totalCarrera += count;
      });
      rowData.push(totalCarrera);

      const r = ws2.addRow(rowData);
      r.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin', color: { argb: BORDER } },
          bottom: { style: 'thin', color: { argb: BORDER } },
          left: { style: 'thin', color: { argb: BORDER } },
          right: { style: 'thin', color: { argb: BORDER } }
        };
        if (colNumber === 1) {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
        // Resaltar columna TOTAL
        if (colNumber === headers2.length) {
          cell.font = { bold: true };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD6E4F0' }
          };
        }
      });
    });

    // Fila final: TOTAL por sede
    const totalesSede = sedesUnicas.map(sede =>
      records.filter(r => (r.NOMBRE_SEDE || 'Sin sede') === sede).length
    );
    const totalGeneral = totalesSede.reduce((a, b) => a + b, 0);
    const totalRow = ws2.addRow(['TOTAL', ...totalesSede, totalGeneral]);
    totalRow.eachCell((cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: HEADER_FILL }
      };
      cell.font = { bold: true, color: { argb: HEADER_FONT } };
      cell.alignment = { vertical: 'middle', horizontal: colNumber === 1 ? 'left' : 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: BORDER } },
        bottom: { style: 'thin', color: { argb: BORDER } },
        left: { style: 'thin', color: { argb: BORDER } },
        right: { style: 'thin', color: { argb: BORDER } }
      };
    });

    // Ancho de columnas
    ws2.getColumn(1).width = getColumnWidth(
      'x'.repeat(Math.max(8, ...carrerasUnicas.map(c => c.length)))
    );
    for (let i = 2; i <= headers2.length; i++) {
      ws2.getColumn(i).width = getColumnWidth(
        'x'.repeat(Math.max(5, String(headers2[i - 1]).length))
      );
    }

    ws2.getRow(1).height = 22;

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
