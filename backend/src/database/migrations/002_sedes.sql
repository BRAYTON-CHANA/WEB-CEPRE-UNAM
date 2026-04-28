-- =============================================
-- MIGRACIÓN 001: SEDES
-- Tabla base sin FKs - Sedes del CEPRE
-- =============================================

CREATE TABLE IF NOT EXISTS SEDES (
  ID_SEDE INTEGER PRIMARY KEY AUTOINCREMENT,
  NOMBRE_SEDE VARCHAR(50) NOT NULL UNIQUE,
  ACTIVO BOOLEAN DEFAULT 1
);

-- Insertar sedes iniciales del CEPRE UNAM
INSERT INTO SEDES (NOMBRE_SEDE) VALUES 
  ('MOQUEGUA'),
  ('ILO');

