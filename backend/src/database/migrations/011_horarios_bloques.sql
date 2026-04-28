
-- =============================================
-- TABLA: HORARIO_BLOQUES (subtabla de HORARIOS)
-- Define los bloques de tiempo dentro de un horario
-- La hora de inicio se calcula desde HORARIOS.HORA_INICIO_JORNADA + suma de duraciones previas

-- =============================================



CREATE TABLE IF NOT EXISTS HORARIO_BLOQUES (
  ID_BLOQUE INTEGER PRIMARY KEY AUTOINCREMENT,
  ID_HORARIO INTEGER NOT NULL,
  ORDEN INTEGER NOT NULL CHECK (ORDEN > 0),
  DURACION INTEGER NOT NULL CHECK (DURACION > 0),
  TIPO_BLOQUE VARCHAR(10) NOT NULL CHECK (TIPO_BLOQUE IN ('clase', 'break')),
  ETIQUETA VARCHAR(50),
  ACTIVO BOOLEAN DEFAULT 1,
  
  FOREIGN KEY (ID_HORARIO) REFERENCES HORARIOS(ID_HORARIO)
);

-- Índices y constraints únicos
CREATE INDEX IF NOT EXISTS IDX_HORARIO_BLOQUES_HORARIO ON HORARIO_BLOQUES(ID_HORARIO);
CREATE UNIQUE INDEX IF NOT EXISTS UQ_HORARIO_BLOQUE_ORDEN ON HORARIO_BLOQUES(ID_HORARIO, ORDEN);

-- Datos de ejemplo para horario ID 1
INSERT INTO HORARIO_BLOQUES (ID_HORARIO, ORDEN, DURACION, TIPO_BLOQUE, ETIQUETA, ACTIVO)
VALUES 
  (1, 1, 50, 'clase', 'Bloque 1', 1),
  (1, 2, 50, 'clase', 'Bloque 2', 1),
  (1, 3, 50, 'clase', 'Bloque 3', 1),
  (1, 4, 20, 'break', 'Break', 1),
  (1, 5, 50, 'clase', 'Bloque 4', 1),
  (1, 6, 50, 'clase', 'Bloque 5', 1),
  (1, 7, 50, 'clase', 'Bloque 6', 1),
  (1, 8, 50, 'clase', 'Bloque 7', 1),

  (1, 9, 70, 'break', 'Break', 1),

  (1, 10, 50, 'clase', 'Bloque 8', 1),
  (1, 11, 50, 'clase', 'Bloque 9', 1),
  (1, 12, 50, 'clase', 'Bloque 10', 1),
  (1, 13, 20, 'break', 'Break', 1),
  (1, 14, 50, 'clase', 'Bloque 11', 1),
  (1, 15, 50, 'clase', 'Bloque 12', 1);

INSERT INTO HORARIO_BLOQUES (ID_HORARIO, ORDEN, DURACION, TIPO_BLOQUE, ETIQUETA, ACTIVO)
VALUES 
  (2, 1, 50, 'clase', 'Bloque 1', 1),
  (2, 2, 50, 'clase', 'Bloque 2', 1),
  (2, 3, 50, 'clase', 'Bloque 3', 1),
  (2, 4, 20, 'break', 'Break', 1),
  (2, 5, 50, 'clase', 'Bloque 4', 1),
  (2, 6, 50, 'clase', 'Bloque 5', 1),
  (2, 7, 50, 'clase', 'Bloque 6', 1),
  (2, 8, 50, 'clase', 'Bloque 7', 1),

  (2, 9, 50, 'break', 'Break', 1),

  (2, 10, 50, 'clase', 'Bloque 8', 1),
  (2, 11, 50, 'clase', 'Bloque 9', 1),
  (2, 12, 50, 'clase', 'Bloque 10', 1),
  (2, 13, 20, 'break', 'Break', 1),
  (2, 14, 50, 'clase', 'Bloque 11', 1),
  (2, 15, 50, 'clase', 'Bloque 12', 1);
