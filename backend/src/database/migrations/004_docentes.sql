-- =============================================
-- MIGRACIÓN 007: DOCENTES
-- Tabla base sin FKs - Docentes del CEPRE
-- Los cursos designados están en DOCENTE_CURSO (N:M)
-- 
-- NOTA: INICIO_ORDINARIO y TERMINO_ORDINARIO solo aplican a docentes ordinarios
-- indicando cuándo se volvieron permanentes. Los docentes de servicio tendrán
-- NULL en estos campos y sus fechas se manejan en DOCENTE_PERIODO.
-- =============================================

CREATE TABLE IF NOT EXISTS DOCENTES (
  ID_DOCENTE INTEGER PRIMARY KEY AUTOINCREMENT,
  DNI VARCHAR(8) NOT NULL UNIQUE,
  APELLIDOS VARCHAR(100) NOT NULL,
  NOMBRES VARCHAR(100) NOT NULL,
  TELEFONO VARCHAR(150),
  EMAIL VARCHAR(100) UNIQUE,
  TIPO_DOCENTE VARCHAR(20) NOT NULL DEFAULT 'ordinario',
  
  -- Fechas de designación como ordinario (solo informativo, para docentes ordinarios)
  -- Para docentes de servicio estos campos serán NULL
  INICIO_ORDINARIO DATE,       -- Fecha cuando se designó como docente ordinario/permanente
  TERMINO_ORDINARIO DATE,      -- Fecha de cese como ordinario (NULL si sigue activo)
  
  ACTIVO BOOLEAN DEFAULT 1,
  
  -- Restricción CHECK para tipos válidos
  CONSTRAINT CHK_TIPO_DOCENTE CHECK (TIPO_DOCENTE IN ('ordinario', 'servicio')),
  -- Validación básica de DNI peruano (8 dígitos)
  CONSTRAINT CHK_DNI_FORMAT CHECK (LENGTH(DNI) = 8 AND DNI GLOB '[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]')
);
