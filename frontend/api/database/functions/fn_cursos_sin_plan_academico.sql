-- =============================================
-- FUNCTION: fn_cursos_sin_plan_academico
-- Devuelve cursos-área disponibles para un plan académico específico
--
-- Parámetros:
--   :ID_PLAN (INTEGER) - ID del plan académico (obligatorio)
--   :ID_CURSO_AREA_ACTUAL (INTEGER/NULL) - Curso-área actual (opcional, para modo edición)
--
-- Uso:
--   Modo Creación: ID_CURSO_AREA_ACTUAL = NULL → solo cursos sin asignar al plan
--   Modo Edición: ID_CURSO_AREA_ACTUAL = valor → incluir el actual aunque ya esté en el plan
-- =============================================

SELECT 
  ca.ID_CURSO_AREA,
  ca.ID_CURSO,
  ca.ID_AREA,
  ca.CODIGO_UNICO,
  c.NOMBRE_CURSO,
  c.CODIGO_COMPARTIDO,
  c.EJE_TEMATICO,
  a.NOMBRE_AREA,
  CASE 
    WHEN ca.ID_CURSO_AREA = :ID_CURSO_AREA_ACTUAL 
         AND EXISTS (
           SELECT 1 FROM PLAN_ACADEMICO_CURSOS pac 
           WHERE pac.ID_PLAN_ACADEMICO = :ID_PLAN
           AND pac.ID_CURSO_AREA = :ID_CURSO_AREA_ACTUAL
         ) THEN 'YA_PLANIFICADO'
    ELSE 'SIN_PLAN'
  END AS ESTADO_PLAN
FROM CURSO_AREA ca
INNER JOIN CURSOS c ON ca.ID_CURSO = c.ID_CURSO
INNER JOIN AREAS a ON ca.ID_AREA = a.ID_AREA
INNER JOIN PLAN_ACADEMICO pa ON pa.ID_PLAN = :ID_PLAN
WHERE ca.ACTIVO = 1
AND c.ACTIVO = 1
AND a.ACTIVO = 1
-- Filtro por área del plan
AND ca.ID_AREA = pa.ID_AREA
AND (
  -- Incluir el curso-área actual si está definido (modo edición)
  ca.ID_CURSO_AREA = :ID_CURSO_AREA_ACTUAL
  OR
  -- O incluir cursos-área que NO están en este plan
  NOT EXISTS (
    SELECT 1 
    FROM PLAN_ACADEMICO_CURSOS pac
    WHERE pac.ID_PLAN_ACADEMICO = :ID_PLAN
    AND pac.ID_CURSO_AREA = ca.ID_CURSO_AREA
  )
)
ORDER BY 
  a.NOMBRE_AREA,
  c.NOMBRE_CURSO;
