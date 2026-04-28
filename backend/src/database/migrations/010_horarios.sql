-- =============================================
-- MIGRACIÓN 013: HORARIOS
-- Plantilla de jornada reutilizable
-- =============================================

-- =============================================
-- TABLA: HORARIOS (plantilla de jornada reutilizable)
-- =============================================
CREATE TABLE IF NOT EXISTS HORARIOS (
  ID_HORARIO INTEGER PRIMARY KEY AUTOINCREMENT,
  NOMBRE_HORARIO VARCHAR(50) NOT NULL UNIQUE,
  HORA_INICIO_JORNADA TIME NOT NULL,
  HORA_FIN_JORNADA TIME NOT NULL,
  ACTIVO BOOLEAN DEFAULT 1
);

-- Crear índice para búsquedas por nombre
CREATE INDEX IF NOT EXISTS IDX_HORARIOS_NOMBRE ON HORARIOS(NOMBRE_HORARIO);

-- Insertar horarios del CEPRE
INSERT INTO HORARIOS (NOMBRE_HORARIO, HORA_INICIO_JORNADA, HORA_FIN_JORNADA) VALUES
  ('Jornada 7:10-19:00', '07:10:00', '19:00:00'),
  ('Jornada 7:30-19:00', '07:30:00', '19:00:00');
