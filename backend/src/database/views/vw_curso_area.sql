-- =============================================
-- VISTA: VW_CURSO_AREA
-- Muestra SOLO las asignaciones existentes CURSO-ÁREA
-- Incluye datos completos del curso, área y asignación
-- =============================================

CREATE VIEW IF NOT EXISTS VW_CURSO_AREA AS
SELECT 
  ca.ID_CURSO_AREA,
  ca.CODIGO_UNICO,
  ca.ACTIVO AS ACTIVO_ASIGNACION,
  
  -- Datos del Curso
  c.ID_CURSO,
  c.CODIGO_COMPARTIDO,
  c.NOMBRE_CURSO,
  c.EJE_TEMATICO,
  c.ACTIVO AS ACTIVO_CURSO,
  
  -- Datos del Área
  a.ID_AREA,
  a.NOMBRE_AREA,
  a.ACTIVO AS ACTIVO_AREA

FROM CURSO_AREA ca
INNER JOIN CURSOS c ON ca.ID_CURSO = c.ID_CURSO
INNER JOIN AREAS a ON ca.ID_AREA = a.ID_AREA;
