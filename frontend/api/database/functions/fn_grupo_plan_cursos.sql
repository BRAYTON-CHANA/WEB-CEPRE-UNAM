-- =============================================
-- FUNCTION: fn_grupo_plan_cursos
-- Devuelve todos los cursos de plan académico asignados a un grupo específico
--
-- Parámetros:
--   :ID_GRUPO (INTEGER) - ID del grupo (obligatorio)
--
-- Uso:
--   Retorna todos los GRUPO_PLAN_CURSO activos para el grupo,
--   incluyendo datos del curso y del docente asignado (si existe)
-- =============================================

SELECT 
  gpc.ID_GRUPO_PLAN_CURSO,
  gpc.ID_GRUPO,
  gpc.ID_PLAN_ACADEMICO_CURSO,
  gpc.ID_DOCENTE_PERIODO,
  gpc.ACTIVO AS ACTIVO_GRUPO_PLAN_CURSO,
  
  -- Datos de PLAN_ACADEMICO_CURSOS
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
  
  -- Datos del DOCENTE_PERIODO (LEFT JOIN, puede ser NULL)
  dper.IDENTIFICADOR_DOCENTE,
  dper.PAGO_POR_HORA,
  
  -- Datos del DOCENTE (LEFT JOIN, puede ser NULL)
  d.ID_DOCENTE,
  COALESCE(d.DNI, 'No asignado') AS DNI,
  COALESCE(d.APELLIDOS, 'No asignado') AS APELLIDOS,
  COALESCE(d.NOMBRES, 'No asignado') AS NOMBRES,
  d.EMAIL,
  COALESCE(d.APELLIDOS || ', ' || d.NOMBRES, 'No asignado') AS NOMBRE_COMPLETO_DOCENTE
  
FROM GRUPO_PLAN_CURSO gpc
INNER JOIN GRUPOS g ON gpc.ID_GRUPO = g.ID_GRUPO
INNER JOIN PLAN_ACADEMICO_CURSOS pac ON gpc.ID_PLAN_ACADEMICO_CURSO = pac.ID_PLAN_ACADEMICO_CURSO
INNER JOIN CURSO_AREA ca ON pac.ID_CURSO_AREA = ca.ID_CURSO_AREA
INNER JOIN CURSOS c ON ca.ID_CURSO = c.ID_CURSO
INNER JOIN AREAS a ON ca.ID_AREA = a.ID_AREA
LEFT JOIN DOCENTE_PERIODO dper ON gpc.ID_DOCENTE_PERIODO = dper.ID_DOCENTE_PERIODO
LEFT JOIN DOCENTES d ON dper.ID_DOCENTE = d.ID_DOCENTE
WHERE gpc.ID_GRUPO = :ID_GRUPO
AND gpc.ACTIVO = 1
AND pac.ACTIVO = 1
AND ca.ACTIVO = 1
AND c.ACTIVO = 1
AND a.ACTIVO = 1
ORDER BY 
  a.NOMBRE_AREA,
  c.NOMBRE_CURSO;
