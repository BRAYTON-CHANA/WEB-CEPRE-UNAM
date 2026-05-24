-- ============================================
-- VIEW: VW_SESIONES_AGRUPADAS_DESGLOSE
-- Desglose de sesiones agrupadas por bloque con datos de grupo, curso, docente
-- Solo registros con grupo activo
-- ============================================

DROP VIEW IF EXISTS "VW_SESIONES_AGRUPADAS_DESGLOSE";

CREATE OR REPLACE VIEW "VW_SESIONES_AGRUPADAS_DESGLOSE" AS
WITH bloques_expandidos AS (
    -- Expandir el JSONB de bloques en filas individuales
    SELECT 
        sa."ID_SESION",
        sa."FECHA",
        sa."ID_GRUPO_PLAN_CURSO",
        gpc."ID_GRUPO",
        (bloque_item->>'id')::INTEGER           AS "ID_BLOQUE",
        (bloque_item->>'tipo')                  AS "TIPO_BLOQUE_JSON",
        (bloque_item->>'duracion')::INTEGER      AS "DURACION_BLOQUE_JSON",
        sa."HORA_INICIO"                         AS sesion_hora_ini,
        sa."HORA_FIN"                            AS sesion_hora_fin,
        sa."DURACION_TOTAL_MINUTOS",
        sa."IDS_BLOQUES",
        sa."IDS_PROGRAMACION"                    AS ids_prog_array,
        sa."ESTADO",
        sa."ACTIVO"
    FROM "SESIONES_AGRUPADAS" sa
    JOIN "GRUPO_PLAN_CURSO" gpc ON gpc."ID_GRUPO_PLAN_CURSO" = sa."ID_GRUPO_PLAN_CURSO"
    CROSS JOIN LATERAL jsonb_array_elements(sa."IDS_BLOQUES") AS bloque_item
    WHERE sa."ACTIVO" = TRUE
),
bloques_con_prog AS (
    -- Unir con PROGRAMACION_GRUPO para obtener ID_PROGRAMACION (solo bloques clase)
    SELECT
        be.*,
        pg."ID_PROGRAMACION"
    FROM bloques_expandidos be
    LEFT JOIN "PROGRAMACION_GRUPO" pg
        ON  pg."ID_BLOQUE"             = be."ID_BLOQUE"
        AND pg."ID_GRUPO_PLAN_CURSO"   = be."ID_GRUPO_PLAN_CURSO"
        AND pg."ACTIVO"                = TRUE
),
bloques_con_info AS (
    SELECT 
        bcp.*,
        hb."ORDEN",
        hb."ID_HORARIO",
        -- Minutos acumulados DENTRO de la sesión
        SUM(bcp."DURACION_BLOQUE_JSON") OVER (
            PARTITION BY bcp."ID_SESION"
            ORDER BY hb."ORDEN"
            ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
        ) AS minutos_acumulados
    FROM bloques_con_prog bcp
    JOIN "HORARIO_BLOQUES" hb ON hb."ID_BLOQUE" = bcp."ID_BLOQUE"
)
SELECT 
    bci."ID_SESION",
    bci."FECHA",
    bci."ID_GRUPO_PLAN_CURSO",
    bci."ID_GRUPO",
    bci."ID_BLOQUE",
    bci."ID_PROGRAMACION",
    -- Hora de inicio del bloque dentro de la sesión
    (bci.sesion_hora_ini + (COALESCE(bci.minutos_acumulados, 0) || ' minutes')::INTERVAL)                            AS "HORA_INICIO",
    -- Hora de fin del bloque
    (bci.sesion_hora_ini + ((COALESCE(bci.minutos_acumulados, 0) + bci."DURACION_BLOQUE_JSON") || ' minutes')::INTERVAL) AS "HORA_FIN",
    bci."DURACION_BLOQUE_JSON"                AS "DURACION_MINUTOS",
    bci."ORDEN",
    bci."TIPO_BLOQUE_JSON"                    AS "TIPO_BLOQUE",
    bci."ID_HORARIO",
    bci."ESTADO",
    bci."ACTIVO",
    bci."DURACION_TOTAL_MINUTOS"              AS "DURACION_SESION_MINUTOS",
    bci."IDS_BLOQUES"                         AS "BLOQUES_AGRUPADOS",
    bci.ids_prog_array                        AS "PROGRAMACIONES_AGRUPADAS",

    g."CODIGO_GRUPO",
    g."NOMBRE_GRUPO",
    g."ID_PERIODO",
    p."CODIGO_PERIODO",
    p."NOMBRE_PERIODO",
    c."ID_CURSO",
    c."CODIGO_CURSO",
    c."NOMBRE_CURSO",
    c."EJE_TEMATICO",
    pa."ID_AREA",
    a."CODIGO_AREA",
    a."NOMBRE_AREA",
    pd."ID_PLAZA_DOCENTE",
    pd."IDENTIFICADOR_DOCENTE"                AS "DOCENTE_DISPLAY",
    d."ID_DOCENTE",
    d."DNI"                                   AS "DOCENTE_DNI",
    CONCAT(d."NOMBRES", ' ', d."APELLIDOS")   AS "DOCENTE_NOMBRE_COMPLETO",
    d."EMAIL"                                 AS "DOCENTE_EMAIL",
    d."TELEFONO"                              AS "DOCENTE_TELEFONO",
    s."ID_SEDE",
    s."NOMBRE_SEDE"

FROM bloques_con_info bci
JOIN "GRUPOS" g          ON g."ID_GRUPO"                    = bci."ID_GRUPO" AND g."ACTIVO" = TRUE
JOIN "PERIODOS" p        ON p."ID_PERIODO"                  = g."ID_PERIODO"
JOIN "GRUPO_PLAN_CURSO" gpc ON gpc."ID_GRUPO_PLAN_CURSO"    = bci."ID_GRUPO_PLAN_CURSO"
JOIN "PLAN_ACADEMICO_CURSOS" pac ON pac."ID_PLAN_ACADEMICO_CURSO" = gpc."ID_PLAN_ACADEMICO_CURSO"
JOIN "PLAN_ACADEMICO" pa ON pa."ID_PLAN"                    = pac."ID_PLAN_ACADEMICO"
JOIN "AREAS" a           ON a."ID_AREA"                     = pa."ID_AREA"
JOIN "CURSOS" c          ON c."ID_CURSO"                    = pac."ID_CURSO"
LEFT JOIN "PLAZA_DOCENTE" pd ON pd."ID_PLAZA_DOCENTE"       = gpc."ID_PLAZA_DOCENTE"
LEFT JOIN "DOCENTES" d   ON d."ID_DOCENTE"                  = pd."ID_DOCENTE"
JOIN "SEDES" s           ON s."ID_SEDE"                     = g."ID_SEDE"

WHERE bci."TIPO_BLOQUE_JSON" = 'clase'

ORDER BY bci."FECHA", bci."ID_GRUPO", bci."ORDEN";
