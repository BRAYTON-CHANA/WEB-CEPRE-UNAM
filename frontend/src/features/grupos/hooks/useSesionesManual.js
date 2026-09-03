import { useState, useCallback, useEffect, useMemo } from 'react';
import { db } from '@/shared/api';

/**
 * useSesionesManual — hook para añadir/eliminar sesiones manualmente
 * en el modo manual (grupo activado).
 *
 * Props:
 *   sharedGrupo      — ID del grupo seleccionado
 *   snapshotBloques  — array de bloques snapshot (VW_SESION_HORARIO_BLOQUES)
 *   sesiones         — array de sesiones actuales (VW_SESIONES_GRUPO)
 *   onSesionesChange — callback para recargar sesiones tras crear/eliminar
 */
export function useSesionesManual({ sharedGrupo, snapshotBloques, sesiones, onSesionesChange }) {
  const [modoAdd, setModoAdd] = useState(false);
  const [fechaSeleccionada, setFechaSeleccionada] = useState('');
  const [selectedCurso, setSelectedCurso] = useState('');
  const [selectedBloques, setSelectedBloques] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [pendienteDecision, setPendienteDecision] = useState(null);

  // ===== Iniciar modo add (sin carga de fechas, input date nativo) =====
  const handleStartAdd = useCallback(() => {
    setModoAdd(true);
    setFechaSeleccionada('');
    setSelectedCurso('');
    setSelectedBloques(new Set());
    setError(null);
    setPendienteDecision(null);
  }, []);

  const handleCancelAdd = useCallback(() => {
    setModoAdd(false);
    setFechaSeleccionada('');
    setSelectedCurso('');
    setSelectedBloques(new Set());
    setError(null);
    setPendienteDecision(null);
  }, []);

  // ===== Construir bloques del día seleccionado =====
  const bloquesDelDia = useMemo(() => {
    if (!fechaSeleccionada || !snapshotBloques || snapshotBloques.length === 0) return [];

    // Filtrar sesiones de la fecha seleccionada
    const sesionesDelDia = sesiones.filter(s => {
      let fStr = s.FECHA;
      if (typeof fStr === 'string' && fStr.includes('T')) fStr = fStr.split('T')[0];
      return fStr === fechaSeleccionada;
    });

    // Mapear ID_SESION_BLOQUE → sesión que lo ocupa
    const bloqueToSesion = new Map();
    for (const s of sesionesDelDia) {
      const ids = normalizeBloquesIds(s.BLOQUES_IDS);
      for (const id of ids) {
        bloqueToSesion.set(id, s);
      }
    }

    // Construir lista de bloques con info de ocupación
    const horaInicioJornada = snapshotBloques[0]?.HORA_INICIO_JORNADA;
    if (!horaInicioJornada) return [];

    const startMinutes = timeToMinutes(horaInicioJornada);
    const sorted = [...snapshotBloques].sort((a, b) => (a.ORDEN || 0) - (b.ORDEN || 0));

    let currentMin = startMinutes;
    return sorted.map(b => {
      const duracion = b.DURACION || 0;
      const horaInicio = minutesToTime(currentMin);
      const endMin = currentMin + duracion;
      const horaFin = minutesToTime(endMin);
      currentMin = endMin;

      const idSesionBloque = b.ID_SESION_BLOQUE;
      const sesionOcupante = bloqueToSesion.get(idSesionBloque);
      const tipo = (b.TIPO_BLOQUE || 'clase').toLowerCase();

      return {
        idSesionBloque,
        orden: b.ORDEN,
        duracion,
        tipo,
        etiqueta: b.ETIQUETA || null,
        horaInicio,
        horaFin,
        timeKey: `${horaInicio}-${horaFin}`,
        ocupado: !!sesionOcupante,
        sesion: sesionOcupante || null,
        curso: sesionOcupante?.NOMBRE_CURSO || null,
        docente: sesionOcupante?.DOCENTE_ASIGNADO || null,
        color: sesionOcupante?.CURSO_COLOR || null,
        idGrupoCurso: sesionOcupante?.ID_GRUPO_CURSO || null,
        seleccionable: tipo === 'clase' && !sesionOcupante
      };
    });
  }, [fechaSeleccionada, snapshotBloques, sesiones]);

  const handleSelectFecha = useCallback((fecha) => {
    setFechaSeleccionada(fecha);
    setSelectedBloques(new Set());
    setError(null);
  }, []);

  const handleBloqueToggle = useCallback((idSesionBloque) => {
    setSelectedBloques(prev => {
      const next = new Set(prev);
      if (next.has(idSesionBloque)) {
        next.delete(idSesionBloque);
      } else {
        next.add(idSesionBloque);
      }
      return next;
    });
  }, []);

  const handleConfirmAdd = useCallback(async () => {
    if (!sharedGrupo || !fechaSeleccionada || !selectedCurso || selectedBloques.size === 0) return;
    setSaving(true);
    setError(null);
    try {
      // Convertir IDs de sesión bloque → ORDENES
      const bloqueMap = new Map();
      for (const b of bloquesDelDia) {
        bloqueMap.set(b.idSesionBloque, b.orden);
      }
      const ordenes = Array.from(selectedBloques)
        .map(id => bloqueMap.get(id))
        .filter(o => o != null)
        .sort((a, b) => a - b);

      const result = await db.executeFunction('fn_crear_sesion_manual', {
        p_id_grupo: Number(sharedGrupo),
        p_fecha: fechaSeleccionada,
        p_id_grupo_curso: Number(selectedCurso),
        p_bloques_ordenes: ordenes
      });

      // Verificar si requiere decisión de unión
      if (result && result.requiere_decision) {
        setPendienteDecision({
          sesiones_adyacentes: result.sesiones_adyacentes || [],
          bloques_ordenes: ordenes
        });
        setSaving(false);
        return;
      }

      // Sin decisión requerida → recargar
      if (onSesionesChange) await onSesionesChange();
      setSelectedBloques(new Set());
    } catch (err) {
      console.error('Error al crear sesión manual:', err);
      const msg = err?.message || 'Error al crear sesión';
      if (msg.includes('[SOLAPAMIENTO_SESION]') ||
          msg.includes('[SOLAPAMIENTO_DOCENTE]') ||
          msg.includes('[SOLAPAMIENTO_PLAZA]')) {
        setError({ tipo: 'SOLAPAMIENTO', message: msg });
      } else {
        setError({ tipo: 'ERROR', message: msg });
      }
    } finally {
      setSaving(false);
    }
  }, [sharedGrupo, fechaSeleccionada, selectedCurso, selectedBloques, bloquesDelDia, onSesionesChange]);

  // ===== Confirmar decisión de unión =====
  const handleConfirmDecision = useCallback(async (decisiones) => {
    if (!pendienteDecision) return;
    setSaving(true);
    setError(null);
    try {
      // decisiones = [{ id_sesion, unir: boolean }]
      const unirIds = decisiones
        .filter(d => d.unir)
        .map(d => Number(d.id_sesion));

      await db.executeFunction('fn_crear_sesion_manual', {
        p_id_grupo: Number(sharedGrupo),
        p_fecha: fechaSeleccionada,
        p_id_grupo_curso: Number(selectedCurso),
        p_bloques_ordenes: pendienteDecision.bloques_ordenes,
        p_unir_sesiones: unirIds
      });

      setPendienteDecision(null);
      if (onSesionesChange) await onSesionesChange();
      setSelectedBloques(new Set());
    } catch (err) {
      console.error('Error al confirmar decisión:', err);
      const msg = err?.message || 'Error al crear sesión';
      setError({ tipo: 'ERROR', message: msg });
    } finally {
      setSaving(false);
    }
  }, [pendienteDecision, sharedGrupo, fechaSeleccionada, selectedCurso, onSesionesChange]);

  const handleCancelDecision = useCallback(() => {
    setPendienteDecision(null);
  }, []);

  const handleEliminarSesion = useCallback(async (idSesion) => {
    if (!idSesion) return;
    setSaving(true);
    setError(null);
    try {
      await db.executeFunction('fn_eliminar_sesion', {
        p_id_sesion: Number(idSesion)
      });
      if (onSesionesChange) await onSesionesChange();
    } catch (err) {
      console.error('Error al eliminar sesión:', err);
      setError({ tipo: 'ERROR', message: err?.message || 'Error al eliminar sesión' });
    } finally {
      setSaving(false);
    }
  }, [onSesionesChange]);

  const handleClearError = useCallback(() => setError(null), []);

  return {
    modoAdd,
    fechaSeleccionada,
    bloquesDelDia,
    selectedCurso,
    selectedBloques,
    saving,
    error,
    pendienteDecision,
    setSelectedCurso,
    handleStartAdd,
    handleCancelAdd,
    handleSelectFecha,
    handleBloqueToggle,
    handleConfirmAdd,
    handleConfirmDecision,
    handleCancelDecision,
    handleEliminarSesion,
    handleClearError
  };
}

// ===== Helpers =====
const normalizeBloquesIds = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(Number).filter(n => !isNaN(n));
  if (typeof val === 'string') {
    const cleaned = val.replace(/[{}]/g, '').trim();
    if (!cleaned) return [];
    return cleaned.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
  }
  return [];
};

const timeToMinutes = (t) => {
  if (!t) return 0;
  const s = String(t).slice(0, 5);
  const [h, m] = s.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

const minutesToTime = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};
