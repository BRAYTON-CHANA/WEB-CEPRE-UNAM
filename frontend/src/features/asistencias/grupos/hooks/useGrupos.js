import { useState, useEffect } from 'react';
import { db } from '@/shared/api';
import { MOCK_GRUPOS, MOCK_SEDES } from '../../shared/mocks/mockData';

export function useGrupos(idPeriodo) {
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!idPeriodo) {
      setGrupos([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    // TODO: quitar mock - consultas reales desactivadas para capturas
    // Promise.all([
    //   db.select('GRUPOS', { ID_PERIODO: idPeriodo, ACTIVO: true }),
    //   db.select('SEDES', { ACTIVO: true })
    // ])
    //   .then(([gruposData, sedesData]) => { ... })

    const sedesMap = new Map();
    MOCK_SEDES.forEach(s => sedesMap.set(s.ID_SEDE, s));
    const gruposConSede = MOCK_GRUPOS.map(g => ({
      ...g,
      NOMBRE_SEDE: sedesMap.get(g.ID_SEDE)?.NOMBRE_SEDE || `Sede ${g.ID_SEDE}`
    }));
    setGrupos(gruposConSede);
    setLoading(false);
  }, [idPeriodo]);

  const refetch = () => {
    if (!idPeriodo) return;
    setLoading(true);
    setError(null);

    // TODO: quitar mock
    const sedesMap = new Map();
    MOCK_SEDES.forEach(s => sedesMap.set(s.ID_SEDE, s));
    const gruposConSede = MOCK_GRUPOS.map(g => ({
      ...g,
      NOMBRE_SEDE: sedesMap.get(g.ID_SEDE)?.NOMBRE_SEDE || `Sede ${g.ID_SEDE}`
    }));
    setGrupos(gruposConSede);
    setLoading(false);
  };

  return { grupos, loading, error, refetch };
}
