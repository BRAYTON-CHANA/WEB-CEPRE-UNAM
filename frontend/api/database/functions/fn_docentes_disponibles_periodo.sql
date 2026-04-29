-- =============================================
-- FUNCTION: fn_docentes_disponibles_periodo
-- Devuelve docentes disponibles para un período y curso específico
--
-- Parámetros:
--   :ID_PERIODO (INTEGER) - ID del período (obligatorio)
--   :ID_CURSO (INTEGER) - ID del curso (obligatorio)
--   :ID_DOCENTE_ACTUAL (INTEGER/NULL) - Docente actual (opcional, para modo edición)
--
-- Uso:
--   Modo Creación: ID_DOCENTE_ACTUAL = NULL → solo docentes no asignados al período/curso
--   Modo Edición: ID_DOCENTE_ACTUAL = valor → incluir el actual aunque ya esté asignado
-- =============================================

SELECT
  d.ID_DOCENTE,
  d.DNI,
  d.APELLIDOS,
  d.NOMBRES,
  d.EMAIL,

  CASE
    WHEN d.ID_DOCENTE = :ID_DOCENTE_ACTUAL THEN 'ACTUAL'
    ELSE 'DISPONIBLE'
  END AS ESTADO

FROM DOCENTES d
INNER JOIN DOCENTE_CURSO dc ON d.ID_DOCENTE = dc.ID_DOCENTE AND dc.ID_CURSO = :ID_CURSO AND dc.ACTIVO = 1
LEFT JOIN DOCENTE_PERIODO dper ON d.ID_DOCENTE = dper.ID_DOCENTE
  AND dper.ID_PERIODO = :ID_PERIODO
  AND dper.ID_CURSO = :ID_CURSO
WHERE d.ACTIVO = 1
AND (
  -- Incluir el docente actual si está definido (modo edición)
  d.ID_DOCENTE = :ID_DOCENTE_ACTUAL
  OR
  -- O incluir docentes que NO están asignados a este período con este curso
  dper.ID_DOCENTE_PERIODO IS NULL
)
ORDER BY
  CASE
    WHEN d.ID_DOCENTE = :ID_DOCENTE_ACTUAL THEN 0
    ELSE 1
  END,
  d.APELLIDOS,
  d.NOMBRES;
