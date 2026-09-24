import { useState, useCallback } from 'react';
import { db } from '@/shared/api';

/**
 * Hook para vaciar la asistencia de una sesión.
 * No borra registros: pone a NULL los campos de marcado de la sesión
 * y el ESTADO_ASISTENCIA de los postulantes relacionados.
 */
export function useVaciarAsistencia() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Vaciar asistencia de una sesión
   * @param {number} idSesion - ID de la sesión a vaciar
   * @returns {Promise<Object>} - Resultado de la operación
   */
  const vaciarAsistencia = useCallback(async (idSesion) => {
    setLoading(true);
    setError(null);

    try {
      // 1. Postulantes: solo se limpia el estado (la fila se conserva)
      const asistencias = await db.select('ASISTENCIAS_POSTULANTE', { ID_SESION: idSesion }) || [];
      if (asistencias.length > 0) {
        const updates = asistencias.map(a => ({
          id: a.ID_ASISTENCIA,
          data: { ESTADO_ASISTENCIA: null },
        }));
        await db.updateBatch('ASISTENCIAS_POSTULANTE', updates, 'ID_ASISTENCIA');
      }

      // 2. Sesión: limpiar todos los campos de marcado
      const payload = {
        ID_DOCENTE_ASISTIO: null,
        ASISTIO: null,
        HORA_ENTRADA_REAL: null,
        HORA_SALIDA_REAL: null,
        OBSERVACIONES: null,
        NOMBRE_SUPLENTE_EXTERNO: null,
        MOTIVO_FALTA: null,
        MARCADO_POR: null,
        FECHA_MARCADO: null,
        FOTO_EVIDENCIA_PATH: null,
        ESTADO: 'programado',
      };
      const result = await db.update('SESIONES_AGRUPADAS', idSesion, payload, 'ID_SESION');

      setLoading(false);
      return { success: true, data: result };
    } catch (err) {
      setError(err.message || 'Error al vaciar asistencia');
      setLoading(false);
      throw err;
    }
  }, []);

  return {
    vaciarAsistencia,
    loading,
    error,
    resetError: () => setError(null)
  };
}
