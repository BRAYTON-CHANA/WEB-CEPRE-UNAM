-- ============================================
-- VIEW: VW_SESION_ACTIVA_GRUPO
-- Devuelve el ID_SESION activo (en curso o próxima) por cada grupo
-- Basado en VW_SESIONES_AGRUPADAS_DESGLOSE para usar lógica probada
-- ============================================

DROP VIEW IF EXISTS "VW_SESION_ACTIVA_GRUPO";

CREATE OR REPLACE VIEW "VW_SESION_ACTIVA_GRUPO" AS
WITH hora_local AS (
    SELECT 
        CURRENT_TIME AS ahora,
        CURRENT_DATE AS hoy
),
sesiones_hoy AS (
    -- Sesiones de hoy y futuras, con prioridad: 1=en curso, 2=próxima
    SELECT 
        vd."ID_GRUPO",
        vd."ID_SESION",
        vd."FECHA",
        vd."HORA_INICIO",
        vd."HORA_FIN",
        CASE 
            WHEN vd."FECHA" = hl.hoy 
                 AND vd."HORA_INICIO" <= hl.ahora 
                 AND vd."HORA_FIN" >= hl.ahora THEN 1  -- En curso
            ELSE 2  -- Próxima (hoy tarde o días futuros)
        END AS prioridad
    FROM "VW_SESIONES_AGRUPADAS_DESGLOSE" vd
    CROSS JOIN hora_local hl
    WHERE vd."FECHA" >= hl.hoy
      AND vd."HORA_FIN" >= hl.ahora
    ORDER BY vd."ID_GRUPO", prioridad, vd."FECHA", vd."HORA_INICIO"
),
seleccionar_primera AS (
    -- Solo la primera sesión por grupo (DISTINCT ON respeta el ORDER BY anterior)
    SELECT DISTINCT ON ("ID_GRUPO")
        "ID_GRUPO",
        "ID_SESION",
        "FECHA",
        "HORA_INICIO",
        "HORA_FIN",
        prioridad,
        CASE prioridad
            WHEN 1 THEN 'En curso'::text
            ELSE 'Próxima'::text
        END AS "ESTADO_SESION"
    FROM sesiones_hoy
)
SELECT * FROM seleccionar_primera

UNION ALL

-- Grupos sin sesión hoy ni futura
SELECT 
    g."ID_GRUPO",
    NULL::integer AS "ID_SESION",
    NULL::date AS "FECHA",
    NULL::time AS "HORA_INICIO",
    NULL::time AS "HORA_FIN",
    3 AS prioridad,
    'Sin más clases'::text AS "ESTADO_SESION"
FROM "GRUPOS" g
WHERE g."ACTIVO" = TRUE
  AND g."ID_GRUPO" NOT IN (
      SELECT "ID_GRUPO" FROM seleccionar_primera
  )

ORDER BY "ID_GRUPO";
