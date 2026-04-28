-- =============================================
-- MIGRACIÓN 013: DOCENTE_CURSO
-- Tabla intermedia N:M - Especialidad de docentes
-- Un docente puede tener múltiples cursos designados
-- Indica qué cursos puede enseñar cada docente
-- =============================================

CREATE TABLE IF NOT EXISTS DOCENTE_CURSO (
  ID_DOCENTE_CURSO INTEGER PRIMARY KEY AUTOINCREMENT,
  ID_DOCENTE INTEGER NOT NULL,
  ID_CURSO INTEGER NOT NULL,  -- Referencia directa a CURSOS
  ACTIVO BOOLEAN DEFAULT 1,
  
  -- Foreign Keys
  FOREIGN KEY (ID_DOCENTE) REFERENCES DOCENTES(ID_DOCENTE) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (ID_CURSO) REFERENCES CURSOS(ID_CURSO) ON DELETE RESTRICT ON UPDATE CASCADE,
  
  -- Solo un registro por docente-curso
  CONSTRAINT UQ_DOCENTE_CURSO UNIQUE (ID_DOCENTE, ID_CURSO)
);

-- Crear índices
CREATE INDEX IF NOT EXISTS IDX_DOCENTE_CURSO_DOCENTE ON DOCENTE_CURSO(ID_DOCENTE);
CREATE INDEX IF NOT EXISTS IDX_DOCENTE_CURSO_CURSO ON DOCENTE_CURSO(ID_CURSO);

-- =============================================
-- INSERTS: Relacionar docentes con sus cursos especializados
-- Basado en los nombres de docentes en 006_docentes.sql
-- 24 docentes (2 por curso) relacionados con sus 12 cursos
-- =============================================
