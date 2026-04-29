-- =============================================
-- FUNCTION: fn_estadisticas_cursos_grupo
-- Devuelve estadísticas de cursos para un grupo:
-- - Horas académicas totales del plan
-- - Horas asignadas en el horario
-- - Estado (completo, incompleto, excedido)
--
-- Parámetros:
--   :ID_GRUPO (INTEGER) - ID del grupo (obligatorio)
-- =============================================

SELECT
  pac.ID_PLAN_ACADEMICO_CURSO,
  c.ID_CURSO,
  c.CODIGO_COMPARTIDO,
  c.NOMBRE_CURSO,
  pac.HORAS_ACADEMICAS_TOTALES AS HORAS_PLAN,
  COALESCE(
    (
      SELECT SUM(ah.DURACION) / 50.0
      FROM VW_ASIGNACION_HORARIO ah
      INNER JOIN GRUPO_PLAN_CURSO gpc ON ah.ID_GRUPO_PLAN_CURSO = gpc.ID_GRUPO_PLAN_CURSO
      WHERE gpc.ID_GRUPO = :ID_GRUPO
        AND gpc.ID_PLAN_ACADEMICO_CURSO = pac.ID_PLAN_ACADEMICO_CURSO
    ),
    0
  ) AS HORAS_ASIGNADAS,
  CASE
    WHEN COALESCE(
      (
        SELECT SUM(ah.DURACION) / 50.0
        FROM VW_ASIGNACION_HORARIO ah
        INNER JOIN GRUPO_PLAN_CURSO gpc ON ah.ID_GRUPO_PLAN_CURSO = gpc.ID_GRUPO_PLAN_CURSO
        WHERE gpc.ID_GRUPO = :ID_GRUPO
          AND gpc.ID_PLAN_ACADEMICO_CURSO = pac.ID_PLAN_ACADEMICO_CURSO
      ),
      0
    ) = pac.HORAS_ACADEMICAS_TOTALES THEN 'COMPLETO'
    WHEN COALESCE(
      (
        SELECT SUM(ah.DURACION) / 50.0
        FROM VW_ASIGNACION_HORARIO ah
        INNER JOIN GRUPO_PLAN_CURSO gpc ON ah.ID_GRUPO_PLAN_CURSO = gpc.ID_GRUPO_PLAN_CURSO
        WHERE gpc.ID_GRUPO = :ID_GRUPO
          AND gpc.ID_PLAN_ACADEMICO_CURSO = pac.ID_PLAN_ACADEMICO_CURSO
      ),
      0
    ) > pac.HORAS_ACADEMICAS_TOTALES THEN 'EXCEDIDO'
    ELSE 'INCOMPLETO'
  END AS ESTADO
FROM GRUPOS g
INNER JOIN PLAN_ACADEMICO_CURSOS pac ON g.ID_PLAN = pac.ID_PLAN_ACADEMICO
INNER JOIN CURSO_AREA ca ON pac.ID_CURSO_AREA = ca.ID_CURSO_AREA
INNER JOIN CURSOS c ON ca.ID_CURSO = c.ID_CURSO
WHERE g.ID_GRUPO = :ID_GRUPO
AND pac.ACTIVO = 1
ORDER BY c.CODIGO_COMPARTIDO;
