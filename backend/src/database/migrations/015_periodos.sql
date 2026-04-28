-- =============================================
-- MIGRACIÓN 005: PERIODOS
-- Tabla base sin FKs - Períodos académicos
-- =============================================

CREATE TABLE IF NOT EXISTS PERIODOS (
  ID_PERIODO INTEGER PRIMARY KEY AUTOINCREMENT,
  CODIGO_PERIODO VARCHAR(10) NOT NULL UNIQUE,
  FECHA_INICIO DATE,
  FECHA_FIN DATE,
  ESTADO VARCHAR(15) DEFAULT 'activo',
  ACTIVO BOOLEAN DEFAULT 1,
  
  -- Restricción CHECK para estados válidos
  CONSTRAINT CHK_ESTADO_PERIODO CHECK (ESTADO IN ('planificado', 'activo', 'finalizado', 'cancelado'))
);
-- Insertar períodos de ejemplo
INSERT INTO PERIODOS (CODIGO_PERIODO, FECHA_INICIO, FECHA_FIN, ESTADO) VALUES 
  ('2026-III', '2026-05-16', '2026-07-25', 'planificado'),
  ('2026-II', '2026-01-19', '2026-03-08', 'planificado');
