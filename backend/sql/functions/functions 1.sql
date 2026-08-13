-- ============================================
-- FUNCTIONS: funciones de soporte
-- Tablas de create table 1.sql
-- ============================================

-- ============================================
-- DROP (ordenado igual que los CREATE)
-- ============================================
DROP FUNCTION IF EXISTS execute_sql(TEXT);
DROP FUNCTION IF EXISTS execute_batch_transaction(TEXT[]);
DROP FUNCTION IF EXISTS crear_usuario(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TEXT);
DROP FUNCTION IF EXISTS vincular_usuario(TEXT, UUID);
DROP FUNCTION IF EXISTS fn_login(TEXT);
DROP FUNCTION IF EXISTS obtener_roles_usuario(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS tiene_permiso(INTEGER, TEXT, TEXT, INTEGER);
DROP FUNCTION IF EXISTS fn_usuarios_disponibles_docente(INTEGER);



-- ============================================
-- UTILIDADES GENERICAS
-- ============================================

-- Funcion: ejecutar SQL arbitrario y devolver JSONB
CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  EXECUTE format('SELECT jsonb_agg(row_to_json(t)) FROM (%s) t', sql_query)
  INTO result;
  RETURN COALESCE(result, '[]'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Funcion: ejecutar varias sentencias en una transaccion
CREATE OR REPLACE FUNCTION execute_batch_transaction(sql_statements TEXT[])
RETURNS JSONB AS $$
DECLARE
  stmt TEXT;
  result JSONB;
  executed_count INTEGER := 0;
BEGIN
  FOREACH stmt IN ARRAY sql_statements
  LOOP
    EXECUTE stmt;
    executed_count := executed_count + 1;
  END LOOP;

  result := jsonb_build_object('success', true, 'executed', executed_count);
  RETURN result;

EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- GESTION DE USUARIOS
-- ============================================

-- Funcion: crear usuario (para admin)
CREATE OR REPLACE FUNCTION crear_usuario(
  p_dni text,
  p_apellidos text,
  p_nombres text,
  p_email text DEFAULT NULL,
  p_telefono text DEFAULT NULL,
  p_direccion text DEFAULT NULL,
  p_fecha_nacimiento date DEFAULT NULL,
  p_sexo text DEFAULT NULL
)
RETURNS integer AS $$
DECLARE
  v_id integer;
BEGIN
  INSERT INTO "USUARIOS" (
    "DNI", "APELLIDOS", "NOMBRES", "EMAIL", "TELEFONO",
    "DIRECCION", "FECHA_NACIMIENTO", "SEXO"
  ) VALUES (
    p_dni, p_apellidos, p_nombres, p_email, p_telefono,
    p_direccion, p_fecha_nacimiento, p_sexo
  )
  RETURNING "ID_USUARIO" INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;


-- Funcion: vincular cuenta de Supabase Auth a un usuario por DNI
CREATE OR REPLACE FUNCTION vincular_usuario(
  p_dni text,
  p_supabase_uid uuid
)
RETURNS void AS $$
BEGIN
  UPDATE "USUARIOS"
  SET "SUPABASE_UID" = p_supabase_uid
  WHERE "DNI" = p_dni;
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- ROLES Y PERMISOS
-- ============================================

-- Funcion: obtener roles de un usuario (sistema + derivados)
CREATE OR REPLACE FUNCTION obtener_roles_usuario(
  p_id_usuario integer,
  p_id_periodo integer DEFAULT NULL
)
RETURNS text[] AS $$
DECLARE
  v_roles text[];
BEGIN
  SELECT COALESCE(array_agg(r."NOMBRE_ROL"), ARRAY[]::text[])
  INTO v_roles
  FROM "USUARIOS" u
  JOIN "ROLES" r ON r."ID_ROL" = ANY(u."ID_ROLES")
  WHERE u."ID_USUARIO" = p_id_usuario
    AND r."ACTIVO" = TRUE;

  IF EXISTS (
    SELECT 1 FROM "DOCENTES"
    WHERE "ID_USUARIO" = p_id_usuario AND "ACTIVO" = TRUE
  ) THEN
    v_roles := array_append(v_roles, 'docente');
  END IF;

  -- IF p_id_periodo IS NOT NULL AND EXISTS (
  --   SELECT 1 FROM "POSTULANTES"
  --   WHERE "ID_USUARIO" = p_id_usuario
  --     AND "ID_PERIODO" = p_id_periodo
  --     AND "ACTIVO" = TRUE
  -- ) THEN
  --   v_roles := array_append(v_roles, 'postulante');
  -- END IF;

  RETURN v_roles;
END;
$$ LANGUAGE plpgsql;


-- Funcion: verificar si un usuario tiene un permiso
CREATE OR REPLACE FUNCTION tiene_permiso(
  p_id_usuario integer,
  p_recurso text,
  p_accion text,
  p_id_periodo integer DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  v_id_permiso integer;
BEGIN
  SELECT "ID_PERMISO"
  INTO v_id_permiso
  FROM "PERMISOS"
  WHERE "RECURSO" = p_recurso
    AND "ACCION" = p_accion
    AND "ACTIVO" = TRUE;

  IF v_id_permiso IS NULL THEN
    RETURN FALSE;
  END IF;


  RETURN EXISTS (
    SELECT 1
    FROM "ROLES" r
    WHERE r."NOMBRE_ROL" = ANY (obtener_roles_usuario(p_id_usuario, p_id_periodo))
      AND v_id_permiso = ANY (r."ID_PERMISOS")
  );
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- DOCENTES
-- ============================================

-- Funcion: usuarios disponibles para asignar como docente
CREATE OR REPLACE FUNCTION fn_usuarios_disponibles_docente(
  p_id_docente_actual INTEGER DEFAULT NULL
)
RETURNS TABLE (
  id_usuario INTEGER,
  nombre_completo TEXT,
  dni TEXT,
  estado_usuario TEXT,
  fecha_nacimiento DATE,
  edad INTEGER,
  sexo TEXT,
  telefono TEXT,
  email TEXT,
  direccion TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u."ID_USUARIO"::INTEGER AS id_usuario,
    TRIM(CONCAT_WS(' ', u."APELLIDOS", u."NOMBRES"))::TEXT AS nombre_completo,
    u."DNI"::TEXT AS dni,
    CASE
      WHEN d."ID_DOCENTE" = p_id_docente_actual THEN 'ACTUAL'
      ELSE 'DISPONIBLE'
    END::TEXT AS estado_usuario,
    u."FECHA_NACIMIENTO"::DATE AS fecha_nacimiento,
    CASE
      WHEN u."FECHA_NACIMIENTO" IS NOT NULL THEN DATE_PART('year', AGE(u."FECHA_NACIMIENTO"))::INT
      ELSE NULL
    END AS edad,
    u."SEXO"::TEXT AS sexo,
    u."TELEFONO"::TEXT AS telefono,
    u."EMAIL"::TEXT AS email,
    u."DIRECCION"::TEXT AS direccion
  FROM "USUARIOS" u
  LEFT JOIN "DOCENTES" d ON d."ID_USUARIO" = u."ID_USUARIO"
  WHERE u."ACTIVO" = TRUE
    AND (
      d."ID_DOCENTE" = p_id_docente_actual
      OR d."ID_DOCENTE" IS NULL
    );
END;
$$ LANGUAGE plpgsql;
