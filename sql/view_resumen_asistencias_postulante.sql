-- ============================================
-- VIEW: VW_RESUMEN_ASISTENCIAS_POSTULANTE
-- Una fila por postulante × grupo con conteos pre-calculados
-- ============================================

DROP VIEW IF EXISTS "VW_RESUMEN_ASISTENCIAS_POSTULANTE";

CREATE OR REPLACE VIEW "VW_RESUMEN_ASISTENCIAS_POSTULANTE" AS
SELECT
    po."ID_POSTULANTE",
    TRIM(UPPER(es."NOMBRES"))    AS "NOMBRES",
    TRIM(UPPER(es."APELLIDOS"))  AS "APELLIDOS",
    ca."NOMBRE_CARRERA",
    po."ALUMNO_LIBRE",
    po."ACTIVO"                  AS "POSTULANTE_ACTIVO",

    gr."ID_GRUPO",
    gr."CODIGO_GRUPO",
    gr."NOMBRE_GRUPO",
    gr."ID_SEDE",
    se."NOMBRE_SEDE",
    gr."ID_PERIODO",
    pe."NOMBRE_PERIODO",

    COUNT(ap."ID_ASISTENCIA")                                                                   AS "TOTAL_SESIONES",
    COUNT(ap."ID_ASISTENCIA") FILTER (WHERE ap."ESTADO_ASISTENCIA" = 'ASISTIO')                 AS "TOTAL_ASISTIO",
    COUNT(ap."ID_ASISTENCIA") FILTER (WHERE ap."ESTADO_ASISTENCIA" = 'TARDANZA')                AS "TOTAL_TARDANZA",
    COUNT(ap."ID_ASISTENCIA") FILTER (WHERE ap."ESTADO_ASISTENCIA" = 'FALTA')                   AS "TOTAL_FALTA",
    COUNT(ap."ID_ASISTENCIA") FILTER (WHERE ap."ESTADO_ASISTENCIA" IS NULL)                     AS "TOTAL_SIN_MARCAR",

    CASE
        WHEN COUNT(ap."ID_ASISTENCIA") = 0 THEN NULL
        ELSE ROUND(
            (
                COUNT(ap."ID_ASISTENCIA") FILTER (WHERE ap."ESTADO_ASISTENCIA" = 'ASISTIO')
                + COUNT(ap."ID_ASISTENCIA") FILTER (WHERE ap."ESTADO_ASISTENCIA" = 'TARDANZA')
                - FLOOR(
                    COUNT(ap."ID_ASISTENCIA") FILTER (WHERE ap."ESTADO_ASISTENCIA" = 'TARDANZA')
                    ::NUMERIC / 3
                  )
            )::NUMERIC / COUNT(ap."ID_ASISTENCIA") * 100
        )
    END AS "PORCENTAJE_ASISTENCIA"

FROM "POSTULANTES" po
JOIN "ESTUDIANTES" es   ON es."ID_ESTUDIANTE" = po."ID_ESTUDIANTE"
LEFT JOIN "CARRERAS" ca ON ca."ID_CARRERA"    = po."ID_CARRERA"
JOIN "GRUPOS" gr        ON gr."ID_GRUPO"      = po."ID_GRUPO" AND gr."ACTIVO" = TRUE
JOIN "SEDES" se         ON se."ID_SEDE"       = gr."ID_SEDE"
JOIN "PERIODOS" pe      ON pe."ID_PERIODO"    = gr."ID_PERIODO"
LEFT JOIN "ASISTENCIAS_POSTULANTE" ap ON ap."ID_POSTULANTE" = po."ID_POSTULANTE"
WHERE po."ACTIVO" = TRUE
GROUP BY
    po."ID_POSTULANTE",
    es."NOMBRES",
    es."APELLIDOS",
    ca."NOMBRE_CARRERA",
    po."ALUMNO_LIBRE",
    po."ACTIVO",
    gr."ID_GRUPO",
    gr."CODIGO_GRUPO",
    gr."NOMBRE_GRUPO",
    gr."ID_SEDE",
    se."NOMBRE_SEDE",
    gr."ID_PERIODO",
    pe."NOMBRE_PERIODO";
