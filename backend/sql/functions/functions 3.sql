-- ============================================
-- FUNCIONES DE POSTULACIONES A CONVOCATORIAS_CURSO
-- ============================================

-- Funcion: docentes disponibles para postular a una convocatoria_curso
-- Excluye docentes que ya tienen postulacion activa en la convocatoria_curso,
-- pero incluye al docente actual (al editar) marcado como 'ACTUAL'.
DROP FUNCTION IF EXISTS fn_docentes_disponibles_plaza(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS fn_docentes_disponibles_convocatoria(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS fn_docentes_disponibles_convocatoria_curso(INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION fn_docentes_disponibles_convocatoria_curso(
  p_id_convocatoria_curso INTEGER,
  p_id_docente_actual INTEGER DEFAULT NULL
)
RETURNS TABLE (
  id_docente INTEGER,
  nombre_completo TEXT,
  dni TEXT,
  estado_docente TEXT,
  ruc TEXT,
  condicion_laboral TEXT,
  telefono TEXT,
  email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d."ID_DOCENTE"::INTEGER AS id_docente,
    (u."APELLIDOS" || ' ' || u."NOMBRES")::TEXT AS nombre_completo,
    u."DNI"::TEXT AS dni,
    CASE
      WHEN d."ID_DOCENTE" = p_id_docente_actual THEN 'ACTUAL'
      ELSE 'DISPONIBLE'
    END::TEXT AS estado_docente,
    d."RUC"::TEXT AS ruc,
    d."CONDICION_LABORAL"::TEXT AS condicion_laboral,
    u."TELEFONO"::TEXT AS telefono,
    u."EMAIL"::TEXT AS email
  FROM "DOCENTES" d
  JOIN "USUARIOS" u ON u."ID_USUARIO" = d."ID_USUARIO"
  WHERE d."ACTIVO" = TRUE
    AND u."ACTIVO" = TRUE
    AND (
      -- El docente actual siempre se incluye (al editar)
      d."ID_DOCENTE" = p_id_docente_actual
      OR (
        -- Docentes que NO tienen postulacion activa en esta convocatoria_curso
        NOT EXISTS (
          SELECT 1
          FROM "POSTULACION_PLAZA" pp
          WHERE pp."ID_CONVOCATORIA_CURSO" = p_id_convocatoria_curso
            AND pp."ID_DOCENTE" = d."ID_DOCENTE"
            AND pp."ACTIVO" = TRUE
        )
      )
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Funcion: plazas (slots) disponibles para asignar en una convocatoria_curso
-- Retorna plazas activas sin postulacion aceptada.
-- ============================================

DROP FUNCTION IF EXISTS fn_plazas_disponibles_convocatoria(INTEGER);
DROP FUNCTION IF EXISTS fn_plazas_disponibles_convocatoria_curso(INTEGER);

CREATE OR REPLACE FUNCTION fn_plazas_disponibles_convocatoria_curso(
  p_id_convocatoria_curso INTEGER
)
RETURNS TABLE (
  id_plaza_docente INTEGER,
  pago_por_hora DECIMAL,
  identificador TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pd."ID_PLAZA_DOCENTE"::INTEGER AS id_plaza_docente,
    pd."PAGO_POR_HORA" AS pago_por_hora,
    (p."CODIGO_PERIODO" || '-' || s."CODIGO_SEDE" || '-' ||
     c."CODIGO_CURSO" || '-' ||
     ROW_NUMBER() OVER (
       PARTITION BY pd."ID_PERIODO", pd."ID_SEDE", pd."ID_CURSO"
       ORDER BY pd."FECHA_CREACION", pd."ID_PLAZA_DOCENTE"
     ))::TEXT AS identificador
  FROM "PLAZA_DOCENTE" pd
  JOIN "CONVOCATORIA_CURSO" cc ON cc."ID_CONVOCATORIA_CURSO" = pd."ID_CONVOCATORIA_CURSO"
  JOIN "PERIODOS" p ON p."ID_PERIODO" = pd."ID_PERIODO"
  JOIN "SEDES" s ON s."ID_SEDE" = pd."ID_SEDE"
  JOIN "CURSOS" c ON c."ID_CURSO" = pd."ID_CURSO"
  WHERE pd."ID_CONVOCATORIA_CURSO" = p_id_convocatoria_curso
    AND pd."ACTIVO" = TRUE
    AND NOT EXISTS (
      SELECT 1 FROM "POSTULACION_PLAZA" pp
      WHERE pp."ID_PLAZA_DOCENTE" = pd."ID_PLAZA_DOCENTE"
        AND pp."ACTIVO" = TRUE
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Funcion: plazas disponibles para asignar a una postulacion
-- Retorna plazas activas de la convocatoria_curso que no estan asignadas,
-- + la plaza actual de la postulacion (si la tiene).
-- ============================================

DROP FUNCTION IF EXISTS fn_plazas_disponibles_para_postulacion(INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION fn_plazas_disponibles_para_postulacion(
  p_id_convocatoria_curso INTEGER,
  p_id_plaza_actual INTEGER DEFAULT NULL
)
RETURNS TABLE (
  id_plaza_docente INTEGER,
  identificador TEXT,
  pago_por_hora DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pd."ID_PLAZA_DOCENTE"::INTEGER AS id_plaza_docente,
    (p."CODIGO_PERIODO" || '-' || s."CODIGO_SEDE" || '-' ||
     c."CODIGO_CURSO" || '-' ||
     ROW_NUMBER() OVER (
       PARTITION BY pd."ID_PERIODO", pd."ID_SEDE", pd."ID_CURSO"
       ORDER BY pd."FECHA_CREACION", pd."ID_PLAZA_DOCENTE"
     ))::TEXT AS identificador,
    pd."PAGO_POR_HORA" AS pago_por_hora
  FROM "PLAZA_DOCENTE" pd
  JOIN "CONVOCATORIA_CURSO" cc ON cc."ID_CONVOCATORIA_CURSO" = pd."ID_CONVOCATORIA_CURSO"
  JOIN "PERIODOS" p ON p."ID_PERIODO" = pd."ID_PERIODO"
  JOIN "SEDES" s ON s."ID_SEDE" = pd."ID_SEDE"
  JOIN "CURSOS" c ON c."ID_CURSO" = pd."ID_CURSO"
  WHERE pd."ID_CONVOCATORIA_CURSO" = p_id_convocatoria_curso
    AND pd."ACTIVO" = TRUE
    AND (
      -- No asignada a ninguna postulacion activa
      NOT EXISTS (
        SELECT 1 FROM "POSTULACION_PLAZA" pp
        WHERE pp."ID_PLAZA_DOCENTE" = pd."ID_PLAZA_DOCENTE"
          AND pp."ACTIVO" = TRUE
      )
      OR pd."ID_PLAZA_DOCENTE" = p_id_plaza_actual
    )
  ORDER BY 2;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Funcion: asignar plaza (slot) a una postulacion
-- Valida que la plaza pertenece a la misma convocatoria_curso.
-- Marca ACEPTADO=TRUE, ESTADO='contratado', asigna ID_PLAZA_DOCENTE.
-- ============================================

DROP FUNCTION IF EXISTS fn_asignar_plaza_postulacion(INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION fn_asignar_plaza_postulacion(
  p_id_postulacion INTEGER,
  p_id_plaza_docente INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_convocatoria_curso INTEGER;
  v_match BOOLEAN;
BEGIN
  SELECT "ID_CONVOCATORIA_CURSO" INTO v_convocatoria_curso
  FROM "POSTULACION_PLAZA" WHERE "ID_POSTULACION" = p_id_postulacion;

  IF v_convocatoria_curso IS NULL THEN
    RAISE EXCEPTION 'No se encontro la postulacion %', p_id_postulacion;
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM "PLAZA_DOCENTE" pd
    WHERE pd."ID_PLAZA_DOCENTE" = p_id_plaza_docente
      AND pd."ID_CONVOCATORIA_CURSO" = v_convocatoria_curso
      AND pd."ACTIVO" = TRUE
  ) INTO v_match;

  IF NOT v_match THEN
    RAISE EXCEPTION 'La plaza % no pertenece a la convocatoria_curso % de la postulacion',
      p_id_plaza_docente, v_convocatoria_curso;
  END IF;

  UPDATE "POSTULACION_PLAZA"
  SET "ID_PLAZA_DOCENTE" = p_id_plaza_docente,
      "ESTADO" = 'contratado',
      "ACEPTADO" = TRUE,
      "FECHA_ACEPTACION" = NOW()
  WHERE "ID_POSTULACION" = p_id_postulacion;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Funcion: liberar plaza (slot) de una postulacion (renuncia)
-- Pone ID_PLAZA_DOCENTE=NULL, ESTADO='descartado', ACEPTADO=FALSE.
-- La plaza queda libre para reasignar a otra postulacion.
-- ============================================

DROP FUNCTION IF EXISTS fn_liberar_plaza_postulacion(INTEGER);

CREATE OR REPLACE FUNCTION fn_liberar_plaza_postulacion(
  p_id_postulacion INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE "POSTULACION_PLAZA"
  SET "ID_PLAZA_DOCENTE" = NULL,
      "ESTADO" = 'descartado',
      "ACEPTADO" = FALSE,
      "FECHA_ACEPTACION" = NULL
  WHERE "ID_POSTULACION" = p_id_postulacion
    AND "ACEPTADO" = TRUE;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Funcion: crear convocatoria + N convocatoria_curso + N plazas_docente
-- en una transaccion atomica.
-- Recibe los datos de la convocatoria (step 1) y un JSONB con las plazas
-- (step 2): [{ID_SEDE, ID_CURSO, NUMERO_PLAZAS}, ...].
-- Por cada convocatoria_curso con NUMERO_PLAZAS >= 1:
--   - Inserta el convocatoria_curso.
--   - Inserta NUMERO_PLAZAS rows en PLAZA_DOCENTE por defecto.
-- Valida UQ_CONVOCATORIA_PERIODO (1 convocatoria por periodo).
-- Retorna el ID_CONVOCATORIA creado.
-- ============================================

DROP FUNCTION IF EXISTS fn_crear_convocatoria_con_plazas(INTEGER, VARCHAR, TIMESTAMP, TIMESTAMP, JSONB);

CREATE OR REPLACE FUNCTION fn_crear_convocatoria_con_plazas(
  p_id_periodo INTEGER,
  p_descripcion VARCHAR DEFAULT NULL,
  p_fecha_apertura TIMESTAMP DEFAULT NULL,
  p_fecha_cierre TIMESTAMP DEFAULT NULL,
  p_plazas JSONB DEFAULT '[]'::JSONB
) RETURNS INTEGER AS $$
DECLARE
  v_id_convocatoria INTEGER;
  v_count INTEGER;
  v_plaza JSONB;
  v_id_sede INTEGER;
  v_id_curso INTEGER;
  v_num_plazas INTEGER;
  v_id_convocatoria_curso INTEGER;
BEGIN
  -- Validar que no exista ya convocatoria para el periodo (UQ_CONVOCATORIA_PERIODO)
  SELECT COUNT(*) INTO v_count FROM "CONVOCATORIA" WHERE "ID_PERIODO" = p_id_periodo;
  IF v_count > 0 THEN
    RAISE EXCEPTION '[CONVOCATORIA_EXISTENTE] Ya existe una convocatoria para el periodo %', p_id_periodo;
  END IF;

  -- Insertar convocatoria
  INSERT INTO "CONVOCATORIA" ("ID_PERIODO", "DESCRIPCION", "FECHA_APERTURA", "FECHA_CIERRE")
  VALUES (p_id_periodo, p_descripcion, p_fecha_apertura, p_fecha_cierre)
  RETURNING "ID_CONVOCATORIA" INTO v_id_convocatoria;

  -- Loop sobre plazas (para obtener ID_CONVOCATORIA_CURSO de cada insert)
  FOR v_plaza IN SELECT * FROM jsonb_array_elements(p_plazas)
  LOOP
    v_id_sede := (v_plaza->>'ID_SEDE')::INTEGER;
    v_id_curso := (v_plaza->>'ID_CURSO')::INTEGER;
    v_num_plazas := (v_plaza->>'NUMERO_PLAZAS')::INTEGER;

    IF v_num_plazas >= 1 THEN
      -- Insertar convocatoria_curso
      INSERT INTO "CONVOCATORIA_CURSO" ("ID_CONVOCATORIA", "ID_SEDE", "ID_CURSO", "NUMERO_PLAZAS")
      VALUES (v_id_convocatoria, v_id_sede, v_id_curso, v_num_plazas)
      RETURNING "ID_CONVOCATORIA_CURSO" INTO v_id_convocatoria_curso;

      -- Insertar N plazas por defecto (PLAZA_DOCENTE)
      INSERT INTO "PLAZA_DOCENTE" ("ID_CONVOCATORIA_CURSO", "ID_PERIODO", "ID_SEDE", "ID_CURSO")
      SELECT v_id_convocatoria_curso, p_id_periodo, v_id_sede, v_id_curso
      FROM generate_series(1, v_num_plazas);
    END IF;
  END LOOP;

  RETURN v_id_convocatoria;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Funcion: añadir plazas a convocatoria_curso (crear plazas).
-- Si (convocatoria, sede, curso) ya existe → NO modifica el máximo, solo crea la plaza.
-- Si no existe → crear nuevo convocatoria_curso con el máximo indicado.
-- Luego crear N plazas en PLAZA_DOCENTE.
-- El trigger trg_validar_max_plazas_convocatoria valida que no se exceda el máximo.
-- Todo atómico.
-- Retorna el ID_CONVOCATORIA_CURSO.
-- ============================================

DROP FUNCTION IF EXISTS fn_add_convocatoria_curso_plazas(INTEGER, INTEGER, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION fn_add_convocatoria_curso_plazas(
  p_id_convocatoria INTEGER,
  p_id_sede INTEGER,
  p_id_curso INTEGER,
  p_num_plazas INTEGER DEFAULT 1
) RETURNS INTEGER AS $$
DECLARE
  v_id_convocatoria_curso INTEGER;
  v_id_periodo INTEGER;
  v_num_actual INTEGER;
BEGIN
  IF p_num_plazas < 1 THEN
    RAISE EXCEPTION '[PLAZAS_INVALIDAS] El numero de plazas debe ser mayor o igual a 1';
  END IF;

  -- Obtener ID_PERIODO de la convocatoria
  SELECT "ID_PERIODO" INTO v_id_periodo
  FROM "CONVOCATORIA"
  WHERE "ID_CONVOCATORIA" = p_id_convocatoria;

  IF v_id_periodo IS NULL THEN
    RAISE EXCEPTION '[CONVOCATORIA_NO_ENCONTRADA] No se encontro la convocatoria %', p_id_convocatoria;
  END IF;

  -- Buscar convocatoria_curso existente
  SELECT "ID_CONVOCATORIA_CURSO", "NUMERO_PLAZAS"
  INTO v_id_convocatoria_curso, v_num_actual
  FROM "CONVOCATORIA_CURSO"
  WHERE "ID_CONVOCATORIA" = p_id_convocatoria
    AND "ID_SEDE" = p_id_sede
    AND "ID_CURSO" = p_id_curso;

  IF v_id_convocatoria_curso IS NOT NULL THEN
    -- EXISTE: no modificar el máximo, solo crear la plaza
    -- El trigger trg_validar_max_plazas_convocatoria valida que no se exceda
    NULL;
  ELSE
    -- NO EXISTE: crear nuevo
    INSERT INTO "CONVOCATORIA_CURSO" ("ID_CONVOCATORIA", "ID_SEDE", "ID_CURSO", "NUMERO_PLAZAS")
    VALUES (p_id_convocatoria, p_id_sede, p_id_curso, p_num_plazas)
    RETURNING "ID_CONVOCATORIA_CURSO" INTO v_id_convocatoria_curso;
  END IF;

  -- Crear N plazas (PLAZA_DOCENTE)
  INSERT INTO "PLAZA_DOCENTE" ("ID_CONVOCATORIA_CURSO", "ID_PERIODO", "ID_SEDE", "ID_CURSO")
  SELECT v_id_convocatoria_curso, v_id_periodo, p_id_sede, p_id_curso
  FROM generate_series(1, p_num_plazas);

  RETURN v_id_convocatoria_curso;
END;
$$ LANGUAGE plpgsql;
