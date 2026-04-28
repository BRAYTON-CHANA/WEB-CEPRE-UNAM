-- =============================================
-- MIGRACIÓN 003: AULAS
-- Tabla base sin FKs - Aulas físicas y virtuales
-- =============================================

CREATE TABLE IF NOT EXISTS AULAS (
  ID_AULA INTEGER PRIMARY KEY AUTOINCREMENT,
  ID_SEDE INTEGER NOT NULL,
  NOMBRE_AULA VARCHAR(50) NOT NULL,
  UBICACION VARCHAR(100),
  TIPO VARCHAR(20) NOT NULL DEFAULT 'presencial',
  ENLACE_VIRTUAL VARCHAR(255),
  CAPACIDAD INTEGER,
  ACTIVO BOOLEAN DEFAULT 1,
  
  -- Foreign Key
  FOREIGN KEY (ID_SEDE) REFERENCES SEDES(ID_SEDE) ON DELETE RESTRICT ON UPDATE CASCADE,
  
  -- Restricción CHECK para tipos válidos
  CONSTRAINT CHK_TIPO_AULA CHECK (TIPO IN ('presencial', 'virtual', 'hibrida')),
  
  -- Solo un nombre de aula por sede
  CONSTRAINT UQ_AULA_SEDE UNIQUE (ID_SEDE, NOMBRE_AULA)
);
-- Insertar aulas de ejemplo (4 por sede)
INSERT INTO AULAS (ID_SEDE, NOMBRE_AULA, UBICACION, TIPO, CAPACIDAD) VALUES 
  (1, 'Aula 301 - Medicina', 'Pabellón Medicina, 3er Piso', 'presencial', 40),
  (1, 'Aula 302 - Medicina', 'Pabellón Medicina, 3er Piso', 'presencial', 40),
  (1, 'Aula 303 - Medicina', 'Pabellón Medicina, 3er Piso', 'presencial', 40),
  (1, 'Aula 304 - Medicina', 'Pabellón Medicina, 3er Piso', 'presencial', 40),
  (1, 'Aula 201 - Medicina', 'Pabellón Medicina, 2er Piso', 'presencial', 40),
  (1, 'Aula 301 - Gestion', 'Pabellón Gestión, 3er Piso', 'presencial', 40),
  (1, 'Aula 302 - Gestion', 'Pabellón Gestión, 2er Piso', 'presencial', 40),
  (1, 'Aula 303 - Gestion', 'Pabellón Gestión, 2er Piso', 'presencial', 40),

  (2, 'Aula 101 - Pesquera', 'Pabellón Pesquera, 1er Piso', 'presencial', 40),
  (2, 'Aula 102 - Pesquera', 'Pabellón Pesquera, 1er Piso', 'presencial', 40),
  (2, 'Aula 103 - Pesquera', 'Pabellón Pesquera, 1er Piso', 'presencial', 40),
  (2, 'Aula 104 - Pesquera', 'Pabellón Pesquera, 1er Piso', 'presencial', 40);

