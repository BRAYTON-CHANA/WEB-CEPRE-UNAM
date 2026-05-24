-- ============================================
-- VIEW: VW_CARRERAS_SEDE
-- Carreras agrupadas por sede para tabla multinivel
-- Nivel 1: Sede
-- Nivel 2: Carreras de la sede
-- ============================================

DROP VIEW IF EXISTS "VW_CARRERAS_SEDE";

CREATE OR REPLACE VIEW "VW_CARRERAS_SEDE" AS
SELECT
    s."ID_SEDE",
    s."NOMBRE_SEDE",
    ca."ID_CARRERA",
    ca."NOMBRE_CARRERA",
    ca."ID_AREA",
    a."NOMBRE_AREA",
    ca."ACTIVO" AS "CARRERA_ACTIVO",
    -- Conteo de carreras por sede (usado en nivel 1)
    COUNT(ca."ID_CARRERA") OVER (PARTITION BY s."ID_SEDE") AS "TOTAL_CARRERAS"
FROM "SEDES" s
LEFT JOIN "CARRERAS" ca ON ca."ID_SEDE" = s."ID_SEDE" AND ca."ACTIVO" = TRUE
LEFT JOIN "AREAS" a ON a."ID_AREA" = ca."ID_AREA"
WHERE s."ACTIVO" = TRUE;
