import { useState, useEffect, useCallback } from 'react';
import { db } from '@/shared/api';
import { SEDE_VIRTUAL } from '../../shared/utils/sedeVirtual';

export function useTodosEstudiantes(idPeriodo, idSede) {
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEstudiantes = useCallback(() => {
    if (!idPeriodo || !idSede) {
      setEstudiantes([]);
      return;
    }
    setLoading(true);
    setError(null);
    // Sede virtual: sin filtro server-side, se filtran ID_SEDE null en cliente
    const esVirtual = idSede === SEDE_VIRTUAL;
    const filters = esVirtual
      ? { ID_PERIODO: idPeriodo }
      : { ID_PERIODO: idPeriodo, ID_SEDE: idSede };
    db.select('VW_RESUMEN_ASISTENCIAS_POSTULANTE', filters)
      .then(data => {
        const rows = esVirtual ? (data || []).filter(r => r.ID_SEDE == null) : (data || []);
        const resultado = rows
          .map(row => ({
            ID_POSTULANTE:  row.ID_POSTULANTE,
            NOMBRES:        row.NOMBRES,
            APELLIDOS:      row.APELLIDOS,
            ID_GRUPO:       row.ID_GRUPO,
            NOMBRE_GRUPO:   row.NOMBRE_GRUPO || row.CODIGO_GRUPO || '—',
            totalSesiones:  Number(row.TOTAL_SESIONES)    || 0,
            asistio:        Number(row.TOTAL_ASISTIO)     || 0,
            tardanza:       Number(row.TOTAL_TARDANZA)    || 0,
            falta:          Number(row.TOTAL_FALTA)       || 0,
            justificado:    Number(row.TOTAL_JUSTIFICADO) || 0,
            sinMarcar:      Number(row.TOTAL_SIN_MARCAR)  || 0,
            porcentaje:       row.PORCENTAJE_ASISTENCIA != null
                                ? Number(row.PORCENTAJE_ASISTENCIA)
                                : null,
            porcentajeFaltas: row.PORCENTAJE_FALTAS != null
                                ? Number(row.PORCENTAJE_FALTAS)
                                : null,
            porcentajeJustificacion: row.PORCENTAJE_JUSTIFICACION != null
                                ? Number(row.PORCENTAJE_JUSTIFICACION)
                                : null,
          }))
          .sort((a, b) => a.APELLIDOS.localeCompare(b.APELLIDOS));

        setEstudiantes(resultado);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [idPeriodo, idSede]);

  useEffect(() => {
    fetchEstudiantes();
  }, [fetchEstudiantes]);

  return { estudiantes, loading, error, refetch: fetchEstudiantes };
}
