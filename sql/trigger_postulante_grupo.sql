-- ============================================
-- FUNCIÓN: fn_sync_asistencias_postulante
-- Sincroniza ASISTENCIAS_POSTULANTE cuando
-- cambia ID_GRUPO en POSTULANTES
-- ============================================

CREATE OR REPLACE FUNCTION fn_sync_asistencias_postulante()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_id_periodo_grupo INTEGER;
    v_id_sede_grupo    INTEGER;
BEGIN
    -- Sin cambio real en UPDATE → no hacer nada (en INSERT, OLD es NULL)
    IF TG_OP = 'UPDATE' AND NEW."ID_GRUPO" IS NOT DISTINCT FROM OLD."ID_GRUPO" THEN
        RETURN NEW;
    END IF;

    -- ── REMOCIÓN (grupo → NULL) ──────────────────────────────────────────────
    -- Las asistencias del grupo anterior se borran vía DELETE CASCADE
    -- desde la FK en ASISTENCIAS_POSTULANTE → SESIONES_AGRUPADAS.
    -- No se necesita lógica extra aquí.

    -- ── CAMBIO A → B (grupo anterior → nuevo grupo) ─────────────────────────
    -- Borrar asistencias del grupo anterior antes de insertar las nuevas.
    IF OLD."ID_GRUPO" IS NOT NULL AND NEW."ID_GRUPO" IS NOT NULL THEN
        DELETE FROM "ASISTENCIAS_POSTULANTE" ap
        WHERE ap."ID_POSTULANTE" = NEW."ID_POSTULANTE"
          AND ap."ID_SESION" IN (
              SELECT sa."ID_SESION"
              FROM "SESIONES_AGRUPADAS" sa
              JOIN "GRUPO_PLAN_CURSO" gpc
                ON gpc."ID_GRUPO_PLAN_CURSO" = sa."ID_GRUPO_PLAN_CURSO"
              WHERE gpc."ID_GRUPO" = OLD."ID_GRUPO"
                AND sa."ACTIVO"    = TRUE
                AND gpc."ACTIVO"   = TRUE
          );
    END IF;

    -- ── ASIGNACIÓN (NULL → grupo  o  A → B) ─────────────────────────────────
    IF NEW."ID_GRUPO" IS NOT NULL THEN

        -- Obtener período y sede del nuevo grupo
        SELECT g."ID_PERIODO", g."ID_SEDE"
        INTO   v_id_periodo_grupo, v_id_sede_grupo
        FROM   "GRUPOS" g
        WHERE  g."ID_GRUPO" = NEW."ID_GRUPO";

        -- Validar período
        IF v_id_periodo_grupo IS DISTINCT FROM NEW."ID_PERIODO" THEN
            RAISE EXCEPTION
                'El grupo % pertenece al período % pero el postulante % es del período %',
                NEW."ID_GRUPO", v_id_periodo_grupo,
                NEW."ID_POSTULANTE", NEW."ID_PERIODO";
        END IF;

        -- Validar sede
        IF v_id_sede_grupo IS DISTINCT FROM NEW."ID_SEDE" THEN
            RAISE EXCEPTION
                'El grupo % pertenece a la sede % pero el postulante % es de la sede %',
                NEW."ID_GRUPO", v_id_sede_grupo,
                NEW."ID_POSTULANTE", NEW."ID_SEDE";
        END IF;

        -- Insertar una fila por cada sesión activa del nuevo grupo
        INSERT INTO "ASISTENCIAS_POSTULANTE" ("ID_POSTULANTE", "ID_SESION", "ASISTIO")
        SELECT
            NEW."ID_POSTULANTE",
            sa."ID_SESION",
            NULL
        FROM "SESIONES_AGRUPADAS" sa
        JOIN "GRUPO_PLAN_CURSO" gpc
            ON gpc."ID_GRUPO_PLAN_CURSO" = sa."ID_GRUPO_PLAN_CURSO"
        WHERE gpc."ID_GRUPO" = NEW."ID_GRUPO"
          AND sa."ACTIVO"    = TRUE
          AND gpc."ACTIVO"   = TRUE
        ON CONFLICT ("ID_POSTULANTE", "ID_SESION") DO NOTHING;

    END IF;

    RETURN NEW;
END;
$$;

-- ============================================
-- TRIGGER: trg_postulante_grupo_sync
-- ============================================

DROP TRIGGER IF EXISTS trg_postulante_grupo_sync ON "POSTULANTES";

CREATE TRIGGER trg_postulante_grupo_sync
AFTER UPDATE OF "ID_GRUPO" ON "POSTULANTES"
FOR EACH ROW
EXECUTE FUNCTION fn_sync_asistencias_postulante();

-- ============================================
-- TRIGGER: trg_postulante_grupo_sync_insert (para INSERT)
-- ============================================

DROP TRIGGER IF EXISTS trg_postulante_grupo_sync_insert ON "POSTULANTES";

CREATE TRIGGER trg_postulante_grupo_sync_insert
AFTER INSERT ON "POSTULANTES"
FOR EACH ROW
WHEN (NEW."ID_GRUPO" IS NOT NULL)
EXECUTE FUNCTION fn_sync_asistencias_postulante();


-- ============================================
-- FUNCIÓN EXTRA: fn_sync_nuevas_sesiones_a_postulantes
-- Cuando se añade una nueva SESION_AGRUPADA a un grupo,
-- genera asistencias para todos los postulantes ya asignados.
-- ============================================

CREATE OR REPLACE FUNCTION fn_sync_nuevas_sesiones_a_postulantes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Insertar una fila en ASISTENCIAS_POSTULANTE por cada postulante
    -- que tenga el grupo al que pertenece la nueva sesión
    INSERT INTO "ASISTENCIAS_POSTULANTE" ("ID_POSTULANTE", "ID_SESION", "ASISTIO")
    SELECT
        po."ID_POSTULANTE",
        NEW."ID_SESION",
        NULL
    FROM "GRUPO_PLAN_CURSO" gpc
    JOIN "POSTULANTES" po
        ON  po."ID_GRUPO"  = gpc."ID_GRUPO"
        AND po."ACTIVO"    = TRUE
    WHERE gpc."ID_GRUPO_PLAN_CURSO" = NEW."ID_GRUPO_PLAN_CURSO"
      AND gpc."ACTIVO" = TRUE
    ON CONFLICT ("ID_POSTULANTE", "ID_SESION") DO NOTHING;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_nueva_sesion_sync_postulantes ON "SESIONES_AGRUPADAS";

CREATE TRIGGER trg_nueva_sesion_sync_postulantes
AFTER INSERT ON "SESIONES_AGRUPADAS"
FOR EACH ROW
EXECUTE FUNCTION fn_sync_nuevas_sesiones_a_postulantes();

-- ============================================
-- FUNCIÓN: fn_cleanup_asistencias_postulante
-- Limpia asistencias cuando se elimina un postulante
-- ============================================

CREATE OR REPLACE FUNCTION fn_cleanup_asistencias_postulante()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Eliminar todas las asistencias del postulante
    DELETE FROM "ASISTENCIAS_POSTULANTE" WHERE "ID_POSTULANTE" = OLD."ID_POSTULANTE";
    RETURN OLD;
END;
$$;

-- ============================================
-- TRIGGER: trg_postulante_delete_cleanup
-- ============================================

DROP TRIGGER IF EXISTS trg_postulante_delete_cleanup ON "POSTULANTES";

CREATE TRIGGER trg_postulante_delete_cleanup
BEFORE DELETE ON "POSTULANTES"
FOR EACH ROW
EXECUTE FUNCTION fn_cleanup_asistencias_postulante();
