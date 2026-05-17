-- ============================================================
-- VIEW 1: VW_HORAS_POR_PLAZA
-- Granularidad: 1 fila por ID_PLAZA_DOCENTE
-- Grupos asignados como arrays
-- ============================================================

DROP VIEW IF EXISTS "VW_HORAS_POR_DOCENTE";
DROP VIEW IF EXISTS "VW_HORAS_POR_PLAZA";

CREATE OR REPLACE VIEW "VW_HORAS_POR_PLAZA" AS
WITH horas_prog AS (
    -- Horas programadas: bloques clase asignados a cada GPC
    SELECT
        pg."ID_GRUPO_PLAN_CURSO",
        SUM(hb."DURACION")                              AS minutos_programados,
        ROUND(SUM(hb."DURACION")::NUMERIC / 50, 2)      AS horas_programadas,
        COUNT(pg."ID_PROGRAMACION")                     AS bloques_asignados
    FROM "PROGRAMACION_GRUPO" pg
    JOIN "HORARIO_BLOQUES" hb
        ON  hb."ID_BLOQUE"   = pg."ID_BLOQUE"
        AND hb."TIPO_BLOQUE" = 'clase'
    WHERE pg."ACTIVO" = TRUE
    GROUP BY pg."ID_GRUPO_PLAN_CURSO"
),
horas_real AS (
    -- Horas realizadas: sesiones agrupadas por GPC
    SELECT
        sa."ID_GRUPO_PLAN_CURSO",
        SUM(sa."DURACION_TOTAL_MINUTOS")                         AS minutos_realizados,
        ROUND(SUM(sa."DURACION_TOTAL_MINUTOS")::NUMERIC / 50, 2) AS horas_realizadas,
        COUNT(sa."ID_SESION")                                    AS total_sesiones
    FROM "SESIONES_AGRUPADAS" sa
    WHERE sa."ACTIVO" = TRUE
    GROUP BY sa."ID_GRUPO_PLAN_CURSO"
),
-- Unir GPC con sus horas y datos de grupo
gpc_detalle AS (
    SELECT
        gpc."ID_PLAZA_DOCENTE",
        gpc."ID_GRUPO_PLAN_CURSO",
        g."ID_GRUPO",
        g."ID_AREA",
        g."CODIGO_GRUPO",
        g."NOMBRE_GRUPO",
        pac."HORAS_ACADEMICAS_CICLO",
        pac."HORAS_ACADEMICAS_TOTALES",
        COALESCE(hp.minutos_programados, 0)  AS minutos_prog,
        COALESCE(hp.horas_programadas, 0)    AS horas_prog,
        COALESCE(hp.bloques_asignados, 0)    AS bloques_prog,
        COALESCE(hr.minutos_realizados, 0)   AS minutos_real,
        COALESCE(hr.horas_realizadas, 0)     AS horas_real,
        COALESCE(hr.total_sesiones, 0)       AS sesiones_real
    FROM "GRUPO_PLAN_CURSO" gpc
    JOIN "GRUPOS" g ON g."ID_GRUPO" = gpc."ID_GRUPO" AND g."ACTIVO" = TRUE
    JOIN "PLAN_ACADEMICO_CURSOS" pac
        ON pac."ID_PLAN_ACADEMICO_CURSO" = gpc."ID_PLAN_ACADEMICO_CURSO"
    LEFT JOIN horas_prog hp ON hp."ID_GRUPO_PLAN_CURSO" = gpc."ID_GRUPO_PLAN_CURSO"
    LEFT JOIN horas_real hr ON hr."ID_GRUPO_PLAN_CURSO" = gpc."ID_GRUPO_PLAN_CURSO"
    WHERE gpc."ACTIVO" = TRUE
      AND gpc."ID_PLAZA_DOCENTE" IS NOT NULL
)
SELECT
    pd."ID_PLAZA_DOCENTE",
    pd."ID_PERIODO",
    per."CODIGO_PERIODO",
    per."NOMBRE_PERIODO",
    pd."IDENTIFICADOR_DOCENTE",
    pd."PAGO_POR_HORA",
    pd."ID_SEDE",
    s."NOMBRE_SEDE",
    pd."ID_CURSO",
    c."NOMBRE_CURSO",
    c."EJE_TEMATICO",
    -- Arrays de grupos asignados
    COUNT(DISTINCT gd."ID_GRUPO")                                           AS "TOTAL_GRUPOS",
    ARRAY_AGG(gd."ID_GRUPO"     ORDER BY gd."ID_AREA", gd."ID_GRUPO")     AS "IDS_GRUPOS",
    ARRAY_AGG(gd."CODIGO_GRUPO" ORDER BY gd."ID_AREA", gd."CODIGO_GRUPO") AS "CODIGOS_GRUPOS",
    ARRAY_AGG(gd."NOMBRE_GRUPO" ORDER BY gd."ID_AREA", gd."NOMBRE_GRUPO") AS "NOMBRES_GRUPOS",
    -- Horas ciclo requeridas (del plan, igual para todos los GPC de la plaza)
    MAX(gd."HORAS_ACADEMICAS_CICLO")                                        AS "HORAS_CICLO_REQUERIDAS",
    MAX(gd."HORAS_ACADEMICAS_TOTALES")                                      AS "HORAS_TOTALES_REQUERIDAS",
    -- Programadas (suma de todos los GPC de la plaza)
    SUM(gd.minutos_prog)                                                    AS "MINUTOS_PROGRAMADOS",
    ROUND(SUM(gd.horas_prog), 2)                                            AS "HORAS_PROGRAMADAS",
    SUM(gd.bloques_prog)                                                    AS "BLOQUES_ASIGNADOS",
    -- Realizadas (suma de todos los GPC de la plaza)
    SUM(gd.minutos_real)                                                    AS "MINUTOS_REALIZADOS",
    ROUND(SUM(gd.horas_real), 2)                                            AS "HORAS_REALIZADAS",
    SUM(gd.sesiones_real)                                                   AS "TOTAL_SESIONES",
    -- Estado programación vs ciclo requerido (basado en totales sumados)
    CASE
        WHEN SUM(gd.horas_prog) = 0                                         THEN 'Sin programar'
        WHEN SUM(gd.horas_prog) < MAX(gd."HORAS_ACADEMICAS_CICLO")         THEN 'Incompleto'
        WHEN SUM(gd.horas_prog) = MAX(gd."HORAS_ACADEMICAS_CICLO")         THEN 'Completo'
        WHEN SUM(gd.horas_prog) > MAX(gd."HORAS_ACADEMICAS_CICLO")         THEN 'Excede'
    END                                                                     AS "ESTADO_PROGRAMACION",
    -- Porcentaje de avance (realizadas / totales requeridas)
    CASE
        WHEN MAX(gd."HORAS_ACADEMICAS_TOTALES") > 0
        THEN ROUND(
            SUM(gd.horas_real) / MAX(gd."HORAS_ACADEMICAS_TOTALES") * 100, 2
        )
        ELSE 0
    END                                                                     AS "PORCENTAJE_AVANCE",
    -- Pago estimado
    ROUND(SUM(gd.horas_real) * COALESCE(pd."PAGO_POR_HORA", 0), 2)         AS "PAGO_ESTIMADO"

FROM "PLAZA_DOCENTE" pd
JOIN "PERIODOS"     per  ON per."ID_PERIODO" = pd."ID_PERIODO"
JOIN "SEDES"        s    ON s."ID_SEDE"      = pd."ID_SEDE"
JOIN "CURSOS"       c    ON c."ID_CURSO"     = pd."ID_CURSO"
LEFT JOIN gpc_detalle gd ON gd."ID_PLAZA_DOCENTE" = pd."ID_PLAZA_DOCENTE"

WHERE pd."ACTIVO" = TRUE

GROUP BY
    pd."ID_PLAZA_DOCENTE",
    pd."ID_PERIODO",
    per."CODIGO_PERIODO",
    per."NOMBRE_PERIODO",
    pd."IDENTIFICADOR_DOCENTE",
    pd."PAGO_POR_HORA",
    pd."ID_SEDE",
    s."NOMBRE_SEDE",
    pd."ID_CURSO",
    c."NOMBRE_CURSO",
    c."EJE_TEMATICO"

ORDER BY
    per."CODIGO_PERIODO",
    pd."ID_PLAZA_DOCENTE";


-- ============================================================
-- VIEW 2: VW_HORAS_POR_DOCENTE
-- Granularidad: 1 fila por (ID_DOCENTE, ID_PERIODO)
-- Plazas del mismo docente en el mismo período → 1 fila agregada
-- Plazas en períodos distintos → filas separadas
-- ============================================================

CREATE OR REPLACE VIEW "VW_HORAS_POR_DOCENTE" AS
WITH base AS (
    -- Partir de VW_HORAS_POR_PLAZA (ahora 1 fila por plaza, con arrays de grupos)
    SELECT
        v."ID_PERIODO",
        v."CODIGO_PERIODO",
        v."NOMBRE_PERIODO",
        v."ID_PLAZA_DOCENTE",
        v."IDENTIFICADOR_DOCENTE",
        v."PAGO_POR_HORA",
        v."ID_SEDE",
        v."NOMBRE_SEDE",
        v."ID_CURSO",
        v."NOMBRE_CURSO",
        -- Arrays de grupos de esta plaza
        v."IDS_GRUPOS",
        v."CODIGOS_GRUPOS",
        v."NOMBRES_GRUPOS",
        v."TOTAL_GRUPOS",
        v."HORAS_PROGRAMADAS",
        v."HORAS_REALIZADAS",
        v."PAGO_ESTIMADO",
        pd."ID_DOCENTE",
        d."DNI",
        d."NOMBRES",
        d."APELLIDOS",
        d."EMAIL",
        d."TELEFONO",
        d."TIPO_DOCENTE"
    FROM "VW_HORAS_POR_PLAZA" v
    JOIN "PLAZA_DOCENTE" pd ON pd."ID_PLAZA_DOCENTE" = v."ID_PLAZA_DOCENTE"
    JOIN "DOCENTES"       d  ON d."ID_DOCENTE"        = pd."ID_DOCENTE"
    WHERE pd."ID_DOCENTE" IS NOT NULL
      AND d."ACTIVO" = TRUE
)
SELECT
    b."ID_DOCENTE",
    b."DNI",
    b."NOMBRES",
    b."APELLIDOS",
    CONCAT(b."NOMBRES", ' ', b."APELLIDOS")                     AS "NOMBRE_COMPLETO",
    b."EMAIL",
    b."TELEFONO",
    b."TIPO_DOCENTE",
    b."ID_PERIODO",
    b."CODIGO_PERIODO",
    b."NOMBRE_PERIODO",
    -- Resumen de plazas en este período
    COUNT(DISTINCT b."ID_PLAZA_DOCENTE")                        AS "TOTAL_PLAZAS",
    ARRAY_AGG(DISTINCT b."ID_PLAZA_DOCENTE" ORDER BY b."ID_PLAZA_DOCENTE")
                                                                AS "IDS_PLAZAS",
    ARRAY_AGG(DISTINCT b."IDENTIFICADOR_DOCENTE" ORDER BY b."IDENTIFICADOR_DOCENTE")
                                                                AS "IDENTIFICADORES_DOCENTE",
    -- Grupos (aplanamos los arrays de cada plaza con unnest + re-agregamos DISTINCT)
    COUNT(DISTINCT grp_id)                                      AS "TOTAL_GRUPOS",
    ARRAY_AGG(DISTINCT grp_id      ORDER BY grp_id)             AS "IDS_GRUPOS",
    ARRAY_AGG(DISTINCT grp_codigo  ORDER BY grp_codigo)         AS "CODIGOS_GRUPOS",
    ARRAY_AGG(DISTINCT grp_nombre  ORDER BY grp_nombre)         AS "NOMBRES_GRUPOS",
    -- Cursos
    COUNT(DISTINCT b."ID_CURSO")                                AS "TOTAL_CURSOS",
    ARRAY_AGG(DISTINCT b."NOMBRE_CURSO" ORDER BY b."NOMBRE_CURSO")
                                                                AS "CURSOS",
    -- Sedes
    ARRAY_AGG(DISTINCT b."NOMBRE_SEDE" ORDER BY b."NOMBRE_SEDE")
                                                                AS "SEDES",
    -- Horas totales (suma de todas sus plazas en el período)
    ROUND(SUM(b."HORAS_PROGRAMADAS"), 2)                        AS "TOTAL_HORAS_PROGRAMADAS",
    ROUND(SUM(b."HORAS_REALIZADAS"), 2)                         AS "TOTAL_HORAS_REALIZADAS",
    -- Pago total estimado
    ROUND(SUM(b."PAGO_ESTIMADO"), 2)                            AS "PAGO_TOTAL_ESTIMADO"

FROM base b
-- Desanidar los arrays de grupos para poder hacer DISTINCT entre plazas
CROSS JOIN LATERAL unnest(b."IDS_GRUPOS")      AS grp_id
CROSS JOIN LATERAL unnest(b."CODIGOS_GRUPOS")  AS grp_codigo
CROSS JOIN LATERAL unnest(b."NOMBRES_GRUPOS")  AS grp_nombre

GROUP BY
    b."ID_DOCENTE",
    b."DNI",
    b."NOMBRES",
    b."APELLIDOS",
    b."EMAIL",
    b."TELEFONO",
    b."TIPO_DOCENTE",
    b."ID_PERIODO",
    b."CODIGO_PERIODO",
    b."NOMBRE_PERIODO"

ORDER BY
    b."CODIGO_PERIODO",
    b."APELLIDOS",
    b."NOMBRES";
