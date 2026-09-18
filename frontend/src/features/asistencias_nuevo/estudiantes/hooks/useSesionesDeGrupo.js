import { useState, useEffect, useCallback } from 'react';
import { db } from '@/shared/api';

/**
 * useSesionesDeGrupo — sesiones activas de un grupo (VW_SESIONES_GRUPO),
 * ordenadas por FECHA + HORA_INICIO.
 */
export function useSesionesDeGrupo(idGrupo) {
  const [sesiones, setSesiones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cargar = useCallback(() => {
    if (!idGrupo) {
      setSesiones([]);
      setError(null);
      return Promise.resolve();
    }

    setLoading(true);
    setError(null);

    return db.select('VW_SESIONES_GRUPO', { ID_GRUPO: idGrupo })
      .then(data => {
        const lista = (data || []).slice().sort((a, b) => {
          const fa = a.FECHA || '', fb = b.FECHA || '';
          if (fa !== fb) return fa < fb ? -1 : 1;
          return (a.HORA_INICIO || '') < (b.HORA_INICIO || '') ? -1 : 1;
        });
        setSesiones(lista);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [idGrupo]);

  useEffect(() => { cargar(); }, [cargar]);

  return { sesiones, loading, error, refetch: cargar };
}
