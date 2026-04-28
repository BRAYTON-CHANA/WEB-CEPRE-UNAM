-- =============================================
-- FUNCTION: fn_planes_disponibles
-- Devuelve planes académicos disponibles para un período y área específicos
--
-- Parámetros:
--   :ID_PERIODO (INTEGER) - ID del período (obligatorio)
--   :ID_AREA (INTEGER) - ID del área (obligatorio)
--   :ID_PLAN_ACTUAL (INTEGER/NULL) - Plan actual (opcional, para modo edición)
--
-- Uso:
--   Modo Creación: ID_PLAN_ACTUAL = NULL → solo planes disponibles para el período y área
--   Modo Edición: ID_PLAN_ACTUAL = valor → incluir el plan actual aunque ya esté asignado
-- =============================================

SELECT 
  pa.ID_PLAN,
  pa.ID_PERIODO,
  pa.ID_AREA,
  pa.DESCRIPCION,
  pa.ACTIVO,
  
  -- Datos del Período
  p.CODIGO_PERIODO,
  p.FECHA_INICIO,
  p.FECHA_FIN,
  p.ESTADO,
  
  -- Datos del Área
  a.NOMBRE_AREA,
  
  CASE 
    WHEN pa.ID_PLAN = :ID_PLAN_ACTUAL THEN 'ACTUAL'
    ELSE 'DISPONIBLE'
  END AS ESTADO_PLAN
  
FROM PLAN_ACADEMICO pa
INNER JOIN PERIODOS p ON pa.ID_PERIODO = p.ID_PERIODO
INNER JOIN AREAS a ON pa.ID_AREA = a.ID_AREA
WHERE pa.ID_PERIODO = :ID_PERIODO
AND pa.ID_AREA = :ID_AREA
AND (
  -- Incluir el plan actual si está definido (modo edición)
  pa.ID_PLAN = :ID_PLAN_ACTUAL
  OR
  -- O incluir planes activos que no son el actual
  pa.ACTIVO = 1
)
ORDER BY 
  CASE 
    WHEN pa.ID_PLAN = :ID_PLAN_ACTUAL THEN 0 
    ELSE 1 
  END,
  p.CODIGO_PERIODO,
  a.NOMBRE_AREA;
