-- =============================================
-- FUNCTION: fn_cursos_disponibles_area
-- Devuelve cursos disponibles para un área
-- con validación del curso actual en CURSO_AREA
--
-- Parámetros:
--   :ID_AREA (INTEGER) - ID del área (requerido)
--   :ID_CURSO_ACTUAL (INTEGER/NULL) - Curso actual a validar (opcional)
--
-- Uso:
--   Modo Creación: ID_CURSO_ACTUAL = NULL → solo cursos disponibles del área
--   Modo Edición: ID_CURSO_ACTUAL = valor → curso actual + disponibles del área
--                 (solo si existe en CURSO_AREA para ese área)
-- =============================================

SELECT 
  c.ID_CURSO,
  c.CODIGO_COMPARTIDO,
  c.NOMBRE_CURSO,
  c.EJE_TEMATICO,
  CASE 
    WHEN c.ID_CURSO = :ID_CURSO_ACTUAL 
         AND EXISTS (
           SELECT 1 FROM CURSO_AREA ca 
           WHERE ca.ID_AREA = :ID_AREA 
           AND ca.ID_CURSO = :ID_CURSO_ACTUAL
         ) THEN 'ACTUAL'
    ELSE 'DISPONIBLE'
  END AS ESTADO_CURSO
FROM CURSOS c
WHERE c.ACTIVO = 1
AND (
  -- Incluir el curso actual SOLO si está asignado a esta área
  (
    c.ID_CURSO = :ID_CURSO_ACTUAL
    AND EXISTS (
      SELECT 1 FROM CURSO_AREA ca2
      WHERE ca2.ID_AREA = :ID_AREA
      AND ca2.ID_CURSO = :ID_CURSO_ACTUAL
    )
  )
  OR
  -- O incluir cursos donde el área NO está asignada
  NOT EXISTS (
    SELECT 1 
    FROM CURSO_AREA ca3
    WHERE ca3.ID_CURSO = c.ID_CURSO 
    AND ca3.ID_AREA = :ID_AREA
  )
)
ORDER BY 
  CASE 
    WHEN c.ID_CURSO = :ID_CURSO_ACTUAL 
         AND EXISTS (SELECT 1 FROM CURSO_AREA ca4 WHERE ca4.ID_AREA = :ID_AREA AND ca4.ID_CURSO = :ID_CURSO_ACTUAL)
    THEN 0 ELSE 1 
  END,
  c.NOMBRE_CURSO;
