-- ============================================
-- MIGRACIÓN: Sesiones Agrupadas con Lógica Inteligente
-- CORREGIDO: fn_get_bloque_orden en todos los lugares donde se usaba ID
-- ============================================

-- ============================================
-- DROPS PREVIOS (evitar conflictos de tipos/triggers)
-- ============================================
DROP TRIGGER IF EXISTS trg_pg_sesiones_insert ON "PROGRAMACION_GRUPO";
DROP TRIGGER IF EXISTS trg_pg_sesiones_delete ON "PROGRAMACION_GRUPO";
DROP TRIGGER IF EXISTS trg_pg_sesiones_update ON "PROGRAMACION_GRUPO";

DROP FUNCTION IF EXISTS fn_trg_pg_sesiones_insert() CASCADE;
DROP FUNCTION IF EXISTS fn_trg_pg_sesiones_delete() CASCADE;
DROP FUNCTION IF EXISTS fn_trg_pg_sesiones_update() CASCADE;

DROP FUNCTION IF EXISTS fn_sesion_insert_inteligente(INTEGER, INTEGER, INTEGER, INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS fn_sesion_delete_inteligente(INTEGER, INTEGER, INTEGER, INTEGER) CASCADE;

DROP FUNCTION IF EXISTS fn_calcular_hora_bloque(INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS fn_calcular_horas_sesion(INTEGER, JSONB) CASCADE;
DROP FUNCTION IF EXISTS fn_contar_elementos_sesion(JSONB) CASCADE;
DROP FUNCTION IF EXISTS fn_obtener_breaks_entre_bloques(INTEGER, INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS fn_get_bloque_orden(INTEGER) CASCADE;

-- ============================================
-- FUNCIÓN AUXILIAR: Calcular hora de inicio desde jornada
-- ============================================
CREATE OR REPLACE FUNCTION fn_calcular_hora_bloque(
    p_id_horario INTEGER,
    p_orden INTEGER
)
RETURNS TIME LANGUAGE plpgsql STABLE AS $$
DECLARE
    v_hora_inicio TIME;
    v_minutos_acum INTEGER;
BEGIN
    SELECT "HORA_INICIO_JORNADA" INTO v_hora_inicio
    FROM "HORARIOS" WHERE "ID_HORARIO" = p_id_horario;
    
    SELECT COALESCE(SUM("DURACION"), 0) INTO v_minutos_acum
    FROM "HORARIO_BLOQUES"
    WHERE "ID_HORARIO" = p_id_horario
    AND "ORDEN" < p_orden;
    
    RETURN v_hora_inicio + (v_minutos_acum || ' minutes')::INTERVAL;
END;
$$;

-- ============================================
-- FUNCIÓN AUXILIAR: Contar elementos de una sesión
-- ============================================
CREATE OR REPLACE FUNCTION fn_contar_elementos_sesion(
    p_bloques_json JSONB
)
RETURNS TABLE (
    bloques_clase INTEGER,
    breaks INTEGER,
    duracion_total INTEGER
) LANGUAGE plpgsql STABLE AS $$
DECLARE
    v_bloques INTEGER := 0;
    v_breaks INTEGER := 0;
    v_duracion INTEGER := 0;
    v_elem JSONB;
BEGIN
    FOR v_elem IN SELECT jsonb_array_elements(p_bloques_json)
    LOOP
        v_duracion := v_duracion + (v_elem->>'duracion')::INTEGER;
        IF v_elem->>'tipo' = 'clase' THEN
            v_bloques := v_bloques + 1;
        ELSE
            v_breaks := v_breaks + 1;
        END IF;
    END LOOP;
    
    RETURN QUERY SELECT v_bloques, v_breaks, v_duracion;
END;
$$;

-- ============================================
-- FUNCIÓN AUXILIAR: Obtener breaks entre dos bloques
-- ============================================
CREATE OR REPLACE FUNCTION fn_obtener_breaks_entre_bloques(
    p_id_horario INTEGER,
    p_orden_inicio INTEGER,
    p_orden_fin INTEGER
)
RETURNS JSONB LANGUAGE plpgsql STABLE AS $$
DECLARE
    v_breaks JSONB := '[]'::JSONB;
    v_break RECORD;
BEGIN
    FOR v_break IN
        SELECT "ID_BLOQUE", "DURACION"
        FROM "HORARIO_BLOQUES"
        WHERE "ID_HORARIO" = p_id_horario
        AND "ORDEN" > p_orden_inicio
        AND "ORDEN" < p_orden_fin
        AND "TIPO_BLOQUE" = 'break'
        ORDER BY "ORDEN"
    LOOP
        v_breaks := v_breaks || jsonb_build_object(
            'id', v_break."ID_BLOQUE",
            'tipo', 'break',
            'duracion', v_break."DURACION"
        );
    END LOOP;
    
    RETURN v_breaks;
END;
$$;

-- ============================================
-- FUNCIÓN AUXILIAR: Obtener orden de un bloque
-- ============================================
CREATE OR REPLACE FUNCTION fn_get_bloque_orden(p_id_bloque INTEGER)
RETURNS INTEGER LANGUAGE plpgsql STABLE AS $$
BEGIN
    RETURN (SELECT "ORDEN" FROM "HORARIO_BLOQUES" WHERE "ID_BLOQUE" = p_id_bloque);
END;
$$;

-- ============================================
-- FUNCIÓN AUXILIAR: Calcular HORA_INICIO y HORA_FIN desde bloques combinados
-- Toma el bloque clase con menor ORDEN para HORA_INICIO
-- Toma el bloque clase con mayor ORDEN + su duracion para HORA_FIN
-- ============================================
CREATE OR REPLACE FUNCTION fn_calcular_horas_sesion(
    p_id_horario INTEGER,
    p_bloques_json JSONB
)
RETURNS TABLE (hora_inicio TIME, hora_fin TIME) LANGUAGE plpgsql STABLE AS $$
DECLARE
    v_orden_min INTEGER;
    v_orden_max INTEGER;
    v_duracion_max INTEGER;
    v_hora_inicio TIME;
    v_minutos_ini INTEGER;
    v_minutos_fin INTEGER;
BEGIN
    -- Obtener el menor y mayor ORDEN de bloques tipo clase
    SELECT
        MIN(fn_get_bloque_orden((elem->>'id')::INTEGER)),
        MAX(fn_get_bloque_orden((elem->>'id')::INTEGER))
    INTO v_orden_min, v_orden_max
    FROM jsonb_array_elements(p_bloques_json) elem
    WHERE elem->>'tipo' = 'clase';
    
    -- Duración del bloque con mayor orden (para calcular HORA_FIN)
    SELECT HB."DURACION" INTO v_duracion_max
    FROM "HORARIO_BLOQUES" HB
    WHERE HB."ID_HORARIO" = p_id_horario AND HB."ORDEN" = v_orden_max;
    
    -- Hora inicio jornada
    SELECT H."HORA_INICIO_JORNADA" INTO v_hora_inicio
    FROM "HORARIOS" H WHERE H."ID_HORARIO" = p_id_horario;
    
    -- Minutos acumulados antes del bloque mínimo
    SELECT COALESCE(SUM(HB."DURACION"), 0) INTO v_minutos_ini
    FROM "HORARIO_BLOQUES" HB
    WHERE HB."ID_HORARIO" = p_id_horario AND HB."ORDEN" < v_orden_min;
    
    -- Minutos acumulados hasta el fin del bloque máximo
    SELECT COALESCE(SUM(HB."DURACION"), 0) INTO v_minutos_fin
    FROM "HORARIO_BLOQUES" HB
    WHERE HB."ID_HORARIO" = p_id_horario AND HB."ORDEN" <= v_orden_max;
    
    RETURN QUERY SELECT
        v_hora_inicio + (v_minutos_ini || ' minutes')::INTERVAL,
        v_hora_inicio + (v_minutos_fin || ' minutes')::INTERVAL;
END;
$$;

-- ============================================
-- FUNCIÓN PRINCIPAL: INSERT inteligente de sesión
-- ============================================
CREATE OR REPLACE FUNCTION fn_sesion_insert_inteligente(
    p_id_grupo INTEGER,
    p_dia_idx INTEGER,
    p_id_bloque INTEGER,
    p_id_gpc INTEGER,
    p_id_programacion INTEGER
)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
    v_fechas_col JSONB;
    v_fecha_item JSONB;
    v_fecha_date DATE;
    v_lock_id BIGINT;
    v_grupo_info RECORD;
    
    v_orden_nuevo INTEGER;
    v_duracion_nuevo INTEGER;
    
    v_sesion_arriba RECORD;
    v_sesion_abajo RECORD;
    
    v_count_arriba RECORD;
    v_count_abajo RECORD;
    v_count_total_arriba INTEGER;
    v_count_total_abajo INTEGER;
    
    v_breaks_entre JSONB;
    v_breaks_entre2 JSONB;
    v_nuevos_bloques JSONB;
    v_nuevos_progs INTEGER[];
    v_nueva_hora_ini TIME;
    v_nueva_hora_fin TIME;
    v_nueva_duracion INTEGER;
BEGIN
    v_lock_id := (p_id_gpc::BIGINT * 1000) + p_dia_idx;
    PERFORM pg_advisory_xact_lock(v_lock_id);
    
    RAISE NOTICE '[DEBUG] INICIO: grupo=%, dia_idx=%, bloque_id=%, gpc=%, prog=%', 
        p_id_grupo, p_dia_idx, p_id_bloque, p_id_gpc, p_id_programacion;
    
    SELECT H."ID_HORARIO", H."HORA_INICIO_JORNADA"
    INTO v_grupo_info
    FROM "GRUPOS" G
    JOIN "TURNOS" T ON T."ID_TURNO" = G."ID_TURNO"
    JOIN "HORARIOS" H ON H."ID_HORARIO" = T."ID_HORARIO"
    WHERE G."ID_GRUPO" = p_id_grupo;
    
    RAISE NOTICE '[DEBUG] Grupo info: horario=%, hora_inicio_jornada=%', 
        v_grupo_info."ID_HORARIO", v_grupo_info."HORA_INICIO_JORNADA";
    
    SELECT "ORDEN", "DURACION" INTO v_orden_nuevo, v_duracion_nuevo
    FROM "HORARIO_BLOQUES" WHERE "ID_BLOQUE" = p_id_bloque;
    
    RAISE NOTICE '[DEBUG] Bloque nuevo: id=%, orden=%, duracion=%', 
        p_id_bloque, v_orden_nuevo, v_duracion_nuevo;
    
    v_fechas_col := fn_calcular_fechas_matriz(p_id_grupo);
    
    FOR v_fecha_item IN 
        SELECT value FROM jsonb_array_elements(v_fechas_col)
        WHERE (value->>'dia_idx')::INTEGER = p_dia_idx
    LOOP
        v_fecha_date := (v_fecha_item->>'fecha')::DATE;
        
        -- IMPORTANTE: Limpiar variables para cada fecha (evitar persistencia entre loops)
        v_sesion_arriba := NULL;
        v_sesion_abajo := NULL;
        
        -- Buscar sesión ARRIBA (bloque clase más cercano con ORDEN < v_orden_nuevo,
        -- sin bloques clase vacíos entre esa sesión y el nuevo bloque)
        SELECT S.*, HB."ORDEN" as bloque_orden, HB."DURACION" as bloque_duracion
        INTO v_sesion_arriba
        FROM "SESIONES_AGRUPADAS" S
        CROSS JOIN LATERAL jsonb_array_elements(S."IDS_BLOQUES") AS bloque
        JOIN "HORARIO_BLOQUES" HB ON HB."ID_BLOQUE" = (bloque->>'id')::INTEGER
        WHERE S."ID_GRUPO_PLAN_CURSO" = p_id_gpc
        AND S."FECHA" = v_fecha_date
        AND S."ACTIVO" = TRUE
        AND HB."ORDEN" < v_orden_nuevo
        AND bloque->>'tipo' = 'clase'
        -- No debe haber ningún bloque clase libre entre esta sesión y el nuevo bloque
        AND NOT EXISTS (
            SELECT 1 FROM "HORARIO_BLOQUES" HB2
            WHERE HB2."ID_HORARIO" = v_grupo_info."ID_HORARIO"
            AND HB2."TIPO_BLOQUE" = 'clase'
            AND HB2."ORDEN" > HB."ORDEN"
            AND HB2."ORDEN" < v_orden_nuevo
            AND NOT EXISTS (
                SELECT 1 FROM "SESIONES_AGRUPADAS" S2
                CROSS JOIN LATERAL jsonb_array_elements(S2."IDS_BLOQUES") b2
                WHERE S2."ID_GRUPO_PLAN_CURSO" = p_id_gpc
                AND S2."FECHA" = v_fecha_date
                AND S2."ACTIVO" = TRUE
                AND (b2->>'id')::INTEGER = HB2."ID_BLOQUE"
            )
            AND NOT EXISTS (
                SELECT 1 FROM "PROGRAMACION_GRUPO" PG
                WHERE PG."ID_GRUPO_PLAN_CURSO" = p_id_gpc
                AND PG."ID_BLOQUE" = HB2."ID_BLOQUE"
            )
        )
        ORDER BY HB."ORDEN" DESC
        LIMIT 1;
        
        -- Buscar sesión ABAJO (bloque clase más cercano con ORDEN > v_orden_nuevo,
        -- sin bloques clase vacíos entre el nuevo bloque y esa sesión)
        SELECT S.*, HB."ORDEN" as bloque_orden, HB."DURACION" as bloque_duracion
        INTO v_sesion_abajo
        FROM "SESIONES_AGRUPADAS" S
        CROSS JOIN LATERAL jsonb_array_elements(S."IDS_BLOQUES") AS bloque
        JOIN "HORARIO_BLOQUES" HB ON HB."ID_BLOQUE" = (bloque->>'id')::INTEGER
        WHERE S."ID_GRUPO_PLAN_CURSO" = p_id_gpc
        AND S."FECHA" = v_fecha_date
        AND S."ACTIVO" = TRUE
        AND HB."ORDEN" > v_orden_nuevo
        AND bloque->>'tipo' = 'clase'
        -- No debe haber ningún bloque clase libre entre el nuevo bloque y esta sesión
        AND NOT EXISTS (
            SELECT 1 FROM "HORARIO_BLOQUES" HB2
            WHERE HB2."ID_HORARIO" = v_grupo_info."ID_HORARIO"
            AND HB2."TIPO_BLOQUE" = 'clase'
            AND HB2."ORDEN" > v_orden_nuevo
            AND HB2."ORDEN" < HB."ORDEN"
            AND NOT EXISTS (
                SELECT 1 FROM "SESIONES_AGRUPADAS" S2
                CROSS JOIN LATERAL jsonb_array_elements(S2."IDS_BLOQUES") b2
                WHERE S2."ID_GRUPO_PLAN_CURSO" = p_id_gpc
                AND S2."FECHA" = v_fecha_date
                AND S2."ACTIVO" = TRUE
                AND (b2->>'id')::INTEGER = HB2."ID_BLOQUE"
            )
            AND NOT EXISTS (
                SELECT 1 FROM "PROGRAMACION_GRUPO" PG
                WHERE PG."ID_GRUPO_PLAN_CURSO" = p_id_gpc
                AND PG."ID_BLOQUE" = HB2."ID_BLOQUE"
            )
        )
        ORDER BY HB."ORDEN" ASC
        LIMIT 1;
        
        -- CASO 1: Ni arriba ni abajo → CREAR NUEVA
        IF v_sesion_arriba."ID_SESION" IS NULL AND v_sesion_abajo."ID_SESION" IS NULL THEN
            v_nuevos_bloques := jsonb_build_array(jsonb_build_object(
                'id', p_id_bloque, 'tipo', 'clase', 'duracion', v_duracion_nuevo
            ));
            
            SELECT hora_inicio, hora_fin INTO v_nueva_hora_ini, v_nueva_hora_fin
            FROM fn_calcular_horas_sesion(v_grupo_info."ID_HORARIO", v_nuevos_bloques);
            
            INSERT INTO "SESIONES_AGRUPADAS" (
                "FECHA", "ID_GRUPO_PLAN_CURSO",
                "HORA_INICIO", "HORA_FIN", "DURACION_TOTAL_MINUTOS",
                "IDS_BLOQUES", "IDS_PROGRAMACION", "ESTADO", "ACTIVO"
            ) VALUES (
                v_fecha_date, p_id_gpc,
                v_nueva_hora_ini, v_nueva_hora_fin, v_duracion_nuevo,
                v_nuevos_bloques,
                ARRAY[p_id_programacion],
                'programado', TRUE
            );
            
            RAISE NOTICE '[INSERT] Nueva sesión creada para fecha %, bloque %', v_fecha_date, v_orden_nuevo;
            
        -- CASO 2: Solo arriba → EXTENDER ARRIBA
        ELSIF v_sesion_arriba."ID_SESION" IS NOT NULL AND v_sesion_abajo."ID_SESION" IS NULL THEN
            v_breaks_entre := fn_obtener_breaks_entre_bloques(
                v_grupo_info."ID_HORARIO",
                v_orden_nuevo,
                (SELECT MIN(fn_get_bloque_orden((elem->>'id')::INTEGER)) FROM jsonb_array_elements(v_sesion_arriba."IDS_BLOQUES") elem WHERE elem->>'tipo' = 'clase')
            );
            
            v_nuevos_bloques := jsonb_build_array(jsonb_build_object(
                'id', p_id_bloque, 'tipo', 'clase', 'duracion', v_duracion_nuevo
            )) || v_breaks_entre || v_sesion_arriba."IDS_BLOQUES";
            
            v_nuevos_progs := ARRAY[p_id_programacion] || v_sesion_arriba."IDS_PROGRAMACION";
            
            SELECT hora_inicio, hora_fin INTO v_nueva_hora_ini, v_nueva_hora_fin
            FROM fn_calcular_horas_sesion(v_grupo_info."ID_HORARIO", v_nuevos_bloques);
            
            SELECT duracion_total INTO v_nueva_duracion
            FROM fn_contar_elementos_sesion(v_nuevos_bloques);
            
            UPDATE "SESIONES_AGRUPADAS"
            SET "HORA_INICIO" = v_nueva_hora_ini,
                "HORA_FIN" = v_nueva_hora_fin,
                "DURACION_TOTAL_MINUTOS" = v_nueva_duracion,
                "IDS_BLOQUES" = v_nuevos_bloques,
                "IDS_PROGRAMACION" = v_nuevos_progs
            WHERE "ID_SESION" = v_sesion_arriba."ID_SESION";
            
            RAISE NOTICE '[INSERT] Sesión % extendida hacia arriba', v_sesion_arriba."ID_SESION";
            
        -- CASO 3: Solo abajo → EXTENDER ABAJO
        ELSIF v_sesion_arriba."ID_SESION" IS NULL AND v_sesion_abajo."ID_SESION" IS NOT NULL THEN
            v_breaks_entre := fn_obtener_breaks_entre_bloques(
                v_grupo_info."ID_HORARIO",
                (SELECT MAX(fn_get_bloque_orden((elem->>'id')::INTEGER)) FROM jsonb_array_elements(v_sesion_abajo."IDS_BLOQUES") elem WHERE elem->>'tipo' = 'clase'),
                v_orden_nuevo
            );
            
            v_nuevos_bloques := v_sesion_abajo."IDS_BLOQUES" || v_breaks_entre || jsonb_build_array(jsonb_build_object(
                'id', p_id_bloque, 'tipo', 'clase', 'duracion', v_duracion_nuevo
            ));
            
            v_nuevos_progs := v_sesion_abajo."IDS_PROGRAMACION" || ARRAY[p_id_programacion];
            
            SELECT hora_inicio, hora_fin INTO v_nueva_hora_ini, v_nueva_hora_fin
            FROM fn_calcular_horas_sesion(v_grupo_info."ID_HORARIO", v_nuevos_bloques);
            
            SELECT duracion_total INTO v_nueva_duracion
            FROM fn_contar_elementos_sesion(v_nuevos_bloques);
            
            UPDATE "SESIONES_AGRUPADAS"
            SET "HORA_INICIO" = v_nueva_hora_ini,
                "HORA_FIN" = v_nueva_hora_fin,
                "DURACION_TOTAL_MINUTOS" = v_nueva_duracion,
                "IDS_BLOQUES" = v_nuevos_bloques,
                "IDS_PROGRAMACION" = v_nuevos_progs
            WHERE "ID_SESION" = v_sesion_abajo."ID_SESION";
            
            RAISE NOTICE '[INSERT] Sesión % extendida hacia abajo', v_sesion_abajo."ID_SESION";
            
        -- CASO 4: Ambos → MERGE (sesion arriba + nuevo + sesion abajo)
        ELSE
            SELECT * INTO v_count_arriba FROM fn_contar_elementos_sesion(v_sesion_arriba."IDS_BLOQUES");
            SELECT * INTO v_count_abajo FROM fn_contar_elementos_sesion(v_sesion_abajo."IDS_BLOQUES");
            
            v_count_total_arriba := v_count_arriba.bloques_clase * 2 + v_count_arriba.breaks;
            v_count_total_abajo := v_count_abajo.bloques_clase * 2 + v_count_abajo.breaks;
            
            -- Breaks entre sesion arriba y nuevo bloque
            v_breaks_entre := fn_obtener_breaks_entre_bloques(
                v_grupo_info."ID_HORARIO",
                (SELECT MAX(fn_get_bloque_orden((elem->>'id')::INTEGER)) FROM jsonb_array_elements(v_sesion_arriba."IDS_BLOQUES") elem WHERE elem->>'tipo' = 'clase'),
                v_orden_nuevo
            );
            
            -- Breaks entre nuevo bloque y sesion abajo
            v_breaks_entre2 := fn_obtener_breaks_entre_bloques(
                v_grupo_info."ID_HORARIO",
                v_orden_nuevo,
                (SELECT MIN(fn_get_bloque_orden((elem->>'id')::INTEGER)) FROM jsonb_array_elements(v_sesion_abajo."IDS_BLOQUES") elem WHERE elem->>'tipo' = 'clase')
            );
            
            -- Sesion que gana conserva su ID
            IF v_count_total_arriba >= v_count_total_abajo THEN
                    v_nuevos_bloques := v_sesion_arriba."IDS_BLOQUES" || v_breaks_entre ||
                        jsonb_build_array(jsonb_build_object('id', p_id_bloque, 'tipo', 'clase', 'duracion', v_duracion_nuevo)) ||
                        v_breaks_entre2 || v_sesion_abajo."IDS_BLOQUES";
                    
                    v_nuevos_progs := v_sesion_arriba."IDS_PROGRAMACION" || ARRAY[p_id_programacion] || v_sesion_abajo."IDS_PROGRAMACION";
                    
                    SELECT hora_inicio, hora_fin INTO v_nueva_hora_ini, v_nueva_hora_fin
                    FROM fn_calcular_horas_sesion(v_grupo_info."ID_HORARIO", v_nuevos_bloques);
                    
                    SELECT duracion_total INTO v_nueva_duracion
                    FROM fn_contar_elementos_sesion(v_nuevos_bloques);
                    
                    UPDATE "SESIONES_AGRUPADAS"
                    SET "HORA_INICIO" = v_nueva_hora_ini,
                        "HORA_FIN" = v_nueva_hora_fin,
                        "DURACION_TOTAL_MINUTOS" = v_nueva_duracion,
                        "IDS_BLOQUES" = v_nuevos_bloques,
                        "IDS_PROGRAMACION" = v_nuevos_progs
                    WHERE "ID_SESION" = v_sesion_arriba."ID_SESION";
                    
                    DELETE FROM "SESIONES_AGRUPADAS" WHERE "ID_SESION" = v_sesion_abajo."ID_SESION";
                    
                    RAISE NOTICE '[INSERT] MERGE: Sesión % ganó, eliminada %', v_sesion_arriba."ID_SESION", v_sesion_abajo."ID_SESION";
                ELSE
                    v_nuevos_bloques := v_sesion_arriba."IDS_BLOQUES" || v_breaks_entre ||
                        jsonb_build_array(jsonb_build_object('id', p_id_bloque, 'tipo', 'clase', 'duracion', v_duracion_nuevo)) ||
                        v_breaks_entre2 || v_sesion_abajo."IDS_BLOQUES";
                    
                    v_nuevos_progs := v_sesion_arriba."IDS_PROGRAMACION" || ARRAY[p_id_programacion] || v_sesion_abajo."IDS_PROGRAMACION";
                    
                    SELECT hora_inicio, hora_fin INTO v_nueva_hora_ini, v_nueva_hora_fin
                    FROM fn_calcular_horas_sesion(v_grupo_info."ID_HORARIO", v_nuevos_bloques);
                    
                    SELECT duracion_total INTO v_nueva_duracion
                    FROM fn_contar_elementos_sesion(v_nuevos_bloques);
                    
                    UPDATE "SESIONES_AGRUPADAS"
                    SET "HORA_INICIO" = v_nueva_hora_ini,
                        "HORA_FIN" = v_nueva_hora_fin,
                        "DURACION_TOTAL_MINUTOS" = v_nueva_duracion,
                        "IDS_BLOQUES" = v_nuevos_bloques,
                        "IDS_PROGRAMACION" = v_nuevos_progs
                    WHERE "ID_SESION" = v_sesion_abajo."ID_SESION";
                    
                    DELETE FROM "SESIONES_AGRUPADAS" WHERE "ID_SESION" = v_sesion_arriba."ID_SESION";
                    
                    RAISE NOTICE '[INSERT] MERGE: Sesión % ganó, eliminada %', v_sesion_abajo."ID_SESION", v_sesion_arriba."ID_SESION";
            END IF;
        END IF;
    END LOOP;
    
    RAISE NOTICE '[INSERT] Completado para GPC=%, día=%, bloque=%', p_id_gpc, p_dia_idx, v_orden_nuevo;
    
EXCEPTION WHEN OTHERS THEN
    -- Capturar cualquier error y mostrar contexto completo
    RAISE EXCEPTION '[ERROR CRITICO] SQLSTATE=%, SQLERRM=% | Contexto: grupo=%, dia=%, bloque_id=%, orden=%, v_sesion_arriba.id=%, v_sesion_arriba.fin=%, v_sesion_abajo.id=%, v_sesion_abajo.fin=%, v_nueva_hora_ini=%, v_nueva_hora_fin=%',
        SQLSTATE, SQLERRM,
        p_id_grupo, p_dia_idx, p_id_bloque, v_orden_nuevo,
        v_sesion_arriba."ID_SESION", v_sesion_arriba."HORA_FIN",
        v_sesion_abajo."ID_SESION", v_sesion_abajo."HORA_FIN",
        v_nueva_hora_ini, v_nueva_hora_fin;
END;
$$;


-- ============================================
-- FUNCIÓN PRINCIPAL: DELETE inteligente de sesión
-- CORREGIDO: fn_get_bloque_orden en CASO 3 y CASO 4
-- ============================================
CREATE OR REPLACE FUNCTION fn_sesion_delete_inteligente(
    p_id_grupo INTEGER,
    p_dia_idx INTEGER,
    p_id_bloque INTEGER,
    p_id_gpc INTEGER
)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
    v_fechas_col JSONB;
    v_fecha_item JSONB;
    v_fecha_date DATE;
    v_lock_id BIGINT;
    v_grupo_info RECORD;
    
    v_orden_borrar INTEGER;
    v_duracion_borrar INTEGER;
    
    v_sesion RECORD;
    v_id_sesion INTEGER;
    
    v_bloques_antes JSONB := '[]'::JSONB;
    v_bloques_despues JSONB := '[]'::JSONB;
    v_progs_antes INTEGER[] := '{}'::INTEGER[];
    v_progs_despues INTEGER[] := '{}'::INTEGER[];
    v_elem JSONB;
    v_prog_id INTEGER;
    v_idx INTEGER := 0;
    v_encontrado BOOLEAN := FALSE;
    
    v_count_antes RECORD;
    v_count_despues RECORD;
    v_count_total_antes INTEGER;
    v_count_total_despues INTEGER;
    
    v_nueva_hora_ini TIME;
    v_nueva_hora_fin TIME;
    v_nueva_duracion INTEGER;
    v_breaks_entre JSONB;
BEGIN
    v_lock_id := (p_id_gpc::BIGINT * 1000) + p_dia_idx;
    PERFORM pg_advisory_xact_lock(v_lock_id);
    
    SELECT H."ID_HORARIO", H."HORA_INICIO_JORNADA"
    INTO v_grupo_info
    FROM "GRUPOS" G
    JOIN "TURNOS" T ON T."ID_TURNO" = G."ID_TURNO"
    JOIN "HORARIOS" H ON H."ID_HORARIO" = T."ID_HORARIO"
    WHERE G."ID_GRUPO" = p_id_grupo;
    
    SELECT "ORDEN", "DURACION" INTO v_orden_borrar, v_duracion_borrar
    FROM "HORARIO_BLOQUES" WHERE "ID_BLOQUE" = p_id_bloque;
    
    v_fechas_col := fn_calcular_fechas_matriz(p_id_grupo);
    
    FOR v_fecha_item IN 
        SELECT value FROM jsonb_array_elements(v_fechas_col)
        WHERE (value->>'dia_idx')::INTEGER = p_dia_idx
    LOOP
        v_fecha_date := (v_fecha_item->>'fecha')::DATE;
        
        SELECT S.* INTO v_sesion
        FROM "SESIONES_AGRUPADAS" S
        WHERE S."ID_GRUPO_PLAN_CURSO" = p_id_gpc
        AND S."FECHA" = v_fecha_date
        AND S."ACTIVO" = TRUE
        AND EXISTS (
            SELECT 1 FROM jsonb_array_elements(S."IDS_BLOQUES") elem
            WHERE (elem->>'id')::INTEGER = p_id_bloque
        );
        
        IF NOT FOUND THEN
            CONTINUE;
        END IF;
        
        v_id_sesion := v_sesion."ID_SESION";
        
        v_bloques_antes := '[]'::JSONB;
        v_bloques_despues := '[]'::JSONB;
        v_progs_antes := '{}'::INTEGER[];
        v_progs_despues := '{}'::INTEGER[];
        v_encontrado := FALSE;
        v_idx := 0;
        
        FOR v_elem IN SELECT jsonb_array_elements(v_sesion."IDS_BLOQUES")
        LOOP
            v_idx := v_idx + 1;
            v_prog_id := v_sesion."IDS_PROGRAMACION"[v_idx];
            
            IF (v_elem->>'id')::INTEGER = p_id_bloque THEN
                v_encontrado := TRUE;
            ELSIF NOT v_encontrado THEN
                v_bloques_antes := v_bloques_antes || v_elem;
                v_progs_antes := array_append(v_progs_antes, v_prog_id);
            ELSE
                v_bloques_despues := v_bloques_despues || v_elem;
                v_progs_despues := array_append(v_progs_despues, v_prog_id);
            END IF;
        END LOOP;
        
        -- CASO 1: No hay nada antes ni después
        IF jsonb_array_length(v_bloques_antes) = 0 AND jsonb_array_length(v_bloques_despues) = 0 THEN
            DELETE FROM "SESIONES_AGRUPADAS" WHERE "ID_SESION" = v_id_sesion;
            RAISE NOTICE '[DELETE] Sesión % eliminada completamente', v_id_sesion;
            
        -- CASO 2: Solo hay antes
        ELSIF jsonb_array_length(v_bloques_despues) = 0 THEN
            SELECT * INTO v_count_antes FROM fn_contar_elementos_sesion(v_bloques_antes);
            
            SELECT hora_inicio, hora_fin INTO v_nueva_hora_ini, v_nueva_hora_fin
            FROM fn_calcular_horas_sesion(v_grupo_info."ID_HORARIO", v_bloques_antes);
            
            UPDATE "SESIONES_AGRUPADAS"
            SET "HORA_INICIO" = v_nueva_hora_ini,
                "HORA_FIN" = v_nueva_hora_fin,
                "DURACION_TOTAL_MINUTOS" = v_count_antes.duracion_total,
                "IDS_BLOQUES" = v_bloques_antes,
                "IDS_PROGRAMACION" = v_progs_antes
            WHERE "ID_SESION" = v_id_sesion;
            
            RAISE NOTICE '[DELETE] Sesión % truncada (solo arriba queda)', v_id_sesion;
            
        -- CASO 3: Solo hay después
        ELSIF jsonb_array_length(v_bloques_antes) = 0 THEN
            SELECT * INTO v_count_despues FROM fn_contar_elementos_sesion(v_bloques_despues);
            
            SELECT hora_inicio, hora_fin INTO v_nueva_hora_ini, v_nueva_hora_fin
            FROM fn_calcular_horas_sesion(v_grupo_info."ID_HORARIO", v_bloques_despues);
            
            UPDATE "SESIONES_AGRUPADAS"
            SET "HORA_INICIO" = v_nueva_hora_ini,
                "HORA_FIN" = v_nueva_hora_fin,
                "DURACION_TOTAL_MINUTOS" = v_count_despues.duracion_total,
                "IDS_BLOQUES" = v_bloques_despues,
                "IDS_PROGRAMACION" = v_progs_despues
            WHERE "ID_SESION" = v_id_sesion;
            
            RAISE NOTICE '[DELETE] Sesión % truncada (solo abajo queda)', v_id_sesion;
            
        -- CASO 4: Hay ambos → SPLIT
        ELSE
            SELECT * INTO v_count_antes FROM fn_contar_elementos_sesion(v_bloques_antes);
            SELECT * INTO v_count_despues FROM fn_contar_elementos_sesion(v_bloques_despues);
            
            v_count_total_antes := v_count_antes.bloques_clase * 2 + v_count_antes.breaks;
            v_count_total_despues := v_count_despues.bloques_clase * 2 + v_count_despues.breaks;
            
            -- CORREGIDO: Usar fn_get_bloque_orden para obtener el ORDEN del bloque
            v_breaks_entre := fn_obtener_breaks_entre_bloques(
                v_grupo_info."ID_HORARIO",
                (SELECT MAX(fn_get_bloque_orden((elem->>'id')::INTEGER)) FROM jsonb_array_elements(v_bloques_antes) elem WHERE elem->>'tipo' = 'clase'),
                (SELECT MIN(fn_get_bloque_orden((elem->>'id')::INTEGER)) FROM jsonb_array_elements(v_bloques_despues) elem WHERE elem->>'tipo' = 'clase')
            );
            
            IF v_count_total_antes >= v_count_total_despues THEN
                -- La parte de arriba conserva el ID de sesión
                SELECT hora_inicio, hora_fin INTO v_nueva_hora_ini, v_nueva_hora_fin
                FROM fn_calcular_horas_sesion(v_grupo_info."ID_HORARIO", v_bloques_antes);
                
                UPDATE "SESIONES_AGRUPADAS"
                SET "HORA_INICIO" = v_nueva_hora_ini,
                    "HORA_FIN" = v_nueva_hora_fin,
                    "DURACION_TOTAL_MINUTOS" = v_count_antes.duracion_total,
                    "IDS_BLOQUES" = v_bloques_antes,
                    "IDS_PROGRAMACION" = v_progs_antes
                WHERE "ID_SESION" = v_id_sesion;
                
                -- Nueva sesión para la parte de abajo
                SELECT hora_inicio, hora_fin INTO v_nueva_hora_ini, v_nueva_hora_fin
                FROM fn_calcular_horas_sesion(v_grupo_info."ID_HORARIO", v_bloques_despues);
                
                INSERT INTO "SESIONES_AGRUPADAS" (
                    "FECHA", "ID_GRUPO_PLAN_CURSO",
                    "HORA_INICIO", "HORA_FIN", "DURACION_TOTAL_MINUTOS",
                    "IDS_BLOQUES", "IDS_PROGRAMACION", "ESTADO", "ACTIVO"
                ) VALUES (
                    v_fecha_date, p_id_gpc,
                    v_nueva_hora_ini, v_nueva_hora_fin, v_count_despues.duracion_total,
                    v_bloques_despues, v_progs_despues,
                    'programado', TRUE
                );
                
                RAISE NOTICE '[DELETE] SPLIT: Sesión % conservada (arriba), nueva creada (abajo)', v_id_sesion;
            ELSE
                -- La parte de abajo conserva el ID de sesión
                SELECT hora_inicio, hora_fin INTO v_nueva_hora_ini, v_nueva_hora_fin
                FROM fn_calcular_horas_sesion(v_grupo_info."ID_HORARIO", v_bloques_despues);
                
                UPDATE "SESIONES_AGRUPADAS"
                SET "HORA_INICIO" = v_nueva_hora_ini,
                    "HORA_FIN" = v_nueva_hora_fin,
                    "DURACION_TOTAL_MINUTOS" = v_count_despues.duracion_total,
                    "IDS_BLOQUES" = v_bloques_despues,
                    "IDS_PROGRAMACION" = v_progs_despues
                WHERE "ID_SESION" = v_id_sesion;
                
                -- Nueva sesión para la parte de arriba
                SELECT hora_inicio, hora_fin INTO v_nueva_hora_ini, v_nueva_hora_fin
                FROM fn_calcular_horas_sesion(v_grupo_info."ID_HORARIO", v_bloques_antes);
                
                INSERT INTO "SESIONES_AGRUPADAS" (
                    "FECHA", "ID_GRUPO_PLAN_CURSO",
                    "HORA_INICIO", "HORA_FIN", "DURACION_TOTAL_MINUTOS",
                    "IDS_BLOQUES", "IDS_PROGRAMACION", "ESTADO", "ACTIVO"
                ) VALUES (
                    v_fecha_date, p_id_gpc,
                    v_nueva_hora_ini, v_nueva_hora_fin, v_count_antes.duracion_total,
                    v_bloques_antes, v_progs_antes,
                    'programado', TRUE
                );
                
                RAISE NOTICE '[DELETE] SPLIT: Sesión % movida (abajo), nueva creada (arriba)', v_id_sesion;
            END IF;
        END IF;
    END LOOP;
    
    RAISE NOTICE '[DELETE] Completado para GPC=%, día=%, bloque=%', p_id_gpc, p_dia_idx, v_orden_borrar;
END;
$$;

-- ============================================
-- TRIGGERS AFTER
-- ============================================

-- TRIGGER INSERT
CREATE OR REPLACE FUNCTION fn_trg_pg_sesiones_insert()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_prog RECORD;
BEGIN
    FOR v_prog IN
        SELECT DISTINCT 
            "ID_GRUPO",
            "DIA_IDX",
            "ID_BLOQUE",
            "ID_GRUPO_PLAN_CURSO",
            "ID_PROGRAMACION"
        FROM new_table
        WHERE "ID_GRUPO_PLAN_CURSO" IS NOT NULL
    LOOP
        RAISE NOTICE '[TRIGGER INSERT] Procesando programa % en bloque %', 
            v_prog."ID_PROGRAMACION", v_prog."ID_BLOQUE";
        PERFORM fn_sesion_insert_inteligente(
            v_prog."ID_GRUPO",
            v_prog."DIA_IDX",
            v_prog."ID_BLOQUE",
            v_prog."ID_GRUPO_PLAN_CURSO",
            v_prog."ID_PROGRAMACION"
        );
    END LOOP;
    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_pg_sesiones_insert
    AFTER INSERT ON "PROGRAMACION_GRUPO"
    REFERENCING NEW TABLE AS new_table
    FOR EACH STATEMENT 
    EXECUTE FUNCTION fn_trg_pg_sesiones_insert();

-- TRIGGER DELETE
CREATE OR REPLACE FUNCTION fn_trg_pg_sesiones_delete()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_prog RECORD;
BEGIN
    FOR v_prog IN
        SELECT DISTINCT 
            "ID_GRUPO",
            "DIA_IDX",
            "ID_BLOQUE",
            "ID_GRUPO_PLAN_CURSO"
        FROM old_table
        WHERE "ID_GRUPO_PLAN_CURSO" IS NOT NULL
    LOOP
        RAISE NOTICE '[TRIGGER DELETE] Procesando bloque %', 
            v_prog."ID_BLOQUE";
        PERFORM fn_sesion_delete_inteligente(
            v_prog."ID_GRUPO",
            v_prog."DIA_IDX",
            v_prog."ID_BLOQUE",
            v_prog."ID_GRUPO_PLAN_CURSO"
        );
    END LOOP;
    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_pg_sesiones_delete
    AFTER DELETE ON "PROGRAMACION_GRUPO"
    REFERENCING OLD TABLE AS old_table
    FOR EACH STATEMENT 
    EXECUTE FUNCTION fn_trg_pg_sesiones_delete();

-- TRIGGER UPDATE
CREATE OR REPLACE FUNCTION fn_trg_pg_sesiones_update()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_old RECORD;
    v_new RECORD;
BEGIN
    FOR v_old IN
        SELECT DISTINCT 
            "ID_GRUPO",
            "DIA_IDX",
            "ID_BLOQUE",
            "ID_GRUPO_PLAN_CURSO"
        FROM old_table
        WHERE "ID_GRUPO_PLAN_CURSO" IS NOT NULL
    LOOP
        RAISE NOTICE '[TRIGGER UPDATE] Procesando OLD en bloque %', v_old."ID_BLOQUE";
        PERFORM fn_sesion_delete_inteligente(
            v_old."ID_GRUPO",
            v_old."DIA_IDX",
            v_old."ID_BLOQUE",
            v_old."ID_GRUPO_PLAN_CURSO"
        );
    END LOOP;
    
    FOR v_new IN
        SELECT DISTINCT 
            "ID_GRUPO",
            "DIA_IDX",
            "ID_BLOQUE",
            "ID_GRUPO_PLAN_CURSO",
            "ID_PROGRAMACION"
        FROM new_table
        WHERE "ID_GRUPO_PLAN_CURSO" IS NOT NULL
    LOOP
        RAISE NOTICE '[TRIGGER UPDATE] Procesando NEW en bloque %', v_new."ID_BLOQUE";
        PERFORM fn_sesion_insert_inteligente(
            v_new."ID_GRUPO",
            v_new."DIA_IDX",
            v_new."ID_BLOQUE",
            v_new."ID_GRUPO_PLAN_CURSO",
            v_new."ID_PROGRAMACION"
        );
    END LOOP;
    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_pg_sesiones_update
    AFTER UPDATE ON "PROGRAMACION_GRUPO"
    REFERENCING NEW TABLE AS new_table OLD TABLE AS old_table
    FOR EACH STATEMENT 
    EXECUTE FUNCTION fn_trg_pg_sesiones_update();
