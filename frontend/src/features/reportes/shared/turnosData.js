import { db } from '@/shared/api';

/**
 * Lookups de turnos/bloques para reportes.
 * VW_SESIONES_AGRUPADAS_DESGLOSE ya trae ID_GRUPO / ID_TURNO / ID_GRUPO_PLAN_CURSO
 * por sesión — solo falta resolver los bloques de cada turno.
 */

// ─── Paginación: trae TODOS los registros superando el límite 1000 ────────────
export const selectAll = async (table, filters = {}) => {
  const PAGE_SIZE = 1000;
  let offset = 0;
  const all = [];
  while (true) {
    const res = await db.selectWithLimit(table, PAGE_SIZE, offset, filters);
    const rows = res?.data?.records || res || [];
    all.push(...rows);
    if (rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return all;
};

// ─── Bloques calculados de un turno (hora de inicio + duración acumulada) ─────
export const buildCustomBlocks = (turno, bloques) => {
  const _hInit = (turno?.HORA_INICIO_JORNADA || '07:00').split(':').map(Number);
  let currentMinute = (isNaN(_hInit[0]) ? 7 : _hInit[0]) * 60 + (isNaN(_hInit[1]) ? 0 : _hInit[1]);
  const fmt = (h, m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

  return bloques.map((b) => {
    const hour = Math.floor(currentMinute / 60);
    const minute = currentMinute % 60;
    const endMinuteTotal = currentMinute + (b.DURACION || 50);
    const endHour = Math.floor(endMinuteTotal / 60);
    const endMinute = endMinuteTotal % 60;
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
      turnoId: turno.ID_TURNO
    };
  });
};

// ─── 1 query: TURNOS × TURNO_BLOQUES por IDs (chunk 100) ─────────────────────
// Retorna Map<ID_TURNO, { turnoId, turnoNombre, bloques: customBlocks }>
export const fetchTurnosConBloques = async (turnoIds) => {
  const ids = [...new Set((turnoIds || []).filter(v => v != null))];
  const map = new Map();

  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    const placeholders = chunk.map((_, j) => `$${j + 1}`).join(',');
    const rows = await db.rawSelect(
      `SELECT t."ID_TURNO", t."NOMBRE_TURNO", t."HORA_INICIO_JORNADA",
              b."ID_BLOQUE", b."DURACION", b."TIPO_BLOQUE", b."ETIQUETA", b."ORDEN"
       FROM "TURNOS" t
       JOIN "TURNO_BLOQUES" b ON b."ID_TURNO" = t."ID_TURNO"
       WHERE t."ID_TURNO" IN (${placeholders})
       ORDER BY t."ID_TURNO", b."ORDEN"`,
      ...chunk
    );

    for (const r of rows || []) {
      if (!map.has(r.ID_TURNO)) {
        map.set(r.ID_TURNO, {
          turno: { ID_TURNO: r.ID_TURNO, NOMBRE_TURNO: r.NOMBRE_TURNO, HORA_INICIO_JORNADA: r.HORA_INICIO_JORNADA },
          bloquesRaw: []
        });
      }
      map.get(r.ID_TURNO).bloquesRaw.push(r);
    }
  }

  const result = new Map();
  for (const [turnoId, entry] of map) {
    result.set(turnoId, {
      turnoId,
      turnoNombre: entry.turno.NOMBRE_TURNO,
      bloques: buildCustomBlocks(entry.turno, entry.bloquesRaw)
    });
  }
  return result;
};

// ─── IDs de turno presentes en un conjunto de sesiones ───────────────────────
export const extractTurnoIds = (sesiones) => {
  const turnoIds = new Set();
  for (const s of sesiones || []) {
    if (s.ID_TURNO != null) turnoIds.add(s.ID_TURNO);
  }
  return [...turnoIds];
};

// ─── Lookups derivados de la vista (sin queries) ─────────────────────────────
export const buildSesionesLookups = (sesiones, turnosConBloquesMap) => {
  const programacionToGrupo = new Map();
  const gpcToGrupo = new Map();
  const grupoToTurno = new Map();
  const turnoIds = new Set();

  for (const s of sesiones || []) {
    if (s.ID_PROGRAMACION && s.ID_GRUPO) programacionToGrupo.set(s.ID_PROGRAMACION, s.ID_GRUPO);
    if (s.ID_GRUPO_PLAN_CURSO && s.ID_GRUPO) gpcToGrupo.set(s.ID_GRUPO_PLAN_CURSO, s.ID_GRUPO);
    if (s.ID_GRUPO && s.ID_TURNO) {
      grupoToTurno.set(s.ID_GRUPO, s.ID_TURNO);
      turnoIds.add(s.ID_TURNO);
    }
  }

  const turnosConBloques = [...turnoIds]
    .map(tid => turnosConBloquesMap.get(tid))
    .filter(Boolean);

  return { programacionToGrupo, gpcToGrupo, grupoToTurno, turnosConBloques };
};

// ─── Contexto completo para un set de sesiones (1 query total) ───────────────
export const fetchSesionesContext = async (sesiones) => {
  const turnoIds = extractTurnoIds(sesiones);
  if (turnoIds.length === 0) return null;
  const turnosConBloquesMap = await fetchTurnosConBloques(turnoIds);
  return { ...buildSesionesLookups(sesiones, turnosConBloquesMap), turnosConBloquesMap };
};
