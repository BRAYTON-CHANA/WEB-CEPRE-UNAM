-- =============================================
-- FUNCTION: fn_docentes_disponibles_plan_curso
-- Devuelve docentes disponibles para un período y curso específicos
--
-- Parámetros:
--   :ID_PERIODO (INTEGER) - ID del período (obligatorio)
--   :ID_CURSO (INTEGER) - ID del curso (obligatorio)
--   :ID_DOCENTE_PERIODO_ACTUAL (INTEGER/NULL) - Docente-período actual (opcional, para modo edición)
--
-- Uso:
--   Modo Creación: ID_DOCENTE_PERIODO_ACTUAL = NULL → solo docentes del período con ese curso
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
  COALESCE(d.APELLIDOS || ', ' || d.NOMBRES, 'No asignado') AS NOMBRE_COMPLETO_DOCENTE,

  -- Datos del Período
  p.ID_PERIODO,
  p.CODIGO_PERIODO,

  CASE
    WHEN dp.ID_DOCENTE_PERIODO = :ID_DOCENTE_PERIODO_ACTUAL THEN 'ACTUAL'
    ELSE 'DISPONIBLE'
  END AS ESTADO_DOCENTE

FROM DOCENTE_PERIODO dp
LEFT JOIN DOCENTES d ON dp.ID_DOCENTE = d.ID_DOCENTE
INNER JOIN PERIODOS p ON dp.ID_PERIODO = p.ID_PERIODO
LEFT JOIN DOCENTE_CURSO dc ON d.ID_DOCENTE = dc.ID_DOCENTE
WHERE dp.ID_PERIODO = :ID_PERIODO
AND (dc.ID_CURSO = :ID_CURSO OR dc.ID_CURSO IS NULL)
AND dp.ACTIVO = 1
AND (d.ACTIVO = 1 OR d.ACTIVO IS NULL)
AND (dc.ACTIVO = 1 OR dc.ACTIVO IS NULL)
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
