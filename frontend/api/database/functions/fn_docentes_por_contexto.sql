-- =============================================
-- FUNCTION: fn_docentes_por_contexto
-- Devuelve los docentes_periodo que tienen al menos un GRUPO_PLAN_CURSO en un grupo
-- que cumple el contexto (periodo + sede + turno). Incluye conteo de cursos y grupos en ese contexto.
--
-- Parámetros:
--   :ID_PERIODO (INTEGER) - ID del periodo (obligatorio)
--   :ID_SEDE    (INTEGER) - ID de la sede (obligatorio)
--   :ID_TURNO   (INTEGER) - ID del turno (obligatorio)
-- =============================================

SELECT DISTINCT
  dper.ID_DOCENTE_PERIODO,
  dper.IDENTIFICADOR_DOCENTE,
  d.ID_DOCENTE,
  COALESCE(d.DNI, 'DNI No asignado') AS DNI,
  COALESCE(d.APELLIDOS, 'Apellidos No asignado') AS APELLIDOS,
  COALESCE(d.NOMBRES, 'Nombres No asignado') AS NOMBRES,
  COALESCE(d.APELLIDOS || ', ' || d.NOMBRES, 'Docente no Asignado') AS NOMBRE_COMPLETO_DOCENTE,
  (
    SELECT COUNT(DISTINCT ca2.ID_CURSO)
    FROM GRUPO_PLAN_CURSO gpc2
    INNER JOIN PLAN_ACADEMICO_CURSOS pac2 ON gpc2.ID_PLAN_ACADEMICO_CURSO = pac2.ID_PLAN_ACADEMICO_CURSO
    INNER JOIN CURSO_AREA ca2 ON pac2.ID_CURSO_AREA = ca2.ID_CURSO_AREA
    INNER JOIN GRUPOS g2 ON gpc2.ID_GRUPO = g2.ID_GRUPO
    INNER JOIN AULAS au2 ON g2.ID_AULA = au2.ID_AULA
    WHERE gpc2.ID_DOCENTE_PERIODO = dper.ID_DOCENTE_PERIODO
      AND g2.ID_PERIODO = :ID_PERIODO
      AND au2.ID_SEDE = :ID_SEDE
      AND g2.ID_TURNO = :ID_TURNO
      AND gpc2.ACTIVO = 1
      AND g2.ACTIVO = 1
  ) AS CURSOS_DIFERENTES,
  (
    SELECT COUNT(*)
    FROM GRUPO_PLAN_CURSO gpc2
    INNER JOIN GRUPOS g2 ON gpc2.ID_GRUPO = g2.ID_GRUPO
    INNER JOIN AULAS au2 ON g2.ID_AULA = au2.ID_AULA
    WHERE gpc2.ID_DOCENTE_PERIODO = dper.ID_DOCENTE_PERIODO
      AND g2.ID_PERIODO = :ID_PERIODO
      AND au2.ID_SEDE = :ID_SEDE
      AND g2.ID_TURNO = :ID_TURNO
      AND gpc2.ACTIVO = 1
      AND g2.ACTIVO = 1
  ) AS GRUPOS_ASIGNADOS
FROM DOCENTE_PERIODO dper
LEFT JOIN DOCENTES d ON dper.ID_DOCENTE = d.ID_DOCENTE
INNER JOIN GRUPO_PLAN_CURSO gpc ON dper.ID_DOCENTE_PERIODO = gpc.ID_DOCENTE_PERIODO
INNER JOIN GRUPOS g ON gpc.ID_GRUPO = g.ID_GRUPO
INNER JOIN AULAS au ON g.ID_AULA = au.ID_AULA
WHERE dper.ID_PERIODO = :ID_PERIODO
  AND au.ID_SEDE = :ID_SEDE
  AND g.ID_TURNO = :ID_TURNO
  AND gpc.ACTIVO = 1
  AND g.ACTIVO = 1
  AND (d.ACTIVO = 1 OR d.ACTIVO IS NULL)
  AND dper.ACTIVO = 1
ORDER BY COALESCE(d.APELLIDOS, 'No asignado'), COALESCE(d.NOMBRES, 'No asignado');
