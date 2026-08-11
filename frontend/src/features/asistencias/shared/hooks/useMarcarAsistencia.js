import { useState, useCallback } from 'react';
import { db } from '@/shared/api';

/**
 * Hook para marcar asistencia en una sesión
 * @returns {Object} - Funciones y estados para manejar el marcado de asistencia
 */
export function useMarcarAsistencia() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Marcar asistencia en una sesión
   * @param {number} idSesion - ID de la sesión a actualizar
   * @param {Object} data - Datos de la asistencia
   * @param {number} marcadoPor - ID del usuario que marca la asistencia
   * @returns {Promise<Object>} - Resultado de la operación
   */
  const marcarAsistencia = useCallback(async (idSesion, data, marcadoPor) => {
    setLoading(true);
    setError(null);

    try {
      // TODO: quitar mock - escritura real desactivada para capturas
      // Determinar si asistió basado en los datos
      const tieneDocente = data.ID_DOCENTE_ASISTIO != null && data.ID_DOCENTE_ASISTIO !== '';
      const tieneSuplenteExterno = data.NOMBRE_SUPLENTE_EXTERNO && data.NOMBRE_SUPLENTE_EXTERNO.trim() !== '';
      const asistio = tieneDocente || tieneSuplenteExterno;

      // Construir payload simulado (sin escribir a BD)
      const payload = {
        ID_DOCENTE_ASISTIO: tieneDocente ? data.ID_DOCENTE_ASISTIO : null,
        NOMBRE_SUPLENTE_EXTERNO: tieneSuplenteExterno ? data.NOMBRE_SUPLENTE_EXTERNO.trim() : null,
        ASISTIO: asistio,
        HORA_ENTRADA_REAL: data.HORA_ENTRADA_REAL || null,
        HORA_SALIDA_REAL: data.HORA_SALIDA_REAL || null,
        MOTIVO_FALTA: !asistio ? data.MOTIVO_FALTA : null,
        OBSERVACIONES: data.OBSERVACIONES || null,
        MARCADO_POR: marcadoPor,
        FECHA_MARCADO: new Date().toISOString()
      };

      // Actualización simulada (no guarda en BD)
      console.log('[MOCK] marcarAsistencia SESION', idSesion, payload);
      // const result = await db.update('SESIONES_AGRUPADAS', { ID_SESION: idSesion }, payload);

      setLoading(false);
      return { success: true, data: payload };
    } catch (err) {
      setError(err.message || 'Error al marcar asistencia');
      setLoading(false);
      throw err;
    }
  }, []);

  return {
    marcarAsistencia,
    loading,
    error,
    resetError: () => setError(null)
  };
}
