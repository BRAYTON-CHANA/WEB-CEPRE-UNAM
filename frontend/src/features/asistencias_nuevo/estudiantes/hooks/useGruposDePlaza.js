import { useState, useEffect, useCallback } from 'react';
import { db } from '@/shared/api';

/**
 * useGruposDePlaza — GRUPO_CURSO activos de una o varias plazas.
 * Acepta idPlazaDocente único o array de IDs (1 query con `in`).
 * Retorna:
 *  - idsGrupos: Set de ID_GRUPO donde las plazas dictan
 *  - grupoInfoPorGrupo: Map ID_GRUPO -> { cursos: Set<ID_GRUPO_CURSO>, plazas: Set<ID_PLAZA_DOCENTE> }
 */
export function useGruposDePlaza(idsPlazaDocente) {
  const [idsGrupos, setIdsGrupos] = useState(null);
  const [grupoInfoPorGrupo, setGrupoInfoPorGrupo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const idsKey = Array.isArray(idsPlazaDocente) ? idsPlazaDocente.join(',') : idsPlazaDocente;

  const cargar = useCallback(() => {
    const ids = Array.isArray(idsPlazaDocente) ? idsPlazaDocente : (idsPlazaDocente ? [idsPlazaDocente] : []);
    if (ids.length === 0) {
      setIdsGrupos(null);
      setGrupoInfoPorGrupo(null);
      setError(null);
      return Promise.resolve();
    }

    setLoading(true);
    setError(null);

    const filtros = ids.length === 1
      ? { ID_PLAZA_DOCENTE: ids[0], ACTIVO: true }
      : [{ field: 'ID_PLAZA_DOCENTE', op: 'in', value: ids }, { field: 'ACTIVO', op: 'eq', value: true }];

    return db.select('GRUPO_CURSO', filtros)
      .then(data => {
        const rows = data || [];
        const map = new Map();
        rows.forEach(gc => {
          if (!map.has(gc.ID_GRUPO)) map.set(gc.ID_GRUPO, { cursos: new Set(), plazas: new Set() });
          const info = map.get(gc.ID_GRUPO);
          info.cursos.add(gc.ID_GRUPO_CURSO);
          info.plazas.add(gc.ID_PLAZA_DOCENTE);
        });
        setIdsGrupos(new Set(map.keys()));
        setGrupoInfoPorGrupo(map);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  useEffect(() => { cargar(); }, [cargar]);

  return { idsGrupos, grupoInfoPorGrupo, loading, error, refetch: cargar };
}
