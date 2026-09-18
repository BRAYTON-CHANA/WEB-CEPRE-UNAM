import { useState, useEffect, useCallback } from 'react';
import { db } from '@/shared/api';

/**
 * useGruposHabilitados — grupos ACTIVO de un período, con NOMBRE_SEDE y NOMBRE_TURNO resueltos.
 */
export function useGruposHabilitados(idPeriodo) {
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cargar = useCallback(() => {
    if (!idPeriodo) {
      setGrupos([]);
      setError(null);
      return Promise.resolve();
    }

    setLoading(true);
    setError(null);

    return Promise.all([
      db.select('GRUPOS', { ID_PERIODO: idPeriodo, ACTIVO: true }),
      db.select('SEDES', { ACTIVO: true }),
      db.select('TURNOS', { ACTIVO: true })
    ])
      .then(([gruposData, sedesData, turnosData]) => {
        const sedesMap = new Map((sedesData || []).map(s => [s.ID_SEDE, s]));
        const turnosMap = new Map((turnosData || []).map(t => [t.ID_TURNO, t]));

        setGrupos((gruposData || []).map(g => ({
          ...g,
          NOMBRE_SEDE: g.ID_SEDE == null ? 'VIRTUAL' : (sedesMap.get(g.ID_SEDE)?.NOMBRE_SEDE || `Sede ${g.ID_SEDE}`),
          NOMBRE_TURNO: turnosMap.get(g.ID_TURNO)?.NOMBRE_TURNO || null
        })));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [idPeriodo]);

  useEffect(() => { cargar(); }, [cargar]);

  return { grupos, loading, error, refetch: cargar };
}
