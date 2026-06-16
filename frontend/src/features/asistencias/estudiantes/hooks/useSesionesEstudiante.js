import { useState, useEffect, useCallback } from 'react';
import { db } from '@/shared/api';

export function useSesionesEstudiante(idPostulante, idGrupo) {
  const [sesiones, setSesiones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSesiones = useCallback(() => {
    if (!idPostulante || !idGrupo) {
      setSesiones([]);
      return;
    }
    setLoading(true);
    setError(null);
    db.select('VW_ASISTENCIAS_POSTULANTE', { ID_POSTULANTE: idPostulante, ID_GRUPO: idGrupo })
      .then(data => {
        const seen = new Set();
        const unique = (data || []).filter(row => {
          if (seen.has(row.ID_ASISTENCIA)) return false;
          seen.add(row.ID_ASISTENCIA);
          return true;
        });
        const sorted = unique.sort((a, b) => {
          if (a.FECHA < b.FECHA) return -1;
          if (a.FECHA > b.FECHA) return 1;
          if (a.HORA_INICIO < b.HORA_INICIO) return -1;
          return 1;
        });
        setSesiones(sorted);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [idPostulante, idGrupo]);

  useEffect(() => {
    fetchSesiones();
  }, [fetchSesiones]);

  return { sesiones, loading, error, refetch: fetchSesiones };
}
