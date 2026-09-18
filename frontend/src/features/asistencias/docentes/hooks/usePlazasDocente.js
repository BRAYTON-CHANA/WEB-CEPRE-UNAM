import { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '@/shared/api';
import { SEDE_VIRTUAL } from '../../shared/utils/sedeVirtual';

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

    // VW_PLAZA_DOCENTE ya trae NOMBRE_CURSO / CODIGO_CURSO / EJE_TEMATICO
    // Sede virtual: sin filtro server-side, se filtran ID_SEDE null en cliente
    const esVirtual = idSede === SEDE_VIRTUAL;
    const filters = {
      ID_PERIODO: idPeriodo,
      ID_DOCENTE: idDocente,
      PLAZA_ACTIVO: true,
      ...(esVirtual ? {} : { ID_SEDE: idSede })
    };
    db.select('VW_PLAZA_DOCENTE', filters)
      .then((plazasData) => {
        const lista = esVirtual ? (plazasData || []).filter(p => p.ID_SEDE == null) : (plazasData || []);
        setPlazas(lista);
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
