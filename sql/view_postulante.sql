-- ============================================
-- VIEW: VW_POSTULANTE
-- Combinación de POSTULANTES + ESTUDIANTES + CARRERAS
-- ============================================

DROP VIEW IF EXISTS "VW_POSTULANTE";

CREATE OR REPLACE VIEW "VW_POSTULANTE" AS
SELECT
    po."ID_POSTULANTE",
    po."ID_ESTUDIANTE",
    TRIM(UPPER(es."NOMBRES"))   AS "NOMBRES",
    TRIM(UPPER(es."APELLIDOS")) AS "APELLIDOS",
    po."ID_PERIODO",
    pe."NOMBRE_PERIODO",
    po."ID_SEDE",
    se."NOMBRE_SEDE",
    po."ID_GRUPO",
    gr."CODIGO_GRUPO",
    gr."NOMBRE_GRUPO",
    po."ID_CARRERA",
    ca."NOMBRE_CARRERA",
    po."ALUMNO_LIBRE",
    po."ACTIVO"
FROM "POSTULANTES"  po
JOIN "ESTUDIANTES"  es  ON es."ID_ESTUDIANTE" = po."ID_ESTUDIANTE"
JOIN "PERIODOS"     pe  ON pe."ID_PERIODO"    = po."ID_PERIODO"
JOIN "SEDES"        se  ON se."ID_SEDE"       = po."ID_SEDE"
LEFT JOIN "GRUPOS"  gr  ON gr."ID_GRUPO"      = po."ID_GRUPO"
LEFT JOIN "CARRERAS" ca ON ca."ID_CARRERA"    = po."ID_CARRERA";


-- ============================================
-- FUNCIÓN: fn_vw_postulante_insert
-- Upsert estudiante + insert postulante en una op
-- ============================================

CREATE OR REPLACE FUNCTION fn_vw_postulante_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_id_estudiante INTEGER;
    v_nombres       VARCHAR(100);
    v_apellidos     VARCHAR(100);
BEGIN
    -- Normalizar: TRIM + UPPER
    v_nombres   := TRIM(UPPER(NEW."NOMBRES"));
    v_apellidos := TRIM(UPPER(NEW."APELLIDOS"));

    IF v_nombres IS NULL OR v_nombres = '' THEN
        RAISE EXCEPTION 'NOMBRES es obligatorio';
    END IF;
    IF v_apellidos IS NULL OR v_apellidos = '' THEN
        RAISE EXCEPTION 'APELLIDOS es obligatorio';
    END IF;

    -- Buscar estudiante existente por nombre normalizado
    SELECT "ID_ESTUDIANTE"
    INTO   v_id_estudiante
    FROM   "ESTUDIANTES"
    WHERE  TRIM(UPPER("NOMBRES"))   = v_nombres
      AND  TRIM(UPPER("APELLIDOS")) = v_apellidos
    LIMIT 1;

    -- Si no existe → crear estudiante nuevo
    IF v_id_estudiante IS NULL THEN
        INSERT INTO "ESTUDIANTES" ("NOMBRES", "APELLIDOS")
        VALUES (v_nombres, v_apellidos)
        RETURNING "ID_ESTUDIANTE" INTO v_id_estudiante;
    END IF;

    -- Crear postulante
    INSERT INTO "POSTULANTES" (
        "ID_ESTUDIANTE",
        "ID_PERIODO",
        "ID_SEDE",
        "ID_GRUPO",
        "ID_CARRERA",
        "ALUMNO_LIBRE",
        "ACTIVO"
    ) VALUES (
        v_id_estudiante,
        NEW."ID_PERIODO",
        NEW."ID_SEDE",
        NEW."ID_GRUPO",
        NEW."ID_CARRERA",
        COALESCE(NEW."ALUMNO_LIBRE", FALSE),
        COALESCE(NEW."ACTIVO", TRUE)
    );

    RETURN NEW;
END;
$$;


-- ============================================
-- TRIGGER INSTEAD OF INSERT en VW_POSTULANTE
-- ============================================

DROP TRIGGER IF EXISTS trg_vw_postulante_insert ON "VW_POSTULANTE";

CREATE TRIGGER trg_vw_postulante_insert
INSTEAD OF INSERT ON "VW_POSTULANTE"
FOR EACH ROW
EXECUTE FUNCTION fn_vw_postulante_insert();


-- ============================================
-- FUNCIÓN: fn_vw_postulante_update
-- Actualizar postulante y/o estudiante
-- ============================================

CREATE OR REPLACE FUNCTION fn_vw_postulante_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_nombres       VARCHAR(100);
    v_apellidos     VARCHAR(100);
BEGIN
    -- Normalizar: TRIM + UPPER
    v_nombres   := TRIM(UPPER(NEW."NOMBRES"));
    v_apellidos := TRIM(UPPER(NEW."APELLIDOS"));

    IF v_nombres IS NULL OR v_nombres = '' THEN
        RAISE EXCEPTION 'NOMBRES es obligatorio';
    END IF;
    IF v_apellidos IS NULL OR v_apellidos = '' THEN
        RAISE EXCEPTION 'APELLIDOS es obligatorio';
    END IF;

    -- Actualizar estudiante
    UPDATE "ESTUDIANTES"
    SET "NOMBRES" = v_nombres,
        "APELLIDOS" = v_apellidos
    WHERE "ID_ESTUDIANTE" = OLD."ID_ESTUDIANTE";

    -- Actualizar postulante
    UPDATE "POSTULANTES"
    SET "ID_GRUPO" = NEW."ID_GRUPO",
        "ID_CARRERA" = NEW."ID_CARRERA",
        "ALUMNO_LIBRE" = COALESCE(NEW."ALUMNO_LIBRE", OLD."ALUMNO_LIBRE"),
        "ACTIVO" = COALESCE(NEW."ACTIVO", OLD."ACTIVO")
    WHERE "ID_POSTULANTE" = OLD."ID_POSTULANTE";

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vw_postulante_update ON "VW_POSTULANTE";

CREATE TRIGGER trg_vw_postulante_update
INSTEAD OF UPDATE ON "VW_POSTULANTE"
FOR EACH ROW
EXECUTE FUNCTION fn_vw_postulante_update();


-- ============================================
-- FUNCIÓN: fn_vw_postulante_delete
-- Eliminar postulante (el estudiante queda)
-- ============================================

CREATE OR REPLACE FUNCTION fn_vw_postulante_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Eliminar solo el postulante, no el estudiante
    DELETE FROM "POSTULANTES" WHERE "ID_POSTULANTE" = OLD."ID_POSTULANTE";
    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_vw_postulante_delete ON "VW_POSTULANTE";

CREATE TRIGGER trg_vw_postulante_delete
INSTEAD OF DELETE ON "VW_POSTULANTE"
FOR EACH ROW
EXECUTE FUNCTION fn_vw_postulante_delete();
