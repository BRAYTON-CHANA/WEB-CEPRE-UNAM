-- backend/sql/clean.sql
-- ADVERTENCIA: este script borra TODO el contenido del esquema `public`:
-- tablas, vistas, vistas materializadas, triggers, funciones y secuencias.
-- No vacía los buckets de Supabase Storage; hacerlo manualmente si se requiere.
-- No afecta a otros esquemas del sistema (auth, storage.*, etc.) ni a las extensiones.
-- Usar solo en desarrollo o cuando se quiera dejar la base de datos en blanco.

DO $$
DECLARE
    r RECORD;
BEGIN
    -- 1. Vistas materializadas
    FOR r IN
        SELECT matviewname
        FROM pg_matviews
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP MATERIALIZED VIEW IF EXISTS public.%I CASCADE;', r.matviewname);
    END LOOP;

    -- 2. Vistas normales
    FOR r IN
        SELECT viewname
        FROM pg_views
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP VIEW IF EXISTS public.%I CASCADE;', r.viewname);
    END LOOP;

    -- 3. Triggers definidos por el usuario
    FOR r IN
        SELECT t.tgname, c.relname
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public'
          AND NOT t.tgisinternal
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I CASCADE;', r.tgname, r.relname);
    END LOOP;

    -- 4. Tablas
    FOR r IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE;', r.tablename);
    END LOOP;

    -- 5. Funciones (excluyendo las que pertenecen a extensiones instaladas)
    FOR r IN
        SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        LEFT JOIN pg_depend d ON d.objid = p.oid AND d.deptype = 'e'
        WHERE n.nspname = 'public'
          AND p.prokind = 'f'
          AND d.objid IS NULL
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE;', r.proname, r.args);
    END LOOP;

    -- 6. Secuencias
    FOR r IN
        SELECT sequencename
        FROM pg_sequences
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP SEQUENCE IF EXISTS public.%I CASCADE;', r.sequencename);
    END LOOP;

    -- 7. Supabase Storage
    -- Este script no vacía los buckets. Si se desea limpiar Storage,
    -- hacerlo desde el dashboard de Supabase o con la Storage API.
END $$;
