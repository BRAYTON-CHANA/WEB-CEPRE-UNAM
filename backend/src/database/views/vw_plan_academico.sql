-- =============================================
-- VISTA: VW_PLAN_ACADEMICO
-- Muestra cabecera de planes académicos (período + área)
-- =============================================

CREATE VIEW IF NOT EXISTS VW_PLAN_ACADEMICO AS
SELECT 
  pa.ID_PLAN,
  pa.ACTIVO AS ACTIVO_PLAN,
  pa.DESCRIPCION,
  -- Datos del Período
  p.ID_PERIODO,
  p.CODIGO_PERIODO,
  p.FECHA_INICIO AS FECHA_INICIO_PERIODO,
  p.FECHA_FIN AS FECHA_FIN_PERIODO,
  p.ESTADO AS ESTADO_PERIODO,
  p.ACTIVO AS ACTIVO_PERIODO,
  
  -- Datos del Área
  a.ID_AREA,
  a.NOMBRE_AREA,
  a.ACTIVO AS ACTIVO_AREA,
  
  -- Total de horas académicas del plan
  (SELECT COALESCE(SUM(pac.HORAS_ACADEMICAS_TOTALES), 0)
   FROM PLAN_ACADEMICO_CURSOS pac
   WHERE pac.ID_PLAN_ACADEMICO = pa.ID_PLAN
   AND pac.ACTIVO = 1) AS TOTAL_HORAS_ACADEMICAS

FROM PLAN_ACADEMICO pa
INNER JOIN PERIODOS p ON pa.ID_PERIODO = p.ID_PERIODO
INNER JOIN AREAS a ON pa.ID_AREA = a.ID_AREA;
