-- =============================================
-- VISTA: VW_AULAS_SEDES
-- Muestra aulas con datos de la sede asociada
-- =============================================

CREATE VIEW IF NOT EXISTS VW_AULAS_SEDES AS
SELECT 
  a.ID_AULA,
  a.NOMBRE_AULA,
  a.UBICACION,
  a.TIPO,
  a.ENLACE_VIRTUAL,
  a.CAPACIDAD,
  a.ACTIVO AS ACTIVO_AULA,
  
  s.ID_SEDE,
  s.NOMBRE_SEDE,
  s.ACTIVO AS ACTIVO_SEDE

FROM AULAS a
INNER JOIN SEDES s ON a.ID_SEDE = s.ID_SEDE;
