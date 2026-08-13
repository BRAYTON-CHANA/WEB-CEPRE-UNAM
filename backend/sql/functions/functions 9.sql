-- ============================================
-- FUNCIONES: Anuncios
-- ============================================

DROP FUNCTION IF EXISTS fn_anuncios_para_usuario(INTEGER);

CREATE OR REPLACE FUNCTION fn_anuncios_para_usuario(p_id_usuario INTEGER)
RETURNS TABLE (
    id_anuncio INTEGER,
    titulo VARCHAR,
    contenido TEXT,
    fecha_publicacion TIMESTAMP,
    fecha_inicio TIMESTAMP,
    fecha_fin TIMESTAMP,
    activo BOOLEAN,
    es_global BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH usuario_datos AS (
        SELECT
            u."ID_ROLES" AS v_roles,
            (
                SELECT array_agg(DISTINCT p."ID_PERIODO") FILTER (WHERE p."ID_PERIODO" IS NOT NULL)
                FROM "POSTULANTES" p
                WHERE p."ID_USUARIO" = p_id_usuario
            ) AS v_periodos,
            (
                SELECT array_agg(DISTINCT p."ID_SEDE") FILTER (WHERE p."ID_SEDE" IS NOT NULL)
                FROM "POSTULANTES" p
                WHERE p."ID_USUARIO" = p_id_usuario
            ) AS v_sedes,
            (
                SELECT array_agg(DISTINCT p."ID_GRUPO") FILTER (WHERE p."ID_GRUPO" IS NOT NULL)
                FROM "POSTULANTES" p
                WHERE p."ID_USUARIO" = p_id_usuario
            ) AS v_grupos,
            (
                SELECT array_agg(DISTINCT g."ID_AREA") FILTER (WHERE g."ID_AREA" IS NOT NULL)
                FROM "POSTULANTES" p
                JOIN "GRUPOS" g ON g."ID_GRUPO" = p."ID_GRUPO"
                WHERE p."ID_USUARIO" = p_id_usuario
            ) AS v_areas,
            (
                SELECT array_agg(DISTINCT p."ID_CARRERA") FILTER (WHERE p."ID_CARRERA" IS NOT NULL)
                FROM "POSTULANTES" p
                WHERE p."ID_USUARIO" = p_id_usuario
            ) AS v_carreras
        FROM "USUARIOS" u
        WHERE u."ID_USUARIO" = p_id_usuario
    )
    SELECT
        a."ID_ANUNCIO"::INTEGER,
        a."TITULO"::VARCHAR,
        a."CONTENIDO"::TEXT,
        a."FECHA_PUBLICACION",
        a."FECHA_INICIO",
        a."FECHA_FIN",
        a."ACTIVO",
        a."ES_GLOBAL"
    FROM "ANUNCIOS" a
    CROSS JOIN usuario_datos ud
    WHERE a."ACTIVO" = TRUE
      AND a."FECHA_INICIO" <= NOW()
      AND (a."FECHA_FIN" IS NULL OR a."FECHA_FIN" >= NOW())
      AND (
            a."ES_GLOBAL" = TRUE
            OR (
                (a."ID_ROLES" = '{}'     OR a."ID_ROLES"     && ud.v_roles)
                AND (a."ID_PERIODOS" = '{}'  OR a."ID_PERIODOS"  && COALESCE(ud.v_periodos, '{}'))
                AND (a."ID_SEDES" = '{}'     OR a."ID_SEDES"     && COALESCE(ud.v_sedes, '{}'))
                AND (a."ID_GRUPOS" = '{}'    OR a."ID_GRUPOS"    && COALESCE(ud.v_grupos, '{}'))
                AND (a."ID_AREAS" = '{}'     OR a."ID_AREAS"     && COALESCE(ud.v_areas, '{}'))
                AND (a."ID_CARRERAS" = '{}'  OR a."ID_CARRERAS"  && COALESCE(ud.v_carreras, '{}'))
            )
      )
    ORDER BY a."FECHA_PUBLICACION" DESC;
END;
$$ LANGUAGE plpgsql;
