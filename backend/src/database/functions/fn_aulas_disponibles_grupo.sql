-- =============================================
-- FUNCTION: fn_aulas_disponibles_grupo
-- Devuelve aulas disponibles para una combinación de
-- período, área y turno, respetando la restricción única de GRUPOS
--
-- Parámetros:
--   :ID_PERIODO (INTEGER) - ID del período (requerido)
--   :ID_AREA (INTEGER) - ID del área (requerido)
--   :ID_TURNO (INTEGER) - ID del turno (requerido)
--   :ID_AULA_ACTUAL (INTEGER/NULL) - Aula actual a validar (opcional)
--
-- Uso:
--   Modo Creación: ID_AULA_ACTUAL = NULL → solo aulas disponibles
--   Modo Edición: ID_AULA_ACTUAL = valor → aula actual + disponibles
--                 (solo si existe en GRUPOS para esa combinación)
--
-- Lógica:
--   - La combinación (PERIODO, AREA, TURNO, AULA) debe ser única en GRUPOS
--   - Un aula puede repetirse si cambia al menos uno de los otros 3 campos
-- =============================================

SELECT 
  a.ID_AULA,
  a.NOMBRE_AULA,
  a.UBICACION,
  a.TIPO,
  a.CAPACIDAD,
  s.ID_SEDE,
  s.NOMBRE_SEDE,
  CASE 
    WHEN a.ID_AULA = :ID_AULA_ACTUAL 
         AND EXISTS (
           SELECT 1 FROM GRUPOS g 
           WHERE g.ID_PERIODO = :ID_PERIODO 
           AND g.ID_AREA = :ID_AREA
           AND g.ID_TURNO = :ID_TURNO
           AND g.ID_AULA = :ID_AULA_ACTUAL
         ) THEN 'ACTUAL'
    ELSE 'DISPONIBLE'
  END AS ESTADO_AULA
FROM AULAS a
INNER JOIN SEDES s ON a.ID_SEDE = s.ID_SEDE
WHERE a.ACTIVO = 1
AND (
  -- Incluir aula actual SOLO si está asignada en esta combinación
  (
    a.ID_AULA = :ID_AULA_ACTUAL
    AND EXISTS (
      SELECT 1 FROM GRUPOS g2
      WHERE g2.ID_PERIODO = :ID_PERIODO
      AND g2.ID_AREA = :ID_AREA
      AND g2.ID_TURNO = :ID_TURNO
      AND g2.ID_AULA = :ID_AULA_ACTUAL
    )
  )
  OR
  -- O incluir aulas NO usadas en esta combinación específica
  NOT EXISTS (
    SELECT 1 
    FROM GRUPOS g3
    WHERE g3.ID_PERIODO = :ID_PERIODO
    AND g3.ID_AREA = :ID_AREA
    AND g3.ID_TURNO = :ID_TURNO
    AND g3.ID_AULA = a.ID_AULA
  )
)
ORDER BY 
  CASE 
    WHEN a.ID_AULA = :ID_AULA_ACTUAL 
         AND EXISTS (SELECT 1 FROM GRUPOS g4 WHERE g4.ID_PERIODO = :ID_PERIODO AND g4.ID_AREA = :ID_AREA AND g4.ID_TURNO = :ID_TURNO AND g4.ID_AULA = :ID_AULA_ACTUAL)
    THEN 0 ELSE 1 
  END,
  a.NOMBRE_AULA;
