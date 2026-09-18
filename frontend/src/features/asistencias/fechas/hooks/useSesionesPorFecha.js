import { useState, useEffect, useCallback } from 'react';
import { db } from '@/shared/api';
import { SEDE_VIRTUAL } from '../../shared/utils/sedeVirtual';

export function useSesionesPorFecha(fecha, idSede) {
  const [sesiones, setSesiones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cargarSesiones = useCallback(async () => {
    if (!fecha || !idSede) return;
    
    setLoading(true);
    setError(null);
    try {
      // Sede virtual: sin filtro server-side, se filtran ID_SEDE null en cliente
      const esVirtual = idSede === SEDE_VIRTUAL;
      const filters = esVirtual ? { FECHA: fecha } : { FECHA: fecha, ID_SEDE: idSede };
      const data = await db.select('VW_SESIONES_COMPLETA', filters);
      const lista = esVirtual ? (data || []).filter(s => s.ID_SEDE == null) : (data || []);

      // Agrupar por grupo
      const gruposMap = new Map();
      lista.forEach(sesion => {
        const grupoId = sesion.ID_GRUPO;
        if (!gruposMap.has(grupoId)) {
          gruposMap.set(grupoId, {
            idGrupo: grupoId,
            codigoGrupo: sesion.CODIGO_GRUPO,
            nombreGrupo: sesion.NOMBRE_GRUPO,
            nombreArea: sesion.NOMBRE_AREA,
            sesiones: []
          });
        }
        gruposMap.get(grupoId).sesiones.push(sesion);
      });

      // Ordenar sesiones por hora dentro de cada grupo
      gruposMap.forEach(grupo => {
        grupo.sesiones.sort((a, b) => a.HORA_INICIO.localeCompare(b.HORA_INICIO));
      });

      // Convertir a array ordenado por nombre de grupo
      const resultado = Array.from(gruposMap.values())
        .sort((a, b) => a.nombreGrupo.localeCompare(b.nombreGrupo));

      setSesiones(resultado);
    } catch (err) {
      setError(err.message || 'Error al cargar sesiones');
      console.error('Error cargando sesiones:', err);
    } finally {
      setLoading(false);
    }
  }, [fecha, idSede]);

  useEffect(() => {
    cargarSesiones();
  }, [cargarSesiones]);

  return { grupos: sesiones, loading, error, recargar: cargarSesiones };
}
