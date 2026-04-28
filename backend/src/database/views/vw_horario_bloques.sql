-- =============================================
-- VISTA: VW_HORARIO_BLOQUES
-- Muestra bloques de horario con horas calculadas
-- Calcula hora inicio y fin basado en HORA_INICIO_JORNADA, ORDEN y DURACION
-- =============================================

CREATE VIEW IF NOT EXISTS VW_HORARIO_BLOQUES AS
SELECT 
  hb.ID_BLOQUE,
  hb.ID_HORARIO,
  hb.ORDEN,
  hb.DURACION,
  hb.TIPO_BLOQUE,
  hb.ETIQUETA,
  hb.ACTIVO AS ACTIVO_BLOQUE,
  
  -- Datos del Horario
  h.NOMBRE_HORARIO,
  h.HORA_INICIO_JORNADA,
  h.HORA_FIN_JORNADA,
  h.ACTIVO AS ACTIVO_HORARIO,
  
  -- Calcular duración acumulada de bloques anteriores
  (
    SELECT COALESCE(SUM(b2.DURACION), 0)
    FROM HORARIO_BLOQUES b2
    WHERE b2.ID_HORARIO = hb.ID_HORARIO
      AND b2.ORDEN < hb.ORDEN
  ) AS DURACION_ACUMULADA_ANTERIOR,
  
  -- Calcular hora inicio del bloque (en minutos desde medianoche)
  (
    SELECT (
      CAST(SUBSTR(h.HORA_INICIO_JORNADA, 1, 2) AS INTEGER) * 60 +
      CAST(SUBSTR(h.HORA_INICIO_JORNADA, 4, 2) AS INTEGER)
    ) + COALESCE(
      (SELECT SUM(b2.DURACION)
       FROM HORARIO_BLOQUES b2
       WHERE b2.ID_HORARIO = hb.ID_HORARIO
         AND b2.ORDEN < hb.ORDEN),
      0
    )
  ) AS HORA_INICIO_MINUTOS,
  
  -- Calcular hora fin del bloque (en minutos desde medianoche)
  (
    SELECT (
      CAST(SUBSTR(h.HORA_INICIO_JORNADA, 1, 2) AS INTEGER) * 60 +
      CAST(SUBSTR(h.HORA_INICIO_JORNADA, 4, 2) AS INTEGER)
    ) + COALESCE(
      (SELECT SUM(b2.DURACION)
       FROM HORARIO_BLOQUES b2
       WHERE b2.ID_HORARIO = hb.ID_HORARIO
         AND b2.ORDEN < hb.ORDEN),
      0
    ) + hb.DURACION
  ) AS HORA_FIN_MINUTOS,
  
  -- Hora inicio formateada HH:MM
  (
    SELECT 
      printf('%02d:%02d', 
        (CAST(SUBSTR(h.HORA_INICIO_JORNADA, 1, 2) AS INTEGER) * 60 +
         CAST(SUBSTR(h.HORA_INICIO_JORNADA, 4, 2) AS INTEGER) +
         COALESCE((SELECT SUM(b2.DURACION)
                   FROM HORARIO_BLOQUES b2
                   WHERE b2.ID_HORARIO = hb.ID_HORARIO
                     AND b2.ORDEN < hb.ORDEN), 0)
        ) / 60,
        (CAST(SUBSTR(h.HORA_INICIO_JORNADA, 1, 2) AS INTEGER) * 60 +
         CAST(SUBSTR(h.HORA_INICIO_JORNADA, 4, 2) AS INTEGER) +
         COALESCE((SELECT SUM(b2.DURACION)
                   FROM HORARIO_BLOQUES b2
                   WHERE b2.ID_HORARIO = hb.ID_HORARIO
                     AND b2.ORDEN < hb.ORDEN), 0)
        ) % 60
      )
  ) AS HORA_INICIO_CALCULADA,
  
  -- Hora fin formateada HH:MM
  (
    SELECT 
      printf('%02d:%02d', 
        (CAST(SUBSTR(h.HORA_INICIO_JORNADA, 1, 2) AS INTEGER) * 60 +
         CAST(SUBSTR(h.HORA_INICIO_JORNADA, 4, 2) AS INTEGER) +
         COALESCE((SELECT SUM(b2.DURACION)
                   FROM HORARIO_BLOQUES b2
                   WHERE b2.ID_HORARIO = hb.ID_HORARIO
                     AND b2.ORDEN < hb.ORDEN), 0) +
         hb.DURACION
        ) / 60,
        (CAST(SUBSTR(h.HORA_INICIO_JORNADA, 1, 2) AS INTEGER) * 60 +
         CAST(SUBSTR(h.HORA_INICIO_JORNADA, 4, 2) AS INTEGER) +
         COALESCE((SELECT SUM(b2.DURACION)
                   FROM HORARIO_BLOQUES b2
                   WHERE b2.ID_HORARIO = hb.ID_HORARIO
                     AND b2.ORDEN < hb.ORDEN), 0) +
         hb.DURACION
        ) % 60
      )
  ) AS HORA_FIN_CALCULADA

FROM HORARIO_BLOQUES hb
INNER JOIN HORARIOS h ON hb.ID_HORARIO = h.ID_HORARIO
ORDER BY hb.ID_HORARIO, hb.ORDEN;
