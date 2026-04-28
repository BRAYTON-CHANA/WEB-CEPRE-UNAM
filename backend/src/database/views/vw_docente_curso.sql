-- =============================================
-- VISTA: VW_DOCENTE_CURSO
-- Muestra SOLO las asignaciones existentes DOCENTE-CURSO
-- Incluye datos completos del docente, curso y asignación
-- =============================================

CREATE VIEW IF NOT EXISTS VW_DOCENTE_CURSO AS
SELECT 
  dc.ID_DOCENTE_CURSO,
  dc.ACTIVO AS ACTIVO_ASIGNACION,
  
  -- Datos del Docente
  d.ID_DOCENTE,
  d.DNI,
  d.APELLIDOS,
  d.NOMBRES,
  d.APELLIDOS || ', ' || d.NOMBRES AS NOMBRE_COMPLETO_DOCENTE,
  d.TIPO_DOCENTE,
  d.ACTIVO AS ACTIVO_DOCENTE,
  
  -- Datos del Curso
  c.ID_CURSO,
  c.CODIGO_COMPARTIDO,
  c.NOMBRE_CURSO,
  c.EJE_TEMATICO,
  c.ACTIVO AS ACTIVO_CURSO

FROM DOCENTE_CURSO dc
INNER JOIN DOCENTES d ON dc.ID_DOCENTE = d.ID_DOCENTE
INNER JOIN CURSOS c ON dc.ID_CURSO = c.ID_CURSO;
