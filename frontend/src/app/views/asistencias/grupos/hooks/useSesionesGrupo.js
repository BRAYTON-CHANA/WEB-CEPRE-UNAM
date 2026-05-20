import { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '@/shared/api';

export function useSesionesGrupo(idGrupo) {
  const [sesiones, setSesiones] = useState([]);
  const [cursoActivo, setCursoActivo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSesiones = useCallback(() => {
    if (!idGrupo) {
      setSesiones([]);
      setCursoActivo(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    db.select('VW_SESIONES_COMPLETA', { ID_GRUPO: idGrupo })
      .then(data => {
        const lista = data || [];
        setSesiones(lista);
        const cursos = [...new Map(lista.map(s => [s.ID_CURSO, s])).values()];
        if (cursos.length > 0) {
          setCursoActivo(cursos[0].ID_CURSO);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [idGrupo]);

  useEffect(() => {
    fetchSesiones();
  }, [fetchSesiones]);

  const cursos = useMemo(() => {
    const map = new Map();
    sesiones.forEach(s => {
      if (!map.has(s.ID_CURSO)) {
        map.set(s.ID_CURSO, {
          ID_CURSO: s.ID_CURSO,
          NOMBRE_CURSO: s.NOMBRE_CURSO,
          CODIGO_CURSO: s.CODIGO_CURSO,
          NOMBRE_AREA: s.NOMBRE_AREA
        });
      }
    });
    return [...map.values()];
  }, [sesiones]);

  const sesionesDelCurso = useMemo(() => {
    return sesiones
      .filter(s => s.ID_CURSO === cursoActivo)
      .sort((a, b) => new Date(a.FECHA) - new Date(b.FECHA));
  }, [sesiones, cursoActivo]);

  return {
    sesiones,
    cursos,
    cursoActivo,
    setCursoActivo,
    sesionesDelCurso,
    loading,
    error,
    refetch: fetchSesiones
  };
}
