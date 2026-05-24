-- ============================================
-- VIEW: VW_GRUPOS_POSTULANTES
-- Combina grupos con sus postulantes para tabla multinivel
-- Nivel 1: Grupos (con conteo de postulantes)
-- Nivel 2: Postulantes del grupo
-- Cada postulante genera una línea; si no hay, una línea con nulls
-- ============================================

DROP VIEW IF EXISTS "VW_GRUPOS_POSTULANTES";

CREATE OR REPLACE VIEW "VW_GRUPOS_POSTULANTES" AS
-- Todos los grupos con sus datos (los postulantes null indican grupo sin postulantes)
SELECT
    g."ID_GRUPO",
    g."CODIGO_GRUPO",
    g."NOMBRE_GRUPO",
    g."ID_PERIODO",
    p."NOMBRE_PERIODO",
    g."ID_SEDE",
    s."NOMBRE_SEDE",
    g."ID_AREA",
    a."NOMBRE_AREA",
    g."ID_TURNO",
    t."NOMBRE_TURNO",
    g."CAPACIDAD_MAXIMA",
    g."FECHA_INICIO",
    g."FECHA_TERMINO",
    g."ACTIVO" AS "GRUPO_ACTIVO",
    -- Conteo de postulantes activos por grupo
    (
        SELECT COUNT(*)::INTEGER 
        FROM "POSTULANTES" po2 
        WHERE po2."ID_GRUPO" = g."ID_GRUPO" 
          AND po2."ACTIVO" = TRUE
    ) AS "TOTAL_POSTULANTES",
    -- Datos del postulante (NULL si no hay)
    po."ID_POSTULANTE",
    po."ID_ESTUDIANTE",
    TRIM(UPPER(es."NOMBRES"))   AS "NOMBRES",
    TRIM(UPPER(es."APELLIDOS")) AS "APELLIDOS",
    po."ID_CARRERA",
    ca."NOMBRE_CARRERA",
    po."ALUMNO_LIBRE",
    po."ACTIVO" AS "POSTULANTE_ACTIVO"
FROM "GRUPOS" g
JOIN "PERIODOS" p ON p."ID_PERIODO" = g."ID_PERIODO"
JOIN "SEDES" s ON s."ID_SEDE" = g."ID_SEDE"
JOIN "AREAS" a ON a."ID_AREA" = g."ID_AREA"
JOIN "TURNOS" t ON t."ID_TURNO" = g."ID_TURNO"
LEFT JOIN "POSTULANTES" po ON po."ID_GRUPO" = g."ID_GRUPO" AND po."ACTIVO" = TRUE
LEFT JOIN "ESTUDIANTES" es ON es."ID_ESTUDIANTE" = po."ID_ESTUDIANTE"
LEFT JOIN "CARRERAS" ca ON ca."ID_CARRERA" = po."ID_CARRERA"
WHERE g."ACTIVO" = TRUE;
