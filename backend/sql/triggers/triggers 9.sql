-- ============================================
-- TRIGGERS: Anuncios
-- ============================================

-- Validar que FECHA_FIN no sea anterior a FECHA_INICIO
CREATE OR REPLACE FUNCTION fn_validar_fechas_anuncio()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW."FECHA_FIN" IS NOT NULL AND NEW."FECHA_FIN" < NEW."FECHA_INICIO" THEN
        RAISE EXCEPTION 'La fecha de fin no puede ser anterior a la fecha de inicio';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validar_fechas_anuncio ON "ANUNCIOS";
CREATE TRIGGER trg_validar_fechas_anuncio
BEFORE INSERT OR UPDATE ON "ANUNCIOS"
FOR EACH ROW
EXECUTE FUNCTION fn_validar_fechas_anuncio();

-- Validar que los IDs dentro de los arrays existan en sus tablas maestras
CREATE OR REPLACE FUNCTION fn_validar_fks_anuncios()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW."ID_ROLES" <> '{}' THEN
        IF EXISTS (
            SELECT 1 FROM UNNEST(NEW."ID_ROLES") AS x(id)
            LEFT JOIN "ROLES" r ON r."ID_ROL" = x.id
            WHERE r."ID_ROL" IS NULL
        ) THEN
            RAISE EXCEPTION 'Existen roles inválidos en el anuncio';
        END IF;
    END IF;

    IF NEW."ID_PERIODOS" <> '{}' THEN
        IF EXISTS (
            SELECT 1 FROM UNNEST(NEW."ID_PERIODOS") AS x(id)
            LEFT JOIN "PERIODOS" p ON p."ID_PERIODO" = x.id
            WHERE p."ID_PERIODO" IS NULL
        ) THEN
            RAISE EXCEPTION 'Existen periodos inválidos en el anuncio';
        END IF;
    END IF;

    IF NEW."ID_SEDES" <> '{}' THEN
        IF EXISTS (
            SELECT 1 FROM UNNEST(NEW."ID_SEDES") AS x(id)
            LEFT JOIN "SEDES" s ON s."ID_SEDE" = x.id
            WHERE s."ID_SEDE" IS NULL
        ) THEN
            RAISE EXCEPTION 'Existen sedes inválidas en el anuncio';
        END IF;
    END IF;

    IF NEW."ID_GRUPOS" <> '{}' THEN
        IF EXISTS (
            SELECT 1 FROM UNNEST(NEW."ID_GRUPOS") AS x(id)
            LEFT JOIN "GRUPOS" g ON g."ID_GRUPO" = x.id
            WHERE g."ID_GRUPO" IS NULL
        ) THEN
            RAISE EXCEPTION 'Existen grupos inválidos en el anuncio';
        END IF;
    END IF;

    IF NEW."ID_AREAS" <> '{}' THEN
        IF EXISTS (
            SELECT 1 FROM UNNEST(NEW."ID_AREAS") AS x(id)
            LEFT JOIN "AREAS" ar ON ar."ID_AREA" = x.id
            WHERE ar."ID_AREA" IS NULL
        ) THEN
            RAISE EXCEPTION 'Existen áreas inválidas en el anuncio';
        END IF;
    END IF;

    IF NEW."ID_CARRERAS" <> '{}' THEN
        IF EXISTS (
            SELECT 1 FROM UNNEST(NEW."ID_CARRERAS") AS x(id)
            LEFT JOIN "CARRERAS" c ON c."ID_CARRERA" = x.id
            WHERE c."ID_CARRERA" IS NULL
        ) THEN
            RAISE EXCEPTION 'Existen carreras inválidas en el anuncio';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validar_fks_anuncios ON "ANUNCIOS";
CREATE TRIGGER trg_validar_fks_anuncios
BEFORE INSERT OR UPDATE ON "ANUNCIOS"
FOR EACH ROW
EXECUTE FUNCTION fn_validar_fks_anuncios();
