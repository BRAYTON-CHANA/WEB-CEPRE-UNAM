-- =============================================
-- VISTA: VW_TURNOS
-- Muestra turnos con datos del horario asociado
-- =============================================

CREATE VIEW IF NOT EXISTS VW_TURNOS AS
SELECT 
  t.ID_TURNO,
  t.NOMBRE_TURNO,
  t.DESCRIPCION,
  t.ACTIVO AS ACTIVO_TURNO,
  
  -- Datos del Horario asociado
  h.ID_HORARIO,
  h.NOMBRE_HORARIO,
  h.HORA_INICIO_JORNADA,
  h.HORA_FIN_JORNADA,
  h.ACTIVO AS ACTIVO_HORARIO

FROM TURNOS t
LEFT JOIN HORARIOS h ON t.ID_HORARIO = h.ID_HORARIO;
