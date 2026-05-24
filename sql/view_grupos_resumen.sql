-- ============================================
-- VIEW: VW_GRUPOS_RESUMEN
-- Grupos con resumen de postulantes
-- ============================================

DROP VIEW IF EXISTS "VW_GRUPOS_RESUMEN";

CREATE OR REPLACE VIEW "VW_GRUPOS_RESUMEN" AS
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
    COUNT(po."ID_POSTULANTE")::INTEGER AS "TOTAL_POSTULANTES"
FROM "GRUPOS" g
JOIN "PERIODOS" p ON p."ID_PERIODO" = g."ID_PERIODO"
JOIN "SEDES" s ON s."ID_SEDE" = g."ID_SEDE"
JOIN "AREAS" a ON a."ID_AREA" = g."ID_AREA"
JOIN "TURNOS" t ON t."ID_TURNO" = g."ID_TURNO"
LEFT JOIN "POSTULANTES" po ON po."ID_GRUPO" = g."ID_GRUPO" AND po."ACTIVO" = TRUE
GROUP BY 
    g."ID_GRUPO", g."CODIGO_GRUPO", g."NOMBRE_GRUPO",
    g."ID_PERIODO", p."NOMBRE_PERIODO",
    g."ID_SEDE", s."NOMBRE_SEDE",
    g."ID_AREA", a."NOMBRE_AREA",
    g."ID_TURNO", t."NOMBRE_TURNO",
    g."CAPACIDAD_MAXIMA", g."FECHA_INICIO", g."FECHA_TERMINO", g."ACTIVO";
