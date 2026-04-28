-- =============================================
-- FUNCTION: fn_docentes_disponibles_grupo_curso
-- Devuelve docentes disponibles para un grupo y curso-plan específicos
--
-- Parámetros:
--   :ID_GRUPO (INTEGER) - ID del grupo (obligatorio)
--   :ID_PLAN_ACADEMICO_CURSO (INTEGER) - ID del curso-plan (obligatorio)
--   :ID_DOCENTE_PERIODO_ACTUAL (INTEGER/NULL) - Docente-período actual (opcional, para modo edición)
--
-- Uso:
--   Modo Creación: ID_DOCENTE_PERIODO_ACTUAL = NULL → solo docentes del período con ese curso y sede
--   Modo Edición: ID_DOCENTE_PERIODO_ACTUAL = valor → incluir el actual aunque ya esté asignado
-- =============================================

SELECT
  dp.ID_DOCENTE_PERIODO,
  dp.IDENTIFICADOR_DOCENTE,
  dp.PAGO_POR_HORA,
  dp.ACTIVO AS ACTIVO_DOCENTE_PERIODO,

  -- Datos del Docente
  d.ID_DOCENTE,
  COALESCE(d.DNI, 'No asignado') AS DNI,
  COALESCE(d.APELLIDOS, 'No asignado') AS APELLIDOS,
  COALESCE(d.NOMBRES, 'No asignado') AS NOMBRES,
  d.EMAIL,
  COALESCE(d.APELLIDOS || ', ' || d.NOMBRES, 'Docente No Asignado') AS NOMBRE_COMPLETO_DOCENTE,

  -- Datos del Período
  p.ID_PERIODO,
  p.CODIGO_PERIODO,

  CASE
    WHEN dp.ID_DOCENTE_PERIODO = :ID_DOCENTE_PERIODO_ACTUAL THEN 'ACTUAL'
    ELSE 'DISPONIBLE'
  END AS ESTADO_DOCENTE

FROM GRUPOS g
INNER JOIN AULAS au ON g.ID_AULA = au.ID_AULA
INNER JOIN PLAN_ACADEMICO_CURSOS pac ON g.ID_PLAN = pac.ID_PLAN_ACADEMICO
INNER JOIN CURSO_AREA ca ON pac.ID_CURSO_AREA = ca.ID_CURSO_AREA
INNER JOIN CURSOS c ON ca.ID_CURSO = c.ID_CURSO
INNER JOIN DOCENTE_PERIODO dp ON dp.ID_PERIODO = g.ID_PERIODO
  AND dp.ID_CURSO = c.ID_CURSO
  AND dp.ID_SEDE = au.ID_SEDE
LEFT JOIN DOCENTES d ON dp.ID_DOCENTE = d.ID_DOCENTE
INNER JOIN PERIODOS p ON dp.ID_PERIODO = p.ID_PERIODO
WHERE g.ID_GRUPO = :ID_GRUPO
AND pac.ID_PLAN_ACADEMICO_CURSO = :ID_PLAN_ACADEMICO_CURSO
AND dp.ACTIVO = 1
AND (d.ACTIVO = 1 OR d.ACTIVO IS NULL)
AND p.ACTIVO = 1
AND (
  -- Incluir el docente-período actual si está definido (modo edición)
  dp.ID_DOCENTE_PERIODO = :ID_DOCENTE_PERIODO_ACTUAL
  OR
  -- O incluir docentes activos que no son el actual
  dp.ID_DOCENTE_PERIODO != :ID_DOCENTE_PERIODO_ACTUAL
  OR :ID_DOCENTE_PERIODO_ACTUAL IS NULL
)
ORDER BY
  CASE
    WHEN dp.ID_DOCENTE_PERIODO = :ID_DOCENTE_PERIODO_ACTUAL THEN 0
    ELSE 1
  END,
  COALESCE(d.APELLIDOS, 'No asignado'),
  COALESCE(d.NOMBRES, 'No asignado');
