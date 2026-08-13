-- ============================================
-- FUNCIONES DE POSTULACIONES A PLAZAS DOCENTES
-- ============================================

-- Funcion: docentes disponibles para postular a una plaza especifica
-- Excluye docentes que ya tienen postulacion activa en la plaza,
-- pero incluye al docente actual (al editar) marcado como 'ACTUAL'.
DROP FUNCTION IF EXISTS fn_docentes_disponibles_plaza(INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION fn_docentes_disponibles_plaza(
  p_id_plaza_docente INTEGER,
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
        -- Docentes que NO tienen postulacion activa en esta plaza
        NOT EXISTS (
          SELECT 1
          FROM "POSTULACION_PLAZA" pp
          WHERE pp."ID_PLAZA_DOCENTE" = p_id_plaza_docente
            AND pp."ID_DOCENTE" = d."ID_DOCENTE"
            AND pp."ACTIVO" = TRUE
        )
      )
    );
END;
$$ LANGUAGE plpgsql;
