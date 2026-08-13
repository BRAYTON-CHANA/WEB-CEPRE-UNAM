-- ============================================
-- FUNCIONES: Plan Académico
-- ============================================

DROP FUNCTION IF EXISTS fn_cursos_disponibles_plan(INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION fn_cursos_disponibles_plan(
  p_id_plan INTEGER,
  p_id_curso_actual INTEGER DEFAULT NULL
)
RETURNS TABLE (
  id_curso INTEGER,
  nombre_curso TEXT,
  codigo_curso TEXT,
  eje_tematico TEXT,
  estado_plan TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c."ID_CURSO"::INTEGER AS id_curso,
    c."NOMBRE_CURSO"::TEXT AS nombre_curso,
    c."CODIGO_CURSO"::TEXT AS codigo_curso,
    c."EJE_TEMATICO"::TEXT AS eje_tematico,
    CASE
      WHEN c."ID_CURSO" = p_id_curso_actual THEN 'ACTUAL'
      ELSE 'DISPONIBLE'
    END::TEXT AS estado_plan
  FROM "CURSOS" c
  WHERE c."ACTIVO" = TRUE
    AND (
      c."ID_CURSO" = p_id_curso_actual
      OR NOT EXISTS (
        SELECT 1
        FROM "PLAN_ACADEMICO_CURSOS" pac
        WHERE pac."ID_PLAN_ACADEMICO" = p_id_plan
          AND pac."ID_CURSO" = c."ID_CURSO"
      )
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCIONES: validación y conversión de matriz de días
-- ============================================

CREATE OR REPLACE FUNCTION validar_matriz_dias(matriz INTEGER[][])
RETURNS BOOLEAN AS $$
DECLARE
    i INTEGER;
    j INTEGER;
BEGIN
    IF matriz IS NULL THEN
        RETURN TRUE;
    END IF;
    FOR i IN 1..array_length(matriz, 1) LOOP
        FOR j IN 1..array_length(matriz, 2) LOOP
            IF matriz[i][j] IS NOT NULL AND (matriz[i][j] < 1 OR matriz[i][j] > 7) THEN
                RETURN FALSE;
            END IF;
        END LOOP;
    END LOOP;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION convertir_matriz_dias_a_texto(matriz INTEGER[][])
RETURNS TEXT[][] AS $$
DECLARE
    filas INTEGER;
    cols INTEGER;
    resultado TEXT[][];
    i INTEGER;
    j INTEGER;
    valor INTEGER;
BEGIN
    IF matriz IS NULL THEN
        RETURN NULL;
    END IF;
    filas := array_length(matriz, 1);
    IF filas IS NULL THEN
        RETURN NULL;
    END IF;
    cols := array_length(matriz, 2);
    resultado := array_fill(NULL::TEXT, ARRAY[filas, cols]);
    FOR i IN 1..filas LOOP
        FOR j IN 1..cols LOOP
            valor := matriz[i][j];
            IF valor IS NULL THEN
                resultado[i][j] := NULL;
            ELSE
                resultado[i][j] := CASE valor
                    WHEN 1 THEN 'Lunes'
                    WHEN 2 THEN 'Martes'
                    WHEN 3 THEN 'Miércoles'
                    WHEN 4 THEN 'Jueves'
                    WHEN 5 THEN 'Viernes'
                    WHEN 6 THEN 'Sábado'
                    WHEN 7 THEN 'Domingo'
                    ELSE NULL
                END;
            END IF;
        END LOOP;
    END LOOP;
    RETURN resultado;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
