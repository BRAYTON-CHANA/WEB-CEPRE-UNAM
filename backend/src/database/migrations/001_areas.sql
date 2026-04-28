-- =============================================
-- MIGRACIÓN 002: AREAS
-- Tabla base sin FKs - Áreas académicas
-- =============================================

CREATE TABLE IF NOT EXISTS AREAS (
  ID_AREA INTEGER PRIMARY KEY AUTOINCREMENT,
  NOMBRE_AREA VARCHAR(20) NOT NULL UNIQUE,
  ACTIVO BOOLEAN DEFAULT 1
);
-- Insertar áreas académicas del CEPRE
INSERT INTO AREAS (NOMBRE_AREA) VALUES 
  ('INGENIERIAS'),
  ('SALUD'),
  ('SOCIALES');
