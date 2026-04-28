-- =============================================
-- FUNCTION: fn_turnos_con_docentes_asignados
-- Devuelve los turnos con grupos en el periodo y sede dados
-- (no depende de si hay docentes asignados)
--
-- Parámetros:
--   :ID_PERIODO (INTEGER) - ID del periodo (obligatorio)
--   :ID_SEDE    (INTEGER) - ID de la sede (obligatorio)
-- =============================================

SELECT DISTINCT
  t.ID_TURNO,
  t.NOMBRE_TURNO,
  t.DESCRIPCION,
  t.ID_HORARIO,
  (
    SELECT COUNT(DISTINCT g2.ID_GRUPO)
    FROM GRUPOS g2
    INNER JOIN AULAS au2 ON g2.ID_AULA = au2.ID_AULA
    WHERE g2.ID_TURNO = t.ID_TURNO
      AND g2.ID_PERIODO = :ID_PERIODO
      AND au2.ID_SEDE = :ID_SEDE
      AND g2.ACTIVO = 1
  ) AS TOTAL_GRUPOS
FROM TURNOS t
INNER JOIN GRUPOS g ON t.ID_TURNO = g.ID_TURNO
INNER JOIN AULAS au ON g.ID_AULA = au.ID_AULA
WHERE g.ID_PERIODO = :ID_PERIODO
  AND au.ID_SEDE = :ID_SEDE
  AND g.ACTIVO = 1
ORDER BY t.NOMBRE_TURNO;
