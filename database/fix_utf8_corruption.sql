-- ============================================
-- FIX: Reparar caracteres UTF-8 corruptos en ESTUDIANTES
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. Función para limpiar caracteres corruptos
-- El patrón común es:  (U+FFFD, replacement character) seguido de un byte residual
-- cuando UTF-8 se interpreta como Latin1 o viceversa

CREATE OR REPLACE FUNCTION fn_reparar_utf8(texto TEXT)
RETURNS TEXT AS $$
DECLARE
    resultado TEXT;
BEGIN
    IF texto IS NULL THEN RETURN NULL; END IF;
    
    resultado := texto;
    
    -- Reemplazar patrones corruptos comunes
    -- Estos patrones aparecen cuando UTF-8 correcto se lee como Latin1
    -- o cuando hay doble-encoding/decoding
    
    -- Patrón específico: + Ñ (indica Ñ corrupta)
    resultado := REPLACE(resultado, 'Ñ', 'Ñ');
    resultado := REPLACE(resultado, '', 'Ñ');
    
    -- Patrón específico: + ñ (indica ñ corrupta)
    resultado := REPLACE(resultado, 'ñ', 'ñ');
    
    -- Caracteres acentuados comunes
    resultado := REPLACE(resultado, '', 'Á');
    resultado := REPLACE(resultado, '', 'á');
    resultado := REPLACE(resultado, '', 'É');
    resultado := REPLACE(resultado, '', 'é');
    resultado := REPLACE(resultado, '', 'Í');
    resultado := REPLACE(resultado, '', 'í');
    resultado := REPLACE(resultado, '', 'Ó');
    resultado := REPLACE(resultado, '', 'ó');
    resultado := REPLACE(resultado, '', 'Ú');
    resultado := REPLACE(resultado, '', 'ú');
    resultado := REPLACE(resultado, '', 'Ü');
    resultado := REPLACE(resultado, '', 'ü');
    
    -- Eliminar cualquier remanente (carácter de reemplazo Unicode)
    resultado := REPLACE(resultado, U&'\FFFD', '');
    
    RETURN resultado;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Diagnóstico previo - ver qué registros están corruptos
SELECT 'Registros corruptos encontrados:' as info, COUNT(*) as total
FROM "ESTUDIANTES"
WHERE "NOMBRES" LIKE '%' || U&'\FFFD' || '%' 
   OR "APELLIDOS" LIKE '%' || U&'\FFFD' || '%'
   OR "NOMBRES" LIKE '%Ñ%' 
   OR "APELLIDOS" LIKE '%Ñ%';

-- 3. Ver muestras de nombres corruptos antes de reparar
SELECT "ID_ESTUDIANTE", "NOMBRES", "APELLIDOS"
FROM "ESTUDIANTES"
WHERE "APELLIDOS" LIKE '%' || U&'\FFFD' || '%'
   OR "NOMBRES" LIKE '%' || U&'\FFFD' || '%'
LIMIT 10;

-- 4. REPARAR: Actualizar todos los registros
UPDATE "ESTUDIANTES"
SET "NOMBRES" = TRIM(UPPER(fn_reparar_utf8("NOMBRES"))),
    "APELLIDOS" = TRIM(UPPER(fn_reparar_utf8("APELLIDOS")))
WHERE "NOMBRES" LIKE '%' || U&'\FFFD' || '%' 
   OR "APELLIDOS" LIKE '%' || U&'\FFFD' || '%'
   OR "NOMBRES" LIKE '%Ñ%'
   OR "APELLIDOS" LIKE '%Ñ%';

-- 5. Verificación post-reparación
SELECT 'Registros corruptos restantes:' as info, COUNT(*) as total
FROM "ESTUDIANTES"
WHERE "NOMBRES" LIKE '%' || U&'\FFFD' || '%' 
   OR "APELLIDOS" LIKE '%' || U&'\FFFD' || '%';

-- ============================================
-- PREVENCIÓN: Trigger para evitar futuros inserts corruptos
-- ============================================

CREATE OR REPLACE FUNCTION fn_trg_limpiar_utf8_estudiantes()
RETURNS TRIGGER AS $$
BEGIN
    NEW."NOMBRES" := TRIM(UPPER(fn_reparar_utf8(NEW."NOMBRES")));
    NEW."APELLIDOS" := TRIM(UPPER(fn_reparar_utf8(NEW."APELLIDOS")));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger si existe
DROP TRIGGER IF EXISTS trg_limpiar_utf8_estudiantes ON "ESTUDIANTES";

-- Crear trigger
CREATE TRIGGER trg_limpiar_utf8_estudiantes
    BEFORE INSERT OR UPDATE ON "ESTUDIANTES"
    FOR EACH ROW
    EXECUTE FUNCTION fn_trg_limpiar_utf8_estudiantes();

-- Verificar que el trigger está activo
SELECT tgname as trigger_name, tgrelid::regclass as table_name, tgenabled as enabled
FROM pg_trigger
WHERE tgname = 'trg_limpiar_utf8_estudiantes';

-- ============================================
-- LIMPIEZA (opcional - después de confirmar que todo funciona)
-- ============================================
-- DROP FUNCTION IF EXISTS fn_reparar_utf8(TEXT);
