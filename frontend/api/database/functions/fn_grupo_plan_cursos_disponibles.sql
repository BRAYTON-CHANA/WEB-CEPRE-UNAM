-- =============================================
-- FUNCTION: fn_grupo_plan_cursos_disponibles
-- Devuelve cursos de plan académico disponibles para un grupo específico
--
-- Parámetros:
--   :ID_GRUPO (INTEGER) - ID del grupo (obligatorio)
--   :ID_PLAN_ACADEMICO_CURSO_ACTUAL (INTEGER/NULL) - Curso-plan actual (opcional, para modo edición)
--
-- Uso:
--   Modo Creación: ID_PLAN_ACADEMICO_CURSO_ACTUAL = NULL → solo cursos del plan no asignados al grupo
--   Modo Edición: ID_PLAN_ACADEMICO_CURSO_ACTUAL = valor → incluir el actual aunque ya esté asignado
--
-- Nota:
--   Si el grupo no tiene plan asignado (ID_PLAN es NULL), la función no devuelve resultados
-- =============================================

SELECT 
  pac.ID_PLAN_ACADEMICO_CURSO,
  pac.ID_PLAN_ACADEMICO,
  pac.HORAS_ACADEMICAS_TOTALES,
  pac.ACTIVO AS ACTIVO_PLAN_ACADEMICO_CURSO,
  
  -- Datos de CURSO_AREA
  ca.ID_CURSO_AREA,
  ca.CODIGO_UNICO,
  
  -- Datos del CURSO
  c.ID_CURSO,
  c.CODIGO_COMPARTIDO,
  c.NOMBRE_CURSO,
  c.EJE_TEMATICO,
  
  -- Datos del Área
  a.ID_AREA,
  a.NOMBRE_AREA,
  
  CASE 
    WHEN pac.ID_PLAN_ACADEMICO_CURSO = :ID_PLAN_ACADEMICO_CURSO_ACTUAL 
         AND EXISTS (
           SELECT 1 FROM GRUPO_PLAN_CURSO gpc 
           WHERE gpc.ID_GRUPO = :ID_GRUPO
           AND gpc.ID_PLAN_ACADEMICO_CURSO = :ID_PLAN_ACADEMICO_CURSO_ACTUAL
         ) THEN 'ACTUAL'
    ELSE 'DISPONIBLE'
  END AS ESTADO_CURSO
  
FROM GRUPOS g
INNER JOIN PLAN_ACADEMICO_CURSOS pac ON g.ID_PLAN = pac.ID_PLAN_ACADEMICO
INNER JOIN CURSO_AREA ca ON pac.ID_CURSO_AREA = ca.ID_CURSO_AREA
INNER JOIN CURSOS c ON ca.ID_CURSO = c.ID_CURSO
INNER JOIN AREAS a ON ca.ID_AREA = a.ID_AREA
WHERE g.ID_GRUPO = :ID_GRUPO
AND g.ID_PLAN IS NOT NULL
AND pac.ACTIVO = 1
AND ca.ACTIVO = 1
AND c.ACTIVO = 1
AND a.ACTIVO = 1
AND (
  -- Incluir el curso-plan actual si está definido (modo edición)
  pac.ID_PLAN_ACADEMICO_CURSO = :ID_PLAN_ACADEMICO_CURSO_ACTUAL
  OR
  -- O incluir cursos-plan que NO están asignados a este grupo
  NOT EXISTS (
    SELECT 1 
    FROM GRUPO_PLAN_CURSO gpc
    WHERE gpc.ID_GRUPO = :ID_GRUPO
    AND gpc.ID_PLAN_ACADEMICO_CURSO = pac.ID_PLAN_ACADEMICO_CURSO
  )
)
ORDER BY 
  CASE 
    WHEN pac.ID_PLAN_ACADEMICO_CURSO = :ID_PLAN_ACADEMICO_CURSO_ACTUAL THEN 0 
    ELSE 1 
  END,
  a.NOMBRE_AREA,
  c.NOMBRE_CURSO;
