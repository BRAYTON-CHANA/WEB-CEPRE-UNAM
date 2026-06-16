import { useState, useEffect } from 'react';
import { db } from '@/shared/api';

export function usePeriodos() {
  const [periodos, setPeriodos] = useState([]);
  const [periodoActivo, setPeriodoActivo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    db.select('PERIODOS', { ACTIVO: true })
      .then(data => {
        const lista = data || [];
        setPeriodos(lista);
        if (lista.length > 0) {
          setPeriodoActivo(lista[0].ID_PERIODO);
        }
      })
      .catch(() => setPeriodos([]))
      .finally(() => setLoading(false));
  }, []);

  return { periodos, periodoActivo, setPeriodoActivo, loading };
}
