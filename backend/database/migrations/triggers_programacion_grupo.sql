-- ============================================
-- TRIGGERS COMPLETOS PARA PROGRAMACION_GRUPO Y VISTA
-- Incluye: Validaciones (plaza/docente) + INSTEAD OF para vista
-- ============================================

-- ============================================
-- 1. DROPS LIMPIOS: Todos los triggers y funciones
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

DROP TRIGGER IF EXISTS trg_pg_validar_insert ON "PROGRAMACION_GRUPO";
DROP TRIGGER IF EXISTS trg_pg_validar_update ON "PROGRAMACION_GRUPO";
DROP TRIGGER IF EXISTS trg_pg_sesiones_insert ON "PROGRAMACION_GRUPO";
DROP TRIGGER IF EXISTS trg_pg_sesiones_update ON "PROGRAMACION_GRUPO";
DROP TRIGGER IF EXISTS trg_pg_sesiones_delete ON "PROGRAMACION_GRUPO";
DROP TRIGGER IF EXISTS trg_programacion_grupo_sesiones ON "PROGRAMACION_GRUPO";

DROP FUNCTION IF EXISTS fn_trg_pg_validar_insert() CASCADE;
DROP FUNCTION IF EXISTS fn_trg_pg_validar_update() CASCADE;
DROP FUNCTION IF EXISTS fn_trg_pg_sesiones_insert() CASCADE;
DROP FUNCTION IF EXISTS fn_trg_pg_sesiones_update() CASCADE;
DROP FUNCTION IF EXISTS fn_trg_pg_sesiones_delete() CASCADE;
DROP FUNCTION IF EXISTS fn_trg_programacion_grupo_sesiones() CASCADE;
DROP FUNCTION IF EXISTS fn_regenerar_sesiones_dia(INTEGER, INTEGER, INTEGER) CASCADE;

DROP TRIGGER IF EXISTS trg_vw_programacion_insert ON "VW_PROGRAMACION_GRUPO_COMPLETA";
DROP TRIGGER IF EXISTS trg_vw_programacion_update ON "VW_PROGRAMACION_GRUPO_COMPLETA";
DROP TRIGGER IF EXISTS trg_vw_programacion_delete ON "VW_PROGRAMACION_GRUPO_COMPLETA";

DROP FUNCTION IF EXISTS fn_validar_solapamiento_plaza() CASCADE;
DROP FUNCTION IF EXISTS fn_validar_solapamiento_docente() CASCADE;
DROP FUNCTION IF EXISTS fn_validar_solapamiento_plaza(INTEGER, INTEGER, INTEGER, INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS fn_validar_solapamiento_docente(INTEGER, INTEGER, INTEGER, INTEGER, INTEGER) CASCADE;

DROP FUNCTION IF EXISTS trg_vw_programacion_insert() CASCADE;
DROP FUNCTION IF EXISTS trg_vw_programacion_update() CASCADE;
DROP FUNCTION IF EXISTS trg_vw_programacion_delete() CASCADE;

-- ============================================
-- 2. FUNCIONES DE VALIDACIÓN DE SOLAPAMIENTO
-- ============================================

-- ============================================
-- 2.1 Validar solapamiento de PLAZA
-- ============================================
CREATE OR REPLACE FUNCTION fn_validar_solapamiento_plaza(
    p_id_grupo INTEGER,
    p_dia_idx INTEGER,
    p_id_bloque INTEGER,
    p_id_gpc INTEGER,
    p_id_programacion INTEGER DEFAULT NULL
)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
    v_bloque_info RECORD;
    v_conflicto RECORD;
    v_fechas_col JSONB;
    v_fecha_item JSONB;
    v_fechas_str TEXT := '';
    v_nuevo_curso TEXT;
    v_msg TEXT;
    v_json_error JSONB;
BEGIN
    -- Obtener información del bloque (orden, horario)
    SELECT HB."ORDEN", H."ID_HORARIO", H."HORA_INICIO_JORNADA", HB."DURACION"
    INTO v_bloque_info
    FROM "HORARIO_BLOQUES" HB
    JOIN "HORARIOS" H ON H."ID_HORARIO" = HB."ID_HORARIO"
    WHERE HB."ID_BLOQUE" = p_id_bloque;

    IF v_bloque_info IS NULL THEN
        RETURN;
    END IF;

    -- Calcular fechas para el día índice
    v_fechas_col := fn_calcular_fechas_matriz(p_id_grupo);

    FOR v_fecha_item IN
        SELECT value FROM jsonb_array_elements(v_fechas_col)
        WHERE (value->>'dia_idx')::INTEGER = p_dia_idx
    LOOP
        IF v_fechas_str != '' THEN
            v_fechas_str := v_fechas_str || ', ';
        END IF;
        v_fechas_str := v_fechas_str || (v_fecha_item->>'fecha')::DATE::TEXT;
    END LOOP;

    -- Obtener nombre del curso que se intenta asignar
    SELECT C."NOMBRE_CURSO"
    INTO v_nuevo_curso
    FROM "GRUPO_PLAN_CURSO" GPC
    JOIN "PLAN_ACADEMICO_CURSOS" PAC ON PAC."ID_PLAN_ACADEMICO_CURSO" = GPC."ID_PLAN_ACADEMICO_CURSO"
    JOIN "CURSOS" C ON C."ID_CURSO" = PAC."ID_CURSO"
    WHERE GPC."ID_GRUPO_PLAN_CURSO" = p_id_gpc;

    -- Buscar conflicto: otra programación con el mismo GPC (misma plaza) en otro grupo
    SELECT
        PG."ID_PROGRAMACION",
        PG."ID_GRUPO",
        G."CODIGO_GRUPO",
        G."NOMBRE_GRUPO",
        C."NOMBRE_CURSO"  AS curso_nombre,
        C."CODIGO_CURSO"  AS curso_codigo,
        PD."IDENTIFICADOR_DOCENTE",
        D."APELLIDOS",
        D."NOMBRES"
    INTO v_conflicto
    FROM "PROGRAMACION_GRUPO" PG
    JOIN "GRUPOS" G ON G."ID_GRUPO" = PG."ID_GRUPO"
    JOIN "GRUPO_PLAN_CURSO" GPC ON GPC."ID_GRUPO_PLAN_CURSO" = PG."ID_GRUPO_PLAN_CURSO"
    JOIN "PLAN_ACADEMICO_CURSOS" PAC ON PAC."ID_PLAN_ACADEMICO_CURSO" = GPC."ID_PLAN_ACADEMICO_CURSO"
    JOIN "CURSOS" C ON C."ID_CURSO" = PAC."ID_CURSO"
    LEFT JOIN "PLAZA_DOCENTE" PD ON PD."ID_PLAZA_DOCENTE" = GPC."ID_PLAZA_DOCENTE"
    LEFT JOIN "DOCENTES" D ON D."ID_DOCENTE" = PD."ID_DOCENTE"
    WHERE PG."ID_GRUPO_PLAN_CURSO" = p_id_gpc
      AND PG."DIA_IDX" = p_dia_idx
      AND PG."ID_BLOQUE" = p_id_bloque
      AND PG."ACTIVO" = TRUE
      AND (p_id_programacion IS NULL OR PG."ID_PROGRAMACION" != p_id_programacion)
      AND PG."ID_GRUPO" != p_id_grupo
    LIMIT 1;

    IF FOUND THEN
        v_json_error := jsonb_build_object(
            'tipo', 'SOLAPAMIENTO_PLAZA',
            'titulo', 'Plaza ya asignada',
            'mensaje', format('La plaza ya está asignada al grupo "%s" (%s)', v_conflicto."NOMBRE_GRUPO", v_conflicto."CODIGO_GRUPO"),
            'detalles', jsonb_build_object(
                'curso_intento', jsonb_build_object(
                    'nombre', v_nuevo_curso,
                    'gpc_id', p_id_gpc
                ),
                'curso_conflicto', jsonb_build_object(
                    'nombre', v_conflicto.curso_nombre,
                    'codigo', v_conflicto.curso_codigo
                ),
                'grupo_conflicto', jsonb_build_object(
                    'nombre', v_conflicto."NOMBRE_GRUPO",
                    'codigo', v_conflicto."CODIGO_GRUPO"
                ),
                'docente', format('%s %s (%s)',
                    COALESCE(v_conflicto."NOMBRES", ''),
                    COALESCE(v_conflicto."APELLIDOS", ''),
                    v_conflicto."IDENTIFICADOR_DOCENTE"
                ),
                'bloque', jsonb_build_object(
                    'orden', v_bloque_info."ORDEN",
                    'dia_idx', p_dia_idx,
                    'fechas', v_fechas_str,
                    'duracion_min', v_bloque_info."DURACION"
                )
            ),
            'tabla_datos', jsonb_build_array(
                jsonb_build_object('campo', 'Curso', 'valor_intento', v_nuevo_curso, 'valor_existente', v_conflicto.curso_nombre),
                jsonb_build_object('campo', 'Grupo', 'valor_intento', 'Nuevo', 'valor_existente', format('%s (%s)', v_conflicto."NOMBRE_GRUPO", v_conflicto."CODIGO_GRUPO")),
                jsonb_build_object('campo', 'Docente', 'valor_intento', '-', 'valor_existente', format('%s %s', COALESCE(v_conflicto."NOMBRES",''), COALESCE(v_conflicto."APELLIDOS",''))),
                jsonb_build_object('campo', 'Día', 'valor_intento', p_dia_idx::TEXT, 'valor_existente', p_dia_idx::TEXT),
                jsonb_build_object('campo', 'Bloque', 'valor_intento', v_bloque_info."ORDEN"::TEXT, 'valor_existente', v_bloque_info."ORDEN"::TEXT),
                jsonb_build_object('campo', 'Fechas', 'valor_intento', v_fechas_str, 'valor_existente', v_fechas_str)
            )
        );

        v_msg := format(
            '[SOLAPAMIENTO_PLAZA] %s|%s|%s|%s|%s|%s|%s|%s|%s',
            v_nuevo_curso,
            COALESCE(v_conflicto.curso_nombre, 'N/A'),
            v_conflicto."NOMBRE_GRUPO",
            v_conflicto."CODIGO_GRUPO",
            COALESCE(v_conflicto."NOMBRES", ''),
            COALESCE(v_conflicto."APELLIDOS", v_conflicto."IDENTIFICADOR_DOCENTE"),
            p_dia_idx,
            v_bloque_info."ORDEN",
            v_fechas_str
        );

        RAISE EXCEPTION '%', v_msg;
    END IF;

    RETURN;
END;
$$;

-- ============================================
-- 2.2 Validar solapamiento de DOCENTE (CORREGIDO: cross-sede)
-- ============================================
CREATE OR REPLACE FUNCTION fn_validar_solapamiento_docente(
    p_id_grupo INTEGER,
    p_dia_idx INTEGER,
    p_id_bloque INTEGER,
    p_id_gpc INTEGER,
    p_id_programacion INTEGER DEFAULT NULL
)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
    v_bloque_info   RECORD;
    v_docente_info  RECORD;
    v_conflicto     RECORD;
    v_fechas_col    JSONB;
    v_fecha_item    JSONB;
    v_fechas_str    TEXT := '';
    v_nombre_docente TEXT;
    v_msg           TEXT;
    v_json_error    JSONB;
BEGIN
    -- Obtener información del bloque
    SELECT HB."ORDEN", H."ID_HORARIO", H."HORA_INICIO_JORNADA", HB."DURACION"
    INTO v_bloque_info
    FROM "HORARIO_BLOQUES" HB
    JOIN "HORARIOS" H ON H."ID_HORARIO" = HB."ID_HORARIO"
    WHERE HB."ID_BLOQUE" = p_id_bloque;

    IF v_bloque_info IS NULL THEN
        RETURN;
    END IF;

    -- Calcular fechas para el día índice
    v_fechas_col := fn_calcular_fechas_matriz(p_id_grupo);

    FOR v_fecha_item IN
        SELECT value FROM jsonb_array_elements(v_fechas_col)
        WHERE (value->>'dia_idx')::INTEGER = p_dia_idx
    LOOP
        IF v_fechas_str != '' THEN
            v_fechas_str := v_fechas_str || ', ';
        END IF;
        v_fechas_str := v_fechas_str || (v_fecha_item->>'fecha')::DATE::TEXT;
    END LOOP;

    -- Obtener ID_DOCENTE y datos del docente que se intenta insertar
    -- vía: p_id_gpc → GRUPO_PLAN_CURSO → PLAZA_DOCENTE → DOCENTES
    SELECT
        PD."ID_DOCENTE",
        PD."IDENTIFICADOR_DOCENTE",
        D."APELLIDOS",
        D."NOMBRES",
        C."NOMBRE_CURSO" AS curso_nombre,
        C."CODIGO_CURSO" AS curso_codigo
    INTO v_docente_info
    FROM "GRUPO_PLAN_CURSO" GPC
    JOIN "PLAN_ACADEMICO_CURSOS" PAC ON PAC."ID_PLAN_ACADEMICO_CURSO" = GPC."ID_PLAN_ACADEMICO_CURSO"
    JOIN "CURSOS" C ON C."ID_CURSO" = PAC."ID_CURSO"
    JOIN "PLAZA_DOCENTE" PD ON PD."ID_PLAZA_DOCENTE" = GPC."ID_PLAZA_DOCENTE"
    LEFT JOIN "DOCENTES" D ON D."ID_DOCENTE" = PD."ID_DOCENTE"
    WHERE GPC."ID_GRUPO_PLAN_CURSO" = p_id_gpc
      AND GPC."ACTIVO" = TRUE;

    -- Si no hay docente asignado a esta plaza, no hay nada que validar
    IF v_docente_info IS NULL OR v_docente_info."ID_DOCENTE" IS NULL THEN
        RETURN;
    END IF;

    v_nombre_docente := format('%s %s',
        COALESCE(v_docente_info."NOMBRES", ''),
        COALESCE(v_docente_info."APELLIDOS", v_docente_info."IDENTIFICADOR_DOCENTE")
    );

    -- FIX CROSS-SEDE: Buscar conflicto del docente en CUALQUIER grupo/sede/turno.
    -- Lógica:
    --   1. Buscar todas las PROGRAMACION_GRUPO con mismo DIA_IDX + ID_BLOQUE
    --   2. Para cada una, obtener el ID_DOCENTE de su plaza (GPC → PLAZA_DOCENTE)
    --   3. Si ese ID_DOCENTE == v_docente_info."ID_DOCENTE" → conflicto
    -- No se restringe por sede ni por curso, solo por identidad del docente.
    SELECT
        PG."ID_PROGRAMACION",
        PG."ID_GRUPO",
        G."CODIGO_GRUPO",
        G."NOMBRE_GRUPO",
        S."NOMBRE_SEDE",
        C."NOMBRE_CURSO"          AS curso_conflicto_nombre,
        C."CODIGO_CURSO"          AS curso_conflicto_codigo,
        PD_C."IDENTIFICADOR_DOCENTE" AS identificador_conflicto
    INTO v_conflicto
    FROM "PROGRAMACION_GRUPO" PG
    JOIN "GRUPOS" G ON G."ID_GRUPO" = PG."ID_GRUPO"
    JOIN "SEDES" S ON S."ID_SEDE" = G."ID_SEDE"
    JOIN "GRUPO_PLAN_CURSO" GPC ON GPC."ID_GRUPO_PLAN_CURSO" = PG."ID_GRUPO_PLAN_CURSO"
    JOIN "PLAN_ACADEMICO_CURSOS" PAC ON PAC."ID_PLAN_ACADEMICO_CURSO" = GPC."ID_PLAN_ACADEMICO_CURSO"
    JOIN "CURSOS" C ON C."ID_CURSO" = PAC."ID_CURSO"
    JOIN "PLAZA_DOCENTE" PD_C ON PD_C."ID_PLAZA_DOCENTE" = GPC."ID_PLAZA_DOCENTE"
    WHERE PG."DIA_IDX" = p_dia_idx
      AND PG."ID_BLOQUE" = p_id_bloque
      AND PG."ACTIVO" = TRUE
      AND PD_C."ID_DOCENTE" = v_docente_info."ID_DOCENTE"          -- mismo docente, cualquier sede
      AND (p_id_programacion IS NULL OR PG."ID_PROGRAMACION" != p_id_programacion)
      AND PG."ID_GRUPO" != p_id_grupo                              -- excluir el propio grupo
    LIMIT 1;

    IF FOUND THEN
        v_json_error := jsonb_build_object(
            'tipo', 'SOLAPAMIENTO_DOCENTE',
            'titulo', 'Docente ya asignado',
            'mensaje', format('El docente %s ya está asignado a otro grupo en este horario', v_nombre_docente),
            'detalles', jsonb_build_object(
                'docente', jsonb_build_object(
                    'id', v_docente_info."ID_DOCENTE",
                    'nombre', v_nombre_docente,
                    'identificador', v_docente_info."IDENTIFICADOR_DOCENTE"
                ),
                'curso_intento', jsonb_build_object(
                    'nombre', v_docente_info.curso_nombre,
                    'codigo', v_docente_info.curso_codigo,
                    'gpc_id', p_id_gpc
                ),
                'curso_conflicto', jsonb_build_object(
                    'nombre', v_conflicto.curso_conflicto_nombre,
                    'codigo', v_conflicto.curso_conflicto_codigo
                ),
                'grupo_conflicto', jsonb_build_object(
                    'nombre', v_conflicto."NOMBRE_GRUPO",
                    'codigo', v_conflicto."CODIGO_GRUPO"
                ),
                'sede_conflicto', v_conflicto."NOMBRE_SEDE",
                'bloque', jsonb_build_object(
                    'orden', v_bloque_info."ORDEN",
                    'dia_idx', p_dia_idx,
                    'fechas', v_fechas_str,
                    'duracion_min', v_bloque_info."DURACION"
                )
            ),
            'tabla_datos', jsonb_build_array(
                jsonb_build_object('campo', 'Docente', 'valor_intento', v_nombre_docente, 'valor_existente', v_nombre_docente),
                jsonb_build_object('campo', 'Curso Intentado', 'valor_intento', v_docente_info.curso_nombre, 'valor_existente', v_conflicto.curso_conflicto_nombre),
                jsonb_build_object('campo', 'Curso Existente', 'valor_intento', '-', 'valor_existente', v_conflicto.curso_conflicto_nombre),
                jsonb_build_object('campo', 'Grupo', 'valor_intento', 'Nuevo', 'valor_existente', format('%s (%s)', v_conflicto."NOMBRE_GRUPO", v_conflicto."CODIGO_GRUPO")),
                jsonb_build_object('campo', 'Sede Conflicto', 'valor_intento', '-', 'valor_existente', v_conflicto."NOMBRE_SEDE"),
                jsonb_build_object('campo', 'Día', 'valor_intento', p_dia_idx::TEXT, 'valor_existente', p_dia_idx::TEXT),
                jsonb_build_object('campo', 'Bloque', 'valor_intento', v_bloque_info."ORDEN"::TEXT, 'valor_existente', v_bloque_info."ORDEN"::TEXT),
                jsonb_build_object('campo', 'Fechas Afectadas', 'valor_intento', v_fechas_str, 'valor_existente', v_fechas_str)
            )
        );

        v_msg := format(
            '[SOLAPAMIENTO_DOCENTE] %s|%s|%s|%s|%s|%s|%s|%s|%s|%s',
            v_docente_info."ID_DOCENTE",
            v_nombre_docente,
            v_docente_info.curso_nombre,
            COALESCE(v_conflicto.curso_conflicto_nombre, 'N/A'),
            v_conflicto."NOMBRE_GRUPO",
            v_conflicto."CODIGO_GRUPO",
            p_dia_idx,
            v_bloque_info."ORDEN",
            v_fechas_str,
            v_docente_info."IDENTIFICADOR_DOCENTE"
        );

        RAISE EXCEPTION '%', v_msg;
    END IF;

    RETURN;
END;
$$;

-- ============================================
-- 3. TRIGGERS BEFORE PARA VALIDACIÓN EN TABLA
-- ============================================

-- 3.1 Función y trigger BEFORE INSERT
CREATE OR REPLACE FUNCTION fn_trg_pg_validar_insert()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW."ID_GRUPO_PLAN_CURSO" IS NOT NULL THEN
        PERFORM fn_validar_solapamiento_plaza(
            NEW."ID_GRUPO",
            NEW."DIA_IDX",
            NEW."ID_BLOQUE",
            NEW."ID_GRUPO_PLAN_CURSO",
            NULL
        );
    END IF;

    IF NEW."ID_GRUPO_PLAN_CURSO" IS NOT NULL THEN
        PERFORM fn_validar_solapamiento_docente(
            NEW."ID_GRUPO",
            NEW."DIA_IDX",
            NEW."ID_BLOQUE",
            NEW."ID_GRUPO_PLAN_CURSO",
            NULL
        );
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_pg_validar_insert
    BEFORE INSERT ON "PROGRAMACION_GRUPO"
    FOR EACH ROW
    EXECUTE FUNCTION fn_trg_pg_validar_insert();

-- 3.2 Función y trigger BEFORE UPDATE
CREATE OR REPLACE FUNCTION fn_trg_pg_validar_update()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF OLD."ID_GRUPO" = NEW."ID_GRUPO"
       AND OLD."DIA_IDX" = NEW."DIA_IDX"
       AND OLD."ID_BLOQUE" = NEW."ID_BLOQUE"
       AND OLD."ID_GRUPO_PLAN_CURSO" = NEW."ID_GRUPO_PLAN_CURSO" THEN
        RETURN NEW;
    END IF;

    IF NEW."ID_GRUPO_PLAN_CURSO" IS NOT NULL THEN
        PERFORM fn_validar_solapamiento_plaza(
            NEW."ID_GRUPO",
            NEW."DIA_IDX",
            NEW."ID_BLOQUE",
            NEW."ID_GRUPO_PLAN_CURSO",
            NEW."ID_PROGRAMACION"
        );
    END IF;

    IF NEW."ID_GRUPO_PLAN_CURSO" IS NOT NULL THEN
        PERFORM fn_validar_solapamiento_docente(
            NEW."ID_GRUPO",
            NEW."DIA_IDX",
            NEW."ID_BLOQUE",
            NEW."ID_GRUPO_PLAN_CURSO",
            NEW."ID_PROGRAMACION"
        );
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_pg_validar_update
    BEFORE UPDATE ON "PROGRAMACION_GRUPO"
    FOR EACH ROW
    EXECUTE FUNCTION fn_trg_pg_validar_update();

-- ============================================
-- 4. TRIGGERS INSTEAD OF PARA VISTA
-- ============================================

-- 4.1 Función y trigger INSTEAD OF INSERT
CREATE OR REPLACE FUNCTION trg_vw_programacion_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_id_programacion INTEGER;
    v_id_bloque INTEGER;
BEGIN
    SELECT B."ID_BLOQUE" INTO v_id_bloque
    FROM "HORARIO_BLOQUES" B
    JOIN "GRUPOS" G ON G."ID_GRUPO" = NEW."ID_GRUPO"
    JOIN "TURNOS" T ON T."ID_TURNO" = G."ID_TURNO"
    WHERE B."ID_HORARIO" = T."ID_HORARIO"
      AND B."ORDEN" = NEW."BLOQUE_ORDEN"
      AND B."ACTIVO" = TRUE;

    IF v_id_bloque IS NULL THEN
        RAISE EXCEPTION 'No se encontró bloque con orden % para el grupo %', NEW."BLOQUE_ORDEN", NEW."ID_GRUPO";
    END IF;

    SELECT "ID_PROGRAMACION" INTO v_id_programacion
    FROM "PROGRAMACION_GRUPO"
    WHERE "ID_GRUPO" = NEW."ID_GRUPO"
      AND "DIA_IDX" = NEW."DIA_IDX"
      AND "ID_BLOQUE" = v_id_bloque;

    IF v_id_programacion IS NOT NULL THEN
        UPDATE "PROGRAMACION_GRUPO"
        SET "ID_GRUPO_PLAN_CURSO" = NEW."ID_GRUPO_PLAN_CURSO",
            "ACTIVO" = COALESCE(NEW."ACTIVO", TRUE)
        WHERE "ID_PROGRAMACION" = v_id_programacion;

        NEW."ID_PROGRAMACION" := v_id_programacion;
    ELSE
        INSERT INTO "PROGRAMACION_GRUPO" (
            "ID_GRUPO",
            "DIA_IDX",
            "ID_BLOQUE",
            "ID_GRUPO_PLAN_CURSO",
            "ACTIVO"
        ) VALUES (
            NEW."ID_GRUPO",
            NEW."DIA_IDX",
            v_id_bloque,
            NEW."ID_GRUPO_PLAN_CURSO",
            COALESCE(NEW."ACTIVO", TRUE)
        )
        RETURNING "ID_PROGRAMACION" INTO NEW."ID_PROGRAMACION";
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_vw_programacion_insert
    INSTEAD OF INSERT ON "VW_PROGRAMACION_GRUPO_COMPLETA"
    FOR EACH ROW
    EXECUTE FUNCTION trg_vw_programacion_insert();

-- 4.2 Función y trigger INSTEAD OF UPDATE
CREATE OR REPLACE FUNCTION trg_vw_programacion_update()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW."ID_PROGRAMACION" IS NULL THEN
        RAISE EXCEPTION 'ID_PROGRAMACION es requerido para actualizar';
    END IF;

    UPDATE "PROGRAMACION_GRUPO"
    SET
        "ID_GRUPO_PLAN_CURSO" = COALESCE(NEW."ID_GRUPO_PLAN_CURSO", OLD."ID_GRUPO_PLAN_CURSO"),
        "ACTIVO" = COALESCE(NEW."ACTIVO", OLD."ACTIVO")
    WHERE "ID_PROGRAMACION" = NEW."ID_PROGRAMACION";

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_vw_programacion_update
    INSTEAD OF UPDATE ON "VW_PROGRAMACION_GRUPO_COMPLETA"
    FOR EACH ROW
    EXECUTE FUNCTION trg_vw_programacion_update();

-- 4.3 Función y trigger INSTEAD OF DELETE
CREATE OR REPLACE FUNCTION trg_vw_programacion_delete()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD."ID_PROGRAMACION" IS NULL THEN
        DELETE FROM "PROGRAMACION_GRUPO"
        WHERE "ID_GRUPO" = OLD."ID_GRUPO"
          AND "DIA_IDX" = OLD."DIA_IDX"
          AND "ID_BLOQUE" = (
              SELECT B."ID_BLOQUE"
              FROM "HORARIO_BLOQUES" B
              JOIN "GRUPOS" G ON G."ID_GRUPO" = OLD."ID_GRUPO"
              JOIN "TURNOS" T ON T."ID_TURNO" = G."ID_TURNO"
              WHERE B."ID_HORARIO" = T."ID_HORARIO"
                AND B."ORDEN" = OLD."BLOQUE_ORDEN"
          );
    ELSE
        DELETE FROM "PROGRAMACION_GRUPO"
        WHERE "ID_PROGRAMACION" = OLD."ID_PROGRAMACION";
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_vw_programacion_delete
    INSTEAD OF DELETE ON "VW_PROGRAMACION_GRUPO_COMPLETA"
    FOR EACH ROW
    EXECUTE FUNCTION trg_vw_programacion_delete();

-- ============================================
-- NOTAS DE ORDEN DE EJECUCIÓN
-- ============================================
-- Flujo completo al insertar en la vista:
--
-- 1. trg_vw_programacion_insert (INSTEAD OF)
--    → Convierte INSERT en vista a INSERT en tabla PROGRAMACION_GRUPO
--
-- 2. trg_pg_validar_insert (BEFORE)
--    → Valida solapamiento de plaza (misma plaza, otro grupo, mismo día/bloque)
--    → Valida solapamiento de docente (mismo ID_DOCENTE, cualquier sede, mismo día/bloque)
--    → Si hay conflicto, aborta con EXCEPTION
--
-- 3. INSERT real en PROGRAMACION_GRUPO (si pasó validación)
--
-- 4. trg_pg_sesiones_insert (AFTER) - definido en sesiones_inteligentes_fix.sql
--    → Llama a fn_sesion_insert_inteligente para crear/actualizar sesiones
--
-- CORRECCIÓN APLICADA (fn_validar_solapamiento_docente):
-- Antes: JOIN filtraba plaza por (ID_SEDE del grupo conflictivo + ID_CURSO)
--        → solo detectaba solapamientos dentro de la misma sede
-- Ahora: JOIN directo GPC → PLAZA_DOCENTE → ID_DOCENTE
--        → detecta solapamientos cross-sede y cross-turno
-- ============================================
