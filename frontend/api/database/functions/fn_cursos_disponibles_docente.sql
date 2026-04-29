-- =============================================
-- FUNCTION: fn_cursos_disponibles_docente
-- Devuelve cursos disponibles para un docente
-- con validación del curso actual en DOCENTE_CURSO
--
-- Parámetros:
--   :ID_DOCENTE (INTEGER) - ID del docente (requerido)
--   :ID_CURSO_ACTUAL (INTEGER/NULL) - Curso actual a validar (opcional)
--
-- Uso:
--   Modo Creación: ID_CURSO_ACTUAL = NULL → solo cursos disponibles
--   Modo Edición: ID_CURSO_ACTUAL = valor → curso actual + disponibles
--                 (solo si existe en DOCENTE_CURSO para ese docente)
-- =============================================

SELECT 
  c.ID_CURSO,
  c.CODIGO_COMPARTIDO,
  c.NOMBRE_CURSO,
  c.EJE_TEMATICO,
  CASE 
    WHEN c.ID_CURSO = :ID_CURSO_ACTUAL 
         AND EXISTS (
           SELECT 1 FROM DOCENTE_CURSO dc 
           WHERE dc.ID_DOCENTE = :ID_DOCENTE 
           AND dc.ID_CURSO = :ID_CURSO_ACTUAL
         ) THEN 'ACTUAL'
    ELSE 'DISPONIBLE'
  END AS ESTADO_CURSO
FROM CURSOS c
WHERE c.ACTIVO = 1
AND (
  -- Incluir el curso actual SOLO si está asignado a este docente
  (
    c.ID_CURSO = :ID_CURSO_ACTUAL
    AND EXISTS (
      SELECT 1 FROM DOCENTE_CURSO dc2
      WHERE dc2.ID_DOCENTE = :ID_DOCENTE
      AND dc2.ID_CURSO = :ID_CURSO_ACTUAL
    )
  )
  OR
  -- O incluir cursos donde el docente NO está asignado
  NOT EXISTS (
    SELECT 1 
    FROM DOCENTE_CURSO dc3
    WHERE dc3.ID_CURSO = c.ID_CURSO 
    AND dc3.ID_DOCENTE = :ID_DOCENTE
  )
)
ORDER BY 
  CASE 
    WHEN c.ID_CURSO = :ID_CURSO_ACTUAL 
         AND EXISTS (SELECT 1 FROM DOCENTE_CURSO dc4 WHERE dc4.ID_DOCENTE = :ID_DOCENTE AND dc4.ID_CURSO = :ID_CURSO_ACTUAL)
    THEN 0 ELSE 1 
  END,
  c.NOMBRE_CURSO;
