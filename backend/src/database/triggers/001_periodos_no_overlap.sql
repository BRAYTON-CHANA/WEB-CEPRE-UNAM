-- =============================================
-- TRIGGER: PERIODOS_NO_OVERLAP
-- Previene superposición de fechas entre periodos
-- =============================================

-- Trigger BEFORE INSERT
CREATE TRIGGER IF NOT EXISTS trg_periodos_no_overlap_insert
BEFORE INSERT ON PERIODOS
WHEN NEW.FECHA_INICIO IS NOT NULL AND NEW.FECHA_FIN IS NOT NULL
SELECT RAISE(ABORT, 'Error: El periodo se superpone con un periodo existente.')
WHERE EXISTS (
  SELECT 1 FROM PERIODOS
  WHERE 
    -- El nuevo periodo empieza antes de que termine uno existente
    NEW.FECHA_INICIO < FECHA_FIN
    -- Y termina después de que empieza uno existente
    AND NEW.FECHA_FIN > FECHA_INICIO
    -- Y el periodo existente está activo (opcional, comentar si no se desea)
    AND ACTIVO = 1
);

-- Trigger BEFORE UPDATE
CREATE TRIGGER IF NOT EXISTS trg_periodos_no_overlap_update
BEFORE UPDATE OF FECHA_INICIO, FECHA_FIN ON PERIODOS
WHEN NEW.FECHA_INICIO IS NOT NULL AND NEW.FECHA_FIN IS NOT NULL
SELECT RAISE(ABORT, 'Error: El periodo se superpone con un periodo existente.')
WHERE EXISTS (
  SELECT 1 FROM PERIODOS
  WHERE 
    -- Excluir el registro actual (por ID)
    ID_PERIODO != NEW.ID_PERIODO
    -- El periodo actualizado empieza antes de que termine uno existente
    AND NEW.FECHA_INICIO < FECHA_FIN
    -- Y termina después de que empieza uno existente
    AND NEW.FECHA_FIN > FECHA_INICIO
    -- Y el periodo existente está activo (opcional, comentar si no se desea)
    AND ACTIVO = 1
);
