-- =============================================
-- VISTA: VW_DOCENTE_PERIODO
-- Muestra asignaciones de docentes a períodos con datos completos
-- =============================================

CREATE VIEW IF NOT EXISTS VW_DOCENTE_PERIODO AS
SELECT
  dp.ID_DOCENTE_PERIODO,
  dp.IDENTIFICADOR_DOCENTE,
  dp.PAGO_POR_HORA,
  dp.ACTIVO,

  -- Datos del Período
  p.ID_PERIODO,
  p.CODIGO_PERIODO,
  p.FECHA_INICIO AS FECHA_INICIO_PERIODO,
  p.FECHA_FIN AS FECHA_FIN_PERIODO,
  p.ESTADO AS ESTADO_PERIODO,

  -- Datos de la Sede
  dp.ID_SEDE,
  s.NOMBRE_SEDE,

  -- Datos del Curso
  dp.ID_CURSO,
  c.CODIGO_COMPARTIDO,
  c.NOMBRE_CURSO,
  c.EJE_TEMATICO,

  -- Datos del Docente
  d.ID_DOCENTE,
  COALESCE(d.DNI, 'No asignado') AS DNI,
  COALESCE(d.APELLIDOS, 'No asignado') AS APELLIDOS,
  COALESCE(d.NOMBRES, 'No asignado') AS NOMBRES,
  d.TELEFONO,
  d.EMAIL,
  -- Nombre completo del docente
  COALESCE(d.APELLIDOS || ', ' || d.NOMBRES, 'Docente No asignado') AS NOMBRE_COMPLETO_DOCENTE

FROM DOCENTE_PERIODO dp
INNER JOIN PERIODOS p ON dp.ID_PERIODO = p.ID_PERIODO
INNER JOIN SEDES s ON dp.ID_SEDE = s.ID_SEDE
INNER JOIN CURSOS c ON dp.ID_CURSO = c.ID_CURSO
LEFT JOIN DOCENTES d ON dp.ID_DOCENTE = d.ID_DOCENTE;
