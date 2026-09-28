import { db } from '@/shared/api';
import { fetchTurnosConBloques } from '../../shared/turnosData';

const WEEKDAY_NAMES = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
const MONTH_NAMES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

export const formatDateShort = (date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = MONTH_NAMES[date.getMonth()];
  return `${day}-${month}`;
};

const parseDate = (fechaStr) => {
  const [day, month, year] = fechaStr.split('/').map(Number);
  return new Date(year, month - 1, day);
};

const prepareDateInfos = (sesiones, customBlocks) => {
  const sesionesPorFecha = new Map();
  for (const s of sesiones) {
    let fechaStr = s.FECHA;
    if (typeof fechaStr === 'string' && fechaStr.includes('T')) fechaStr = fechaStr.split('T')[0];
    if (!sesionesPorFecha.has(fechaStr)) sesionesPorFecha.set(fechaStr, []);
    sesionesPorFecha.get(fechaStr).push(s);
  }

  const dateInfos = [];
  for (const [fechaStr, sesionesDelDia] of sesionesPorFecha.entries()) {
    const date = parseDate(fechaStr.includes('/') ? fechaStr : fechaStr.split('-').reverse().join('/'));
    const weekday = date.getDay();
    const signature = customBlocks.map(cb => {
      if (cb.type === 'break') return '__BREAK__';
      const sesion = sesionesDelDia.find(s => s.ORDEN === cb.orden);
      if (sesion) return `${sesion.CODIGO_AREA || ''}|${sesion.NOMBRE_CURSO || ''}|${sesion.DOCENTE_NOMBRE_COMPLETO || ''}|${sesion.DOCENTE_DISPLAY || 'Sin docente'}`;
      return null;
    });
    const sigKey = signature.map(s => s === null ? '_' : s).join('||');
    dateInfos.push({ date, weekday, signature, sigKey });
  }
  return dateInfos;
};

// Agrupa fechas en columnas.
// agruparDias = true  → separa por día de semana + patrón (headers SÁBADO, DOMINGO...)
// agruparDias = false → separa solo por patrón (headers DÍA 1, DÍA 2...)
export const buildGrupoColumns = (sesiones, customBlocks, agruparDias) => {
  const grouped = new Map();
  for (const info of prepareDateInfos(sesiones, customBlocks)) {
    const groupKey = agruparDias ? `${info.weekday}__${info.sigKey}` : info.sigKey;
    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, { signature: info.signature, dates: [], weekday: info.weekday });
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

// Fetch bulk: sesiones de todos los grupos en 1 query IN + turnos/bloques en 1 query JOIN.
export const fetchGruposExportData = async (grupos) => {
  const grupoIds = grupos.map(g => g.ID_GRUPO).filter(id => id != null);
  const sesionesPorGrupo = new Map();
  if (grupoIds.length > 0) {
    const placeholders = grupoIds.map((_, i) => `$${i + 1}`).join(',');
    const allSesiones = await db.rawSelect(
      `SELECT * FROM "VW_SESIONES_AGRUPADAS_DESGLOSE" WHERE "ID_GRUPO" IN (${placeholders})`,
      ...grupoIds
    );
    for (const s of allSesiones) {
      const gid = s.ID_GRUPO;
      if (!sesionesPorGrupo.has(gid)) sesionesPorGrupo.set(gid, []);
      sesionesPorGrupo.get(gid).push(s);
    }
  }

  const turnoIds = [...new Set(grupos.map(g => g.ID_TURNO).filter(v => v != null))];
  const customBlocksByTurno = await fetchTurnosConBloques(turnoIds);

  return { sesionesPorGrupo, customBlocksByTurno };
};
