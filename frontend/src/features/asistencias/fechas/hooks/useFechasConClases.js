import { useState, useEffect, useCallback } from 'react';
import { db } from '@/shared/api';
import { MOCK_SESIONES } from '../../shared/mocks/mockData';

// TODO: quitar mock - carga real por paginación desactivada para capturas
// async function cargarSesionesPorPeriodo(idPeriodo) { ... }

export function useFechasConClases(idPeriodo) {
  const [fechas, setFechas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cargarFechas = useCallback(async () => {
    if (!idPeriodo) {
      setFechas([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // const data = await cargarSesionesPorPeriodo(idPeriodo);
      const data = MOCK_SESIONES.filter(s => s.ID_PERIODO === idPeriodo);
      
      // Agrupar por fecha y contar clases
      const fechasMap = new Map();
      (data || []).forEach(sesion => {
        const fecha = sesion.FECHA;
        if (!fechasMap.has(fecha)) {
          fechasMap.set(fecha, {
            fecha,
            totalClases: 0,
            grupos: new Set(),
            sesiones: []
          });
        }
        const info = fechasMap.get(fecha);
        info.totalClases++;
        info.grupos.add(sesion.ID_GRUPO);
        info.sesiones.push(sesion);
      });

      // Convertir a array y ordenar por fecha
      const resultado = Array.from(fechasMap.values())
        .map(f => ({
          ...f,
          totalGrupos: f.grupos.size,
          grupos: Array.from(f.grupos)
        }))
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

      setFechas(resultado);
    } catch (err) {
      setError(err.message || 'Error al cargar fechas');
      console.error('Error cargando fechas:', err);
    } finally {
      setLoading(false);
    }
  }, [idPeriodo]);

  useEffect(() => {
    cargarFechas();
  }, [cargarFechas]);

  return { fechas, loading, error, recargar: cargarFechas };
}
