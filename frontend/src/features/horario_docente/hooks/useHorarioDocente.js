import { useState, useEffect, useCallback } from 'react';
import { db } from '@/shared/api';
import { fetchSesionesContext } from '@/features/reportes/shared/turnosData';
import { clusterTurnosCompatibles } from '@/features/reportes/plazas/utils/exportPlazaToExcel';

// Paleta determinista por curso (la vista desglose no trae CURSO_COLOR)
const PALETTE = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#6366f1', '#14b8a6', '#f97316'];
const colorPorCurso = (idCurso) => PALETTE[Math.abs(Number(idCurso) || 0) % PALETTE.length];

/**
 * useHorarioDocente — clusters de turnos compatibles para la grilla de horario.
 * Misma lógica que reportes docentes:
 *   1. Sesiones desglose de TODAS las plazas (1 query IN)
 *   2. Turnos + bloques (1 query JOIN vía fetchSesionesContext)
 *   3. clusterTurnosCompatibles → fusiona turnos con idéntica distribución
 * Por cluster produce:
 *   - templateBlocks: formato legacy de SesionesHorarioView
 *   - sesionesUI: sesiones agregadas por ID_SESION con BLOQUES_IDS remapeados
 *     posicionalmente al turno representante del cluster
 */
export function useHorarioDocente(idsPlazas) {
  const [clusters, setClusters] = useState([]);
  const [sesiones, setSesiones] = useState([]);
  const [lookups, setLookups] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const idsKey = Array.isArray(idsPlazas) ? idsPlazas.join(',') : null;

  const cargar = useCallback(async () => {
    const ids = Array.isArray(idsPlazas) ? idsPlazas.filter(Boolean) : [];
    if (ids.length === 0) {
      setClusters([]);
      setSesiones([]);
      setLookups(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // 1. Sesiones desglose de todas las plazas del docente (1 query IN, chunks de 100)
      const sesiones = [];
      for (let i = 0; i < ids.length; i += 100) {
        const chunk = ids.slice(i, i + 100);
        const placeholders = chunk.map((_, j) => `$${j + 1}`).join(',');
        const rows = await db.rawSelect(
          `SELECT * FROM "VW_SESIONES_AGRUPADAS_DESGLOSE" WHERE "ID_PLAZA_DOCENTE" IN (${placeholders})`,
          ...chunk
        );
        sesiones.push(...(rows || []));
      }
      if (sesiones.length === 0) { setClusters([]); setSesiones([]); setLookups(null); return; }

      // 2. Turnos + bloques + lookups derivados de la vista
      const ctx = await fetchSesionesContext(sesiones);
      if (!ctx) { setClusters([]); setSesiones([]); setLookups(null); return; }
      const { gpcToGrupo, grupoToTurno, turnosConBloquesMap } = ctx;

      // 3. Agrupar turnos compatibles (misma firma type|time|endTime)
      const turnosConBloques = [...turnosConBloquesMap.values()];
      const rawClusters = clusterTurnosCompatibles(turnosConBloques, sesiones, gpcToGrupo, grupoToTurno);

      // 4. Adaptar cada cluster al formato de SesionesHorarioView
      const out = rawClusters.map(c => {
        const repBloques = c.bloques;
        const templateBlocks = repBloques.map(b => ({
          ID_BLOQUE: b.idBloque,
          ORDEN: b.orden,
          DURACION: b.duration,
          TIPO_BLOQUE: b.type,
          ETIQUETA: b.label,
          HORA_INICIO_JORNADA: repBloques[0]?.time || '07:00'
        }));

        // Remap posicional: turnoOrigen.ORDEN → rep.ID_BLOQUE
        const remapPorTurno = new Map();
        for (const t of c.turnos) {
          const ordenToRep = new Map();
          (t.bloques || []).forEach((sb, i) => {
            if (repBloques[i]) ordenToRep.set(sb.orden, repBloques[i].idBloque);
          });
          remapPorTurno.set(t.turnoId, ordenToRep);
        }

        // Agregar filas desglose (1 por sesión×bloque) → sesión con BLOQUES_IDS
        const porSesion = new Map();
        for (const s of c.sesiones) {
          if (!porSesion.has(s.ID_SESION)) {
            porSesion.set(s.ID_SESION, {
              ID_SESION: s.ID_SESION,
              FECHA: s.FECHA,
              ID_GRUPO_CURSO: s.ID_GRUPO_PLAN_CURSO,
              NOMBRE_CURSO: s.NOMBRE_CURSO,
              NOMBRE_GRUPO: s.NOMBRE_GRUPO,
              NOMBRE_SEDE: s.NOMBRE_SEDE,
              CURSO_COLOR: colorPorCurso(s.ID_CURSO),
              _turnoId: s.ID_TURNO ?? grupoToTurno.get(gpcToGrupo.get(s.ID_GRUPO_PLAN_CURSO) ?? s.ID_GRUPO),
              _ordenes: []
            });
          }
          porSesion.get(s.ID_SESION)._ordenes.push(s.ORDEN);
        }
        const sesionesUI = [...porSesion.values()].map(({ _turnoId, _ordenes, ...s }) => ({
          ...s,
          BLOQUES_IDS: _ordenes
            .map(o => remapPorTurno.get(_turnoId)?.get(o))
            .filter(v => v != null)
        }));

        return { ...c, templateBlocks, sesionesUI };
      });

      setClusters(out);
      setSesiones(sesiones);
      setLookups(ctx); // mismo shape que consumen los builders de reportes
    } catch (e) {
      setError(e.message);
      setClusters([]);
      setSesiones([]);
      setLookups(null);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  useEffect(() => { cargar(); }, [cargar]);

  return { clusters, sesiones, lookups, loading, error, refetch: cargar };
}
