-- ============================================
-- VIEW: VW_ASISTENCIAS_POSTULANTE
-- Asistencias con datos completos de postulante, sesión, curso y grupo
-- ============================================

DROP VIEW IF EXISTS "VW_ASISTENCIAS_POSTULANTE";

CREATE OR REPLACE VIEW "VW_ASISTENCIAS_POSTULANTE" AS
SELECT
    ap."ID_ASISTENCIA",
    ap."ASISTIO",

    -- Postulante
    ap."ID_POSTULANTE",
    TRIM(UPPER(es."NOMBRES"))   AS "NOMBRES",
    TRIM(UPPER(es."APELLIDOS")) AS "APELLIDOS",
    ca."NOMBRE_CARRERA",
    po."ALUMNO_LIBRE",
    po."ACTIVO" AS "POSTULANTE_ACTIVO",

    -- Sede / Periodo (desde postulante)
    se_sede."NOMBRE_SEDE",
    pe."NOMBRE_PERIODO",

    -- Sesión
    se."ID_SESION",
    se."FECHA",
    se."HORA_INICIO",
    se."HORA_FIN",
    se."DURACION_TOTAL_MINUTOS",
    se."ESTADO" AS "ESTADO_SESION",

    -- Curso / Clase
    cu."ID_CURSO",
    cu."CODIGO_CURSO",
    cu."NOMBRE_CURSO",
    cu."EJE_TEMATICO",

    -- Grupo
    gr."ID_GRUPO",
    gr."CODIGO_GRUPO",
    gr."NOMBRE_GRUPO"

FROM "ASISTENCIAS_POSTULANTE" ap
JOIN "POSTULANTES" po ON po."ID_POSTULANTE" = ap."ID_POSTULANTE"
JOIN "ESTUDIANTES" es ON es."ID_ESTUDIANTE" = po."ID_ESTUDIANTE"
LEFT JOIN "CARRERAS" ca ON ca."ID_CARRERA" = po."ID_CARRERA"
JOIN "SEDES" se_sede ON se_sede."ID_SEDE" = po."ID_SEDE"
JOIN "PERIODOS" pe ON pe."ID_PERIODO" = po."ID_PERIODO"
JOIN "SESIONES_AGRUPADAS" se ON se."ID_SESION" = ap."ID_SESION"
JOIN "GRUPO_PLAN_CURSO" gpc ON gpc."ID_GRUPO_PLAN_CURSO" = se."ID_GRUPO_PLAN_CURSO"
JOIN "PLAN_ACADEMICO_CURSOS" pac ON pac."ID_PLAN_ACADEMICO_CURSO" = gpc."ID_PLAN_ACADEMICO_CURSO"
JOIN "CURSOS" cu ON cu."ID_CURSO" = pac."ID_CURSO"
JOIN "GRUPOS" gr ON gr."ID_GRUPO" = gpc."ID_GRUPO" AND gr."ACTIVO" = TRUE;
