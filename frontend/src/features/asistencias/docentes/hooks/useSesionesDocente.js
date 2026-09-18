import { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '@/shared/api';
import { SEDE_VIRTUAL } from '../../shared/utils/sedeVirtual';

export function useSesionesDocente(idPeriodo, idSede, idDocente, idPlaza) {
  const [sesiones, setSesiones] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [grupoActivo, setGrupoActivo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!idPeriodo || !idSede || !idDocente || !idPlaza) {
      setSesiones([]);
      setGrupos([]);
      setGrupoActivo(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Query directo a VW_SESIONES_COMPLETA filtrando por plaza y docente
      // Sede virtual: ID_SEDE IS NULL (no se puede filtrar null por parámetro posicional aquí)
      const filtroSede = idSede === SEDE_VIRTUAL ? '"ID_SEDE" IS NULL' : '"ID_SEDE" = $4';
      const todasLasSesiones = await db.rawSelect(
        `SELECT * FROM "VW_SESIONES_COMPLETA"
         WHERE "ID_PLAZA_DOCENTE" = $1
           AND "ID_DOCENTE_PROGRAMADO" = $2
           AND "ID_PERIODO" = $3
           AND ${filtroSede}
         ORDER BY "FECHA", "HORA_INICIO"`,
        idPlaza, idDocente, idPeriodo, ...(idSede === SEDE_VIRTUAL ? [] : [idSede])
      ) || [];

      setSesiones(todasLasSesiones);

      // Extraer grupos únicos de las sesiones
      const gruposMap = new Map();
      todasLasSesiones.forEach(s => {
        if (!gruposMap.has(s.ID_GRUPO)) {
          gruposMap.set(s.ID_GRUPO, {
            ID_GRUPO: s.ID_GRUPO,
            CODIGO_GRUPO: s.CODIGO_GRUPO,
            NOMBRE_GRUPO: s.NOMBRE_GRUPO,
            ID_GRUPO_PLAN_CURSO: s.ID_GRUPO_PLAN_CURSO
          });
        }
      });
      const gruposUnicos = [...gruposMap.values()];

      setGrupos(gruposUnicos);
      if (gruposUnicos.length > 0 && !grupoActivo) {
        setGrupoActivo(gruposUnicos[0].ID_GRUPO);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [idPeriodo, idSede, idDocente, idPlaza]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sesionesDelGrupo = useMemo(() => {
    if (!grupoActivo) return [];
    return sesiones
      .filter(s => s.ID_GRUPO === grupoActivo)
      .sort((a, b) => new Date(a.FECHA) - new Date(b.FECHA));
  }, [sesiones, grupoActivo]);

  return {
    sesiones,
    grupos,
    grupoActivo,
    setGrupoActivo,
    sesionesDelGrupo,
    loading,
    error,
    refetch: fetchData
  };
}
