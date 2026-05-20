import { useState, useEffect, useCallback } from 'react';
import { db } from '@/shared/api';

export function useDocentes(idPeriodo, idSede) {
  const [docentes, setDocentes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDocentes = useCallback(() => {
    if (!idPeriodo || !idSede) {
      setDocentes([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    // Cargar plazas y docentes
    Promise.all([
      db.select('PLAZA_DOCENTE', { ID_PERIODO: idPeriodo, ID_SEDE: idSede, ACTIVO: true }),
      db.select('DOCENTES', { ACTIVO: true })
    ])
      .then(([plazasData, docentesData]) => {
        const plazas = plazasData || [];
        const docentesList = docentesData || [];

        // Crear map de docentes
        const docentesMap = new Map();
        docentesList.forEach(d => docentesMap.set(d.ID_DOCENTE, d));

        // Agrupar plazas por docente (solo plazas con docente asignado)
        const docentePlazas = new Map();
        plazas.forEach(p => {
          if (p.ID_DOCENTE) {
            if (!docentePlazas.has(p.ID_DOCENTE)) {
              docentePlazas.set(p.ID_DOCENTE, []);
            }
            docentePlazas.get(p.ID_DOCENTE).push(p);
          }
        });

        // Construir lista de docentes con info de plazas
        const docentesConPlazas = [];
        docentePlazas.forEach((plazasList, idDocente) => {
          const docente = docentesMap.get(idDocente);
          if (docente) {
            docentesConPlazas.push({
              ...docente,
              PLAZAS_COUNT: plazasList.length,
              PLAZAS: plazasList
            });
          }
        });

        // Ordenar por apellidos
        docentesConPlazas.sort((a, b) => (a.APELLIDOS || '').localeCompare(b.APELLIDOS || ''));

        setDocentes(docentesConPlazas);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [idPeriodo, idSede]);

  useEffect(() => {
    fetchDocentes();
  }, [fetchDocentes]);

  return { docentes, loading, error, refetch: fetchDocentes };
}
