-- =============================================
-- MIGRACIÓN 014: TURNOS
-- Tabla de turnos de estudio
-- Los horarios específicos por período están en TURNO_PERIODO
-- =============================================

CREATE TABLE IF NOT EXISTS TURNOS (
  ID_TURNO INTEGER PRIMARY KEY AUTOINCREMENT,
  NOMBRE_TURNO VARCHAR(20) NOT NULL,
  DESCRIPCION VARCHAR(100),  -- Ej: "Sábados y domingos", "Lunes a viernes"
  ID_HORARIO INTEGER,        -- Horario asociado al turno (puede ser NULL)
  ACTIVO BOOLEAN DEFAULT 1,
  FOREIGN KEY (ID_HORARIO) REFERENCES HORARIOS(ID_HORARIO)
);

-- Crear índice para búsquedas por horario
CREATE INDEX IF NOT EXISTS IDX_TURNOS_HORARIO ON TURNOS(ID_HORARIO);

-- Insertar turnos del CEPRE
-- Sab. a Dom. → Jornada 7:10-19:00 (ID_HORARIO = 1)
-- Moquegua, Ilo → Jornada 7:30-19:00 (ID_HORARIO = 2)
INSERT INTO TURNOS (NOMBRE_TURNO, DESCRIPCION, ID_HORARIO) VALUES 
  ('Sab. a Dom.', 'Sabados y Domingos (Moquegua)', 1),
  ('Sab. a Dom.', 'Sabados y Domingos (Ilo)', 2 );

