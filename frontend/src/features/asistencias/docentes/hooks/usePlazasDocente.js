import { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '@/shared/api';
import { MOCK_PLAZAS, MOCK_CURSOS } from '../../shared/mocks/mockData';

export function usePlazasDocente(idPeriodo, idSede, idDocente) {
  const [plazas, setPlazas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPlazas = useCallback(() => {
    if (!idPeriodo || !idSede || !idDocente) {
      setPlazas([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    // TODO: quitar mock - consultas reales desactivadas para capturas
    // Promise.all([ ... ])

    const cursosMap = new Map();
    MOCK_CURSOS.forEach(c => cursosMap.set(c.ID_CURSO, c));

    const plazasList = MOCK_PLAZAS.filter(p =>
      p.ID_PERIODO === idPeriodo &&
      p.ID_SEDE === idSede &&
      p.ID_DOCENTE === idDocente
    );

    const plazasEnriquecidas = plazasList.map(p => {
      const curso = cursosMap.get(p.ID_CURSO);
      return {
        ...p,
        NOMBRE_CURSO: curso?.NOMBRE_CURSO || 'Curso sin nombre',
        CODIGO_CURSO: curso?.CODIGO_CURSO || '',
        EJE_TEMATICO: curso?.EJE_TEMATICO || ''
      };
    });

    setPlazas(plazasEnriquecidas);
    setLoading(false);
  }, [idPeriodo, idSede, idDocente]);

  useEffect(() => {
    fetchPlazas();
  }, [fetchPlazas]);

  // Obtener cursos únicos (para tabs)
  const cursos = useMemo(() => {
    const map = new Map();
    plazas.forEach(p => {
      if (!map.has(p.ID_CURSO)) {
        map.set(p.ID_CURSO, {
          ID_CURSO: p.ID_CURSO,
          NOMBRE_CURSO: p.NOMBRE_CURSO,
          CODIGO_CURSO: p.CODIGO_CURSO
        });
      }
    });
    return [...map.values()];
  }, [plazas]);

  return { plazas, cursos, loading, error, refetch: fetchPlazas };
}
