-- ============================================
-- FUNCIÓN: fn_grupo_carrera
-- Retorna las carreras disponibles según el área de un grupo
-- ============================================

CREATE OR REPLACE FUNCTION fn_grupo_carrera(p_id_grupo INTEGER DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_id_area INTEGER;
    v_carreras JSONB;
BEGIN
    -- Si no se proporciona grupo, retornar array vacío
    IF p_id_grupo IS NULL THEN
        RETURN '[]'::JSONB;
    END IF;

    -- Obtener el área del grupo
    SELECT "ID_AREA" INTO v_id_area
    FROM "GRUPOS"
    WHERE "ID_GRUPO" = p_id_grupo;

    -- Si no existe el grupo, retornar array vacío
    IF v_id_area IS NULL THEN
        RETURN '[]'::JSONB;
    END IF;

    -- Obtener las carreras del área como JSONB (incluyendo sede)
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'ID_CARRERA', c."ID_CARRERA",
                'NOMBRE_CARRERA', c."NOMBRE_CARRERA",
                'NOMBRE_SEDE', s."NOMBRE_SEDE"
            ) ORDER BY c."NOMBRE_CARRERA"
        ),
        '[]'::JSONB
    ) INTO v_carreras
    FROM "CARRERAS" c
    JOIN "SEDES" s ON s."ID_SEDE" = c."ID_SEDE"
    WHERE c."ID_AREA" = v_id_area
      AND c."ACTIVO" = TRUE;

    RETURN v_carreras;
END;
$$;

-- ============================================
-- Ejemplo de uso:
-- SELECT fn_grupo_carrera(1);
-- ============================================
