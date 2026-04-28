import { useCallback } from 'react';
import { transformToCustomBlocks, transformToEventsDocente } from '../utils/transformers';
import { API_BASE_URL as API_BASE } from '@/shared/config/api';

/**
 * Hook para cargar el horario visual por docente.
 * No hace inserts — solo lectura.
 */
export const useAsignacionHorarioDocente = ({
  setLoadingCalendar,
  setCustomBlocks,
  setCalendarStartHour,
  setCalendarFinalHour,
  setEvents,
  setDocenteNombre
}) => {
  /**
   * Cargar horario del docente filtrando VW_ASIGNACION_HORARIO por
   * ID_DOCENTE_PERIODO + ID_PERIODO_GRUPO + ID_SEDE + ID_TURNO.
   * @param {Object} params { ID_DOCENTE_PERIODO, ID_PERIODO, ID_SEDE, ID_TURNO }
   */
  const loadHorarioByDocente = useCallback(async ({ ID_DOCENTE_PERIODO, ID_PERIODO, ID_SEDE, ID_TURNO }) => {
    if (!ID_DOCENTE_PERIODO || !ID_PERIODO || !ID_SEDE || !ID_TURNO) return;

    setLoadingCalendar(true);

    try {
      // Paso 1: Obtener ID_HORARIO del turno
      const turnoFilters = JSON.stringify([{ field: 'ID_TURNO', op: '=', value: ID_TURNO }]);
      const turnoRes = await fetch(`${API_BASE}/tables/TURNOS?filters=${encodeURIComponent(turnoFilters)}`);
      const turnoData = await turnoRes.json();
      const turnoRecord = turnoData?.data?.records?.[0];
      if (!turnoRecord) {
        console.error('No se encontró el turno', ID_TURNO);
        setLoadingCalendar(false);
        return;
      }
      const idHorario = turnoRecord.ID_HORARIO;

      // Paso 2: Bloques del horario
      const bloquesFilters = JSON.stringify([{ field: 'ID_HORARIO', op: '=', value: idHorario }]);
      const bloquesRes = await fetch(`${API_BASE}/tables/VW_HORARIO_BLOQUES?filters=${encodeURIComponent(bloquesFilters)}`);
      const bloquesData = await bloquesRes.json();

      const transformedBlocks = transformToCustomBlocks(bloquesData);
      setCustomBlocks(transformedBlocks);

      if (bloquesData?.data?.records?.length > 0) {
        const first = bloquesData.data.records[0];
        const [sh, sm] = first.HORA_INICIO_JORNADA.split(':');
        const [fh, fm] = first.HORA_FIN_JORNADA.split(':');
        setCalendarStartHour(parseInt(sh) + parseInt(sm) / 60);
        setCalendarFinalHour(parseInt(fh) + parseInt(fm) / 60);
      }

      // Paso 3: Asignaciones del docente en el contexto (periodo, sede, turno)
      const asigFilters = JSON.stringify([
        { field: 'ID_DOCENTE_PERIODO', op: '=', value: ID_DOCENTE_PERIODO },
        { field: 'ID_PERIODO_GRUPO', op: '=', value: ID_PERIODO },
        { field: 'ID_SEDE', op: '=', value: ID_SEDE },
        { field: 'ID_TURNO', op: '=', value: ID_TURNO }
      ]);
      const asigRes = await fetch(`${API_BASE}/tables/VW_ASIGNACION_HORARIO?filters=${encodeURIComponent(asigFilters)}`);
      const asigData = await asigRes.json();

      const events = transformToEventsDocente(asigData);
      setEvents(events);

      // Tomar nombre del docente del primer record; si vacío, fetch fallback
      const firstAsig = asigData?.data?.records?.[0];
      if (setDocenteNombre) {
        if (firstAsig) {
          setDocenteNombre(firstAsig.NOMBRE_COMPLETO_DOCENTE || firstAsig.IDENTIFICADOR_DOCENTE || '');
        } else {
          try {
            const dpFilters = JSON.stringify([{ field: 'ID_DOCENTE_PERIODO', op: '=', value: ID_DOCENTE_PERIODO }]);
            const dpRes = await fetch(`${API_BASE}/tables/VW_DOCENTE_PERIODO?filters=${encodeURIComponent(dpFilters)}`);
            const dpData = await dpRes.json();
            const dpRec = dpData?.data?.records?.[0];
            if (dpRec) {
              const nombre = dpRec.NOMBRE_COMPLETO_DOCENTE
                || (dpRec.APELLIDOS && dpRec.NOMBRES ? `${dpRec.APELLIDOS}, ${dpRec.NOMBRES}` : '')
                || dpRec.IDENTIFICADOR_DOCENTE
                || '';
              setDocenteNombre(nombre);
            }
          } catch (_) { /* silencioso */ }
        }
      }
    } catch (err) {
      console.error('Error cargando horario del docente:', err);
    } finally {
      setLoadingCalendar(false);
    }
  }, [setLoadingCalendar, setCustomBlocks, setCalendarStartHour, setCalendarFinalHour, setEvents, setDocenteNombre]);

  /**
   * Reset de la vista (al cambiar Periodo/Sede/Turno o limpiar Docente)
   */
  const resetHorario = useCallback(() => {
    setCustomBlocks(null);
    setEvents(null);
    if (setDocenteNombre) setDocenteNombre(null);
  }, [setCustomBlocks, setEvents, setDocenteNombre]);

  return { loadHorarioByDocente, resetHorario };
};
