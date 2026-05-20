import { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '@/shared/api';

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

    // Cargar plazas del docente con info de cursos
    Promise.all([
      db.select('PLAZA_DOCENTE', { 
        ID_PERIODO: idPeriodo, 
        ID_SEDE: idSede, 
        ID_DOCENTE: idDocente,
        ACTIVO: true 
      }),
      db.select('CURSOS', { ACTIVO: true }),
      db.select('AREAS', { ACTIVO: true })
    ])
      .then(([plazasData, cursosData, areasData]) => {
        const plazasList = plazasData || [];
        const cursosList = cursosData || [];
        const areasList = areasData || [];

        // Crear maps
        const cursosMap = new Map();
        cursosList.forEach(c => cursosMap.set(c.ID_CURSO, c));

        const areasMap = new Map();
        areasList.forEach(a => areasMap.set(a.ID_AREA, a));

        // Enriquecer plazas con info de curso y área
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
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
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
