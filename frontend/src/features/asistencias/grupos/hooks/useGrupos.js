import { useState, useEffect } from 'react';
import { db } from '@/shared/api';

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
    
    // Cargar grupos y sedes en paralelo
    Promise.all([
      db.select('GRUPOS', { ID_PERIODO: idPeriodo, ACTIVO: true }),
      db.select('SEDES', { ACTIVO: true })
    ])
      .then(([gruposData, sedesData]) => {
        const gruposList = gruposData || [];
        const sedesList = sedesData || [];
        
        // Crear map de sedes
        const sedesMap = new Map();
        sedesList.forEach(s => sedesMap.set(s.ID_SEDE, s));
        
        // Unir nombre de sede a cada grupo
        const gruposConSede = gruposList.map(g => ({
          ...g,
          NOMBRE_SEDE: sedesMap.get(g.ID_SEDE)?.NOMBRE_SEDE || `Sede ${g.ID_SEDE}`
        }));
        
        setGrupos(gruposConSede);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [idPeriodo]);

  const refetch = () => {
    if (!idPeriodo) return;
    setLoading(true);
    setError(null);
    
    Promise.all([
      db.select('GRUPOS', { ID_PERIODO: idPeriodo, ACTIVO: true }),
      db.select('SEDES', { ACTIVO: true })
    ])
      .then(([gruposData, sedesData]) => {
        const gruposList = gruposData || [];
        const sedesList = sedesData || [];
        const sedesMap = new Map();
        sedesList.forEach(s => sedesMap.set(s.ID_SEDE, s));
        const gruposConSede = gruposList.map(g => ({
          ...g,
          NOMBRE_SEDE: sedesMap.get(g.ID_SEDE)?.NOMBRE_SEDE || `Sede ${g.ID_SEDE}`
        }));
        setGrupos(gruposConSede);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  return { grupos, loading, error, refetch };
}
