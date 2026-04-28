-- =============================================
-- FUNCTION: fn_sedes_con_docentes_asignados
-- Devuelve las sedes que tienen al menos un grupo en el periodo dado
-- (no depende de si hay docentes asignados)
--
-- Parámetros:
--   :ID_PERIODO (INTEGER) - ID del periodo (obligatorio)
-- =============================================

SELECT DISTINCT
  s.ID_SEDE,
  s.NOMBRE_SEDE,
  (
    SELECT COUNT(DISTINCT g2.ID_GRUPO)
    FROM GRUPOS g2
    INNER JOIN AULAS au2 ON g2.ID_AULA = au2.ID_AULA
    WHERE au2.ID_SEDE = s.ID_SEDE
      AND g2.ID_PERIODO = :ID_PERIODO
      AND g2.ACTIVO = 1
  ) AS TOTAL_GRUPOS
FROM SEDES s
INNER JOIN AULAS au ON s.ID_SEDE = au.ID_SEDE
INNER JOIN GRUPOS g ON au.ID_AULA = g.ID_AULA
WHERE g.ID_PERIODO = :ID_PERIODO
  AND g.ACTIVO = 1
ORDER BY s.NOMBRE_SEDE;
