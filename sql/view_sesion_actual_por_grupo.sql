-- ============================================
-- VIEW: VW_SESION_ACTUAL_POR_GRUPO
-- Devuelve la sesión actual (en curso) o próxima para cada grupo
-- Corregido: Ahora prioriza correctamente sesiones en curso sobre próximas
-- ============================================

DROP VIEW IF EXISTS "VW_SESION_ACTUAL_POR_GRUPO";

CREATE OR REPLACE VIEW "VW_SESION_ACTUAL_POR_GRUPO" AS
WITH hora_local AS (
    -- Forzar zona horaria de Perú (UTC-5)
    SELECT 
        (CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::time AS ahora,
        (CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date AS hoy
),
-- Todas las sesiones candidatas con su prioridad calculada correctamente
sesiones_priorizadas AS (
    SELECT 
        g."ID_GRUPO",
        sa."ID_SESION",
        sa."FECHA",
        sa."HORA_INICIO",
        sa."HORA_FIN",
        sa."DURACION_TOTAL_MINUTOS",
        sa."ID_GRUPO_PLAN_CURSO",
        sa."ESTADO",
        sa."IDS_BLOQUES",
        sa."ASISTIO",
        sa."ID_DOCENTE_ASISTIO",
        sa."NOMBRE_SUPLENTE_EXTERNO",
        sa."HORA_ENTRADA_REAL",
        sa."MOTIVO_FALTA",
        sa."OBSERVACIONES",
        hl.ahora,
        -- Prioridad: 1 = En curso, 2 = Próxima hoy, 3 = Futura
        CASE 
            WHEN sa."FECHA" = hl.hoy 
                 AND sa."HORA_INICIO" <= hl.ahora 
                 AND sa."HORA_FIN" >= hl.ahora THEN 1
            WHEN sa."FECHA" = hl.hoy 
                 AND sa."HORA_INICIO" > hl.ahora THEN 2
            WHEN sa."FECHA" > hl.hoy THEN 3
            ELSE 4
        END AS prioridad,
        ROW_NUMBER() OVER (
            PARTITION BY g."ID_GRUPO" 
            ORDER BY 
                CASE 
                    WHEN sa."FECHA" = hl.hoy 
                         AND sa."HORA_INICIO" <= hl.ahora 
                         AND sa."HORA_FIN" >= hl.ahora THEN 1
                    WHEN sa."FECHA" = hl.hoy 
                         AND sa."HORA_INICIO" > hl.ahora THEN 2
                    WHEN sa."FECHA" > hl.hoy THEN 3
                    ELSE 4
                END,
                sa."FECHA",
                sa."HORA_INICIO"
        ) AS rn
    FROM "GRUPOS" g
    CROSS JOIN hora_local hl
    JOIN "GRUPO_PLAN_CURSO" gpc 
        ON gpc."ID_GRUPO" = g."ID_GRUPO" 
        AND gpc."ACTIVO" = true
    JOIN "SESIONES_AGRUPADAS" sa 
        ON sa."ID_GRUPO_PLAN_CURSO" = gpc."ID_GRUPO_PLAN_CURSO"
        AND sa."ACTIVO" = true
        -- Solo sesiones hoy (aún no terminadas) o futuras
        AND (
            (sa."FECHA" = hl.hoy AND sa."HORA_FIN" >= hl.ahora)
            OR sa."FECHA" > hl.hoy
        )
    WHERE g."ACTIVO" = true
),
-- Determinar estado actual (En clase / En break / Próxima)
estado_calculado AS (
    SELECT 
        sp.*,
        CASE 
            WHEN sp.prioridad = 1 THEN (
                -- Calcular si está en clase o en break
                SELECT 
                    CASE 
                        WHEN MAX(CASE 
                            WHEN tipo_bloque = 'break' AND en_bloque THEN 1 
                            ELSE 0 
                        END) = 1 THEN 'En break'
                        ELSE 'En clase'
                    END
                FROM (
                    SELECT 
                        bloque->>'tipo' AS tipo_bloque,
                        (bloque->>'duracion')::int AS duracion,
                        -- Minutos transcurridos desde inicio de sesión
                        EXTRACT(EPOCH FROM (sp.ahora - sp."HORA_INICIO"))::int / 60 AS minutos_transcurridos,
                        -- Minutos acumulados hasta este bloque
                        SUM((bloque->>'duracion')::int) OVER (
                            ORDER BY ord ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
                        ) AS acum_antes,
                        -- ¿Estamos dentro de este bloque?
                        EXTRACT(EPOCH FROM (sp.ahora - sp."HORA_INICIO"))::int / 60 >= COALESCE(
                            SUM((bloque->>'duracion')::int) OVER (
                                ORDER BY ord ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
                            ), 0
                        )
                        AND EXTRACT(EPOCH FROM (sp.ahora - sp."HORA_INICIO"))::int / 60 < COALESCE(
                            SUM((bloque->>'duracion')::int) OVER (
                                ORDER BY ord ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
                            ), 0
                        ) + (bloque->>'duracion')::int AS en_bloque
                    FROM jsonb_array_elements(sp."IDS_BLOQUES") WITH ORDINALITY AS t(bloque, ord)
                ) bloques_pos
            )
            WHEN sp.prioridad = 2 THEN 'Próxima'
            WHEN sp.prioridad = 3 THEN 'Próxima'
            ELSE 'Próxima'
        END AS estado_actual,
        CASE 
            WHEN sp.prioridad = 1 THEN EXTRACT(EPOCH FROM (sp."HORA_FIN" - sp.ahora))::int / 60
            ELSE NULL
        END AS minutos_restantes,
        CASE 
            WHEN sp.prioridad IN (2, 3) THEN sp."FECHA" - (CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date
            ELSE NULL
        END AS dias_para_siguiente
    FROM sesiones_priorizadas sp
    WHERE sp.rn = 1  -- Solo la primera (mejor prioridad) por grupo
),
-- Grupos sin sesión (ni hoy ni futura)
grupos_sin_sesion AS (
    SELECT 
        g."ID_GRUPO"
    FROM "GRUPOS" g
    WHERE g."ACTIVO" = true
      AND g."ID_GRUPO" NOT IN (
          SELECT "ID_GRUPO" FROM estado_calculado
      )
)
-- Resultado principal: grupos con sesión
SELECT 
    g."ID_GRUPO",
    g."CODIGO_GRUPO",
    g."NOMBRE_GRUPO",
    g."ID_SEDE",
    s."NOMBRE_SEDE",
    g."ID_PERIODO",
    p."CODIGO_PERIODO",
    p."NOMBRE_PERIODO",
    t."NOMBRE_TURNO",
    ec."ID_SESION",
    ec."FECHA",
    ec."HORA_INICIO",
    ec."HORA_FIN",
    ec."DURACION_TOTAL_MINUTOS",
    ec."ID_GRUPO_PLAN_CURSO",
    ec."ESTADO",
    ec.estado_actual AS "ESTADO_ACTUAL",
    ec.minutos_restantes AS "MINUTOS_RESTANTES",
    ec.dias_para_siguiente AS "DIAS_PARA_SIGUIENTE",
    c."ID_CURSO",
    c."CODIGO_CURSO",
    c."NOMBRE_CURSO",
    a."CODIGO_AREA",
    a."NOMBRE_AREA",
    pd."IDENTIFICADOR_DOCENTE" AS "PLAZA_IDENTIFICADOR",
    d."ID_DOCENTE" AS "ID_DOCENTE_PROGRAMADO",
    (d."APELLIDOS"::text || ', '::text) || d."NOMBRES"::text AS "DOCENTE_NOMBRE",
    ec."ASISTIO",
    ec."ID_DOCENTE_ASISTIO",
    ec."NOMBRE_SUPLENTE_EXTERNO",
    ec."HORA_ENTRADA_REAL",
    ec."MOTIVO_FALTA",
    ec."OBSERVACIONES"
FROM estado_calculado ec
JOIN "GRUPOS" g ON g."ID_GRUPO" = ec."ID_GRUPO"
JOIN "PERIODOS" p ON p."ID_PERIODO" = g."ID_PERIODO"
JOIN "TURNOS" t ON t."ID_TURNO" = g."ID_TURNO"
JOIN "SEDES" s ON s."ID_SEDE" = g."ID_SEDE"
JOIN "GRUPO_PLAN_CURSO" gpc ON gpc."ID_GRUPO_PLAN_CURSO" = ec."ID_GRUPO_PLAN_CURSO"
JOIN "PLAN_ACADEMICO_CURSOS" pac ON pac."ID_PLAN_ACADEMICO_CURSO" = gpc."ID_PLAN_ACADEMICO_CURSO"
JOIN "PLAN_ACADEMICO" pa ON pa."ID_PLAN" = pac."ID_PLAN_ACADEMICO"
JOIN "AREAS" a ON a."ID_AREA" = pa."ID_AREA"
JOIN "CURSOS" c ON c."ID_CURSO" = pac."ID_CURSO"
LEFT JOIN "PLAZA_DOCENTE" pd ON pd."ID_PLAZA_DOCENTE" = gpc."ID_PLAZA_DOCENTE"
LEFT JOIN "DOCENTES" d ON d."ID_DOCENTE" = pd."ID_DOCENTE"

UNION ALL

-- Grupos sin sesión
SELECT 
    g."ID_GRUPO",
    g."CODIGO_GRUPO",
    g."NOMBRE_GRUPO",
    g."ID_SEDE",
    s."NOMBRE_SEDE",
    g."ID_PERIODO",
    p."CODIGO_PERIODO",
    p."NOMBRE_PERIODO",
    t."NOMBRE_TURNO",
    NULL::integer AS "ID_SESION",
    NULL::date AS "FECHA",
    NULL::time without time zone AS "HORA_INICIO",
    NULL::time without time zone AS "HORA_FIN",
    NULL::integer AS "DURACION_TOTAL_MINUTOS",
    NULL::integer AS "ID_GRUPO_PLAN_CURSO",
    NULL::character varying AS "ESTADO",
    'Sin más clases'::text AS "ESTADO_ACTUAL",
    NULL::integer AS "MINUTOS_RESTANTES",
    NULL::integer AS "DIAS_PARA_SIGUIENTE",
    NULL::integer AS "ID_CURSO",
    NULL::character varying AS "CODIGO_CURSO",
    NULL::character varying AS "NOMBRE_CURSO",
    NULL::character varying AS "CODIGO_AREA",
    NULL::character varying AS "NOMBRE_AREA",
    NULL::text AS "PLAZA_IDENTIFICADOR",
    NULL::integer AS "ID_DOCENTE_PROGRAMADO",
    NULL::text AS "DOCENTE_NOMBRE",
    NULL::boolean AS "ASISTIO",
    NULL::integer AS "ID_DOCENTE_ASISTIO",
    NULL::text AS "NOMBRE_SUPLENTE_EXTERNO",
    NULL::time without time zone AS "HORA_ENTRADA_REAL",
    NULL::character varying AS "MOTIVO_FALTA",
    NULL::text AS "OBSERVACIONES"
FROM grupos_sin_sesion gss
JOIN "GRUPOS" g ON g."ID_GRUPO" = gss."ID_GRUPO"
JOIN "PERIODOS" p ON p."ID_PERIODO" = g."ID_PERIODO"
JOIN "TURNOS" t ON t."ID_TURNO" = g."ID_TURNO"
JOIN "SEDES" s ON s."ID_SEDE" = g."ID_SEDE"

ORDER BY 24, 2;
