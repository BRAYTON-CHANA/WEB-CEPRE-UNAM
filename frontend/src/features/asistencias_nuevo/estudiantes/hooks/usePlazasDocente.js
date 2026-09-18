import { useState, useEffect, useCallback } from 'react';
import { db } from '@/shared/api';

/**
 * usePlazasDocente — plazas asignadas al docente (por DNI) en un período.
 * VW_PLAZA_DOCENTE ya trae curso, sede/modalidad, período y datos del docente.
 */
export function usePlazasDocente(dni, idPeriodo) {
  const [plazas, setPlazas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cargar = useCallback(() => {
    if (!dni || !idPeriodo) {
      setPlazas([]);
      setError(null);
      return Promise.resolve();
    }

    setLoading(true);
    setError(null);

    return db.select('VW_PLAZA_DOCENTE', { DNI: dni, ID_PERIODO: idPeriodo })
      .then(data => {
        setPlazas((data || []).filter(p => p.PLAZA_ACTIVO !== false));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [dni, idPeriodo]);

  useEffect(() => { cargar(); }, [cargar]);

  return { plazas, loading, error, refetch: cargar };
}
