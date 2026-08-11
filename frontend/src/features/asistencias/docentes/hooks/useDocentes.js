import { useState, useEffect, useCallback } from 'react';
import { db } from '@/shared/api';
import { MOCK_DOCENTES, MOCK_PLAZAS } from '../../shared/mocks/mockData';

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

    // TODO: quitar mock - consultas reales desactivadas para capturas
    // Promise.all([
    //   db.select('PLAZA_DOCENTE', { ID_PERIODO: idPeriodo, ID_SEDE: idSede, ACTIVO: true }),
    //   db.select('DOCENTES', { ACTIVO: true })
    // ])...

    const plazas = MOCK_PLAZAS.filter(p => p.ID_PERIODO === idPeriodo && p.ID_SEDE === idSede);

    // Agrupar plazas por docente
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
      const docente = MOCK_DOCENTES.find(d => d.ID_DOCENTE === idDocente);
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
    setLoading(false);
  }, [idPeriodo, idSede]);

  useEffect(() => {
    fetchDocentes();
  }, [fetchDocentes]);

  return { docentes, loading, error, refetch: fetchDocentes };
}
