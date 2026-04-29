-- =============================================
-- FUNCTION: fn_grupos_por_contexto
-- Lista grupos filtrados por periodo+sede+turno, con conteo de horas académicas
-- programadas (suma de DURACION de bloques asignados / 50).
--
-- Parámetros:
--   :ID_PERIODO (INTEGER) - ID del periodo (obligatorio)
--   :ID_SEDE    (INTEGER) - ID de la sede (obligatorio)
--   :ID_TURNO   (INTEGER) - ID del turno (obligatorio)
-- =============================================

SELECT
  g.ID_GRUPO,
  g.CODIGO_GRUPO,
  g.NOMBRE_GRUPO,
  g.ID_AULA,
  g.ID_TURNO,
  g.ID_PERIODO,
  au.ID_SEDE,
  (
    SELECT ROUND(COALESCE(SUM(hb.DURACION), 0) / 50.0, 2)
    FROM ASIGNACION_HORARIO ah
    INNER JOIN GRUPO_PLAN_CURSO gpc ON ah.ID_GRUPO_PLAN_CURSO = gpc.ID_GRUPO_PLAN_CURSO
    INNER JOIN HORARIO_BLOQUES hb ON ah.ID_HORARIO_BLOQUE = hb.ID_BLOQUE
    WHERE gpc.ID_GRUPO = g.ID_GRUPO
      AND gpc.ACTIVO = 1
  ) AS HORAS_PROGRAMADAS
FROM GRUPOS g
INNER JOIN AULAS au ON g.ID_AULA = au.ID_AULA
WHERE g.ID_PERIODO = :ID_PERIODO
  AND au.ID_SEDE = :ID_SEDE
  AND g.ID_TURNO = :ID_TURNO
  AND g.ACTIVO = 1
ORDER BY g.CODIGO_GRUPO, g.NOMBRE_GRUPO;
