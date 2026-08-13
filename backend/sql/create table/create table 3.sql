-- ============================================
-- ELIMINACIÓN DE TABLAS (si existen)
-- ============================================

DROP TABLE IF EXISTS "POSTULACION_PLAZA" CASCADE;
DROP TABLE IF EXISTS "REQUISITOS_DOCENTES" CASCADE;
DROP TABLE IF EXISTS "PLAZA_DOCENTE" CASCADE;
DROP TABLE IF EXISTS "PERIODOS" CASCADE;

-- ============================================

CREATE TABLE IF NOT EXISTS "PERIODOS" (
    "ID_PERIODO" INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "CODIGO_PERIODO" VARCHAR(20) NOT NULL UNIQUE,
    "NOMBRE_PERIODO" VARCHAR(50) NOT NULL UNIQUE,
    "FECHA_INICIO" DATE,
    "FECHA_FIN" DATE,
    "ACTIVO" BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS "PLAZA_DOCENTE" (
    "ID_PLAZA_DOCENTE" INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "ID_PERIODO" INTEGER NOT NULL,
    "ID_SEDE" INTEGER NOT NULL,
    "ID_CURSO" INTEGER NOT NULL,
    "MODALIDAD" VARCHAR(20) NOT NULL DEFAULT 'PRESENCIAL'
        CHECK ("MODALIDAD" IN ('PRESENCIAL', 'VIRTUAL')),
    "PAGO_POR_HORA" DECIMAL,
    "FECHA_CREACION" TIMESTAMP NOT NULL DEFAULT NOW(),
    "ACTIVO" BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT "FK_PLAZA_DOCENTE_PERIODO"
    FOREIGN KEY ("ID_PERIODO") REFERENCES "PERIODOS" ("ID_PERIODO")
    ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FK_PLAZA_DOCENTE_SEDE"
    FOREIGN KEY ("ID_SEDE") REFERENCES "SEDES" ("ID_SEDE")
    ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FK_PLAZA_DOCENTE_CURSO"
    FOREIGN KEY ("ID_CURSO") REFERENCES "CURSOS" ("ID_CURSO")
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================
-- REQUISITOS_DOCENTES: biblioteca de plantillas por condición laboral
-- Almacena plantillas descargables subidas por admin, agrupadas por
-- CONDICION_LABORAL (tipo de contrato) y CLASIFICACION (categoría libre).
-- El archivo subido siempre es una plantilla.
-- Unicidad por combinación (CONDICION_LABORAL + CLASIFICACION + NOMBRE).
-- ============================================

CREATE TABLE IF NOT EXISTS "REQUISITOS_DOCENTES" (
    "ID_REQUISITO" INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "CONDICION_LABORAL" VARCHAR(20) NOT NULL
        CHECK ("CONDICION_LABORAL" IN ('CONTRATADO', 'EXTERNO', 'ORDINARIO')),
    "CLASIFICACION" VARCHAR(50) NOT NULL,
    "NOMBRE" VARCHAR(100) NOT NULL,
    "DESCRIPCION" TEXT,
    -- Campos de archivo plantilla (subido a Supabase Storage, bucket 'postulaciones-adjuntos')
    "STORAGE_PATH" VARCHAR(500),
    "FILENAME" VARCHAR(255),
    "CONTENT_TYPE" VARCHAR(100),
    "TAMAÑO_BYTES" INTEGER,
    "FECHA_SUBIDA" TIMESTAMP NOT NULL DEFAULT NOW(),
    "ACTIVO" BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT "UQ_REQUISITOS_DOCENTES_COMBINACION"
        UNIQUE ("CONDICION_LABORAL", "CLASIFICACION", "NOMBRE")
);

CREATE INDEX IF NOT EXISTS "IDX_REQUISITOS_DOCENTES_CONDICION_CLASIFICACION"
    ON "REQUISITOS_DOCENTES" ("CONDICION_LABORAL", "CLASIFICACION");

CREATE INDEX IF NOT EXISTS "IDX_REQUISITOS_DOCENTES_ACTIVO"
    ON "REQUISITOS_DOCENTES" ("ACTIVO");

-- ============================================
-- POSTULACION_PLAZA: postulaciones con adjuntos JSONB
-- ADJUNTOS almacena los documentos de postulación agrupados por clasificación,
-- generados a partir de REQUISITOS_DOCENTES (según CONDICION_LABORAL del docente)
-- al momento de crear la postulación. Incluye snapshot inmutable de plantillas.
-- Estructura JSONB (gestionada por el input genérico JsonFilesInput):
-- {
--   "contextLabel": "CONTRATADO",
--   "grupos": {
--     "CV": {
--       "requisitos": [
--         { "id": 12, "nombre": "Curriculum",
--           "plantilla": { "rutaPlantilla": "requisitos/12/...-cv.pdf", "filename": "Plantilla CV.pdf" },
--           "archivo": null | { path, filename, contentType, size, subidoEn } }
--       ],
--       "extras": [ { "id": "extra-uuid", "nombre": "...", "archivo": null|{...} } ]
--     },
--     "ANEXOS": { "requisitos": [...], "extras": [] },
--     "Otros":  { "requisitos": [], "extras": [...] }
--   }
-- }
-- Notas:
--   * `plantilla` es un snapshot inmutable copiado de REQUISITOS_DOCENTES al crear.
--     Solo se setea en predefinidos; persiste en edición aunque el requisito cambie.
--   * `id` es el identificador del predefinido (ej: ID_REQUISITO) o del extra (uuid).
--   * `contextLabel` es la etiqueta del contexto (ej: CONDICION_LABORAL del docente).
--   * Path en Storage: postulaciones/{idPostulacion}/{clasificacion}/{tipo}-{itemId}-{ts}-{name}
--     donde tipo = 'req' (predefinido) o 'ext' (extra).
-- ============================================

CREATE TABLE IF NOT EXISTS "POSTULACION_PLAZA" (
    "ID_POSTULACION" INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "ID_PLAZA_DOCENTE" INTEGER NOT NULL,
    "ID_DOCENTE" INTEGER NOT NULL,
    "FECHA_POSTULACION" TIMESTAMP NOT NULL DEFAULT NOW(),
    "ESTADO" VARCHAR(20) NOT NULL DEFAULT 'postulado',
    "ACEPTADO" BOOLEAN NOT NULL DEFAULT FALSE,
    "FECHA_ACEPTACION" TIMESTAMP,
    "FECHA_ENTREVISTA" TIMESTAMP,
    "ENTREVISTA_REALIZADA" BOOLEAN NOT NULL DEFAULT FALSE,
    "NOTA_ENTREVISTA" TEXT,
    "CONTRATO_FIRMADO" BOOLEAN NOT NULL DEFAULT FALSE,
    "FECHA_CONTRATO" DATE,
    "ADJUNTOS" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "OBSERVACIONES" TEXT,
    "ACTIVO" BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT "CHK_POSTULACION_ESTADO"
    CHECK ("ESTADO" IN ('postulado','en_revision','entrevista','documentos','contratado','descartado')),
    CONSTRAINT "CHK_POSTULACION_ACEPTADO"
    CHECK ("ACEPTADO" = FALSE OR ("ACEPTADO" = TRUE AND "ESTADO" = 'contratado')),
    CONSTRAINT "FK_POSTULACION_PLAZA"
    FOREIGN KEY ("ID_PLAZA_DOCENTE") REFERENCES "PLAZA_DOCENTE" ("ID_PLAZA_DOCENTE")
    ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FK_POSTULACION_DOCENTE"
    FOREIGN KEY ("ID_DOCENTE") REFERENCES "DOCENTES" ("ID_DOCENTE")
    ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UQ_POSTULACION_PLAZA_DOCENTE" UNIQUE ("ID_PLAZA_DOCENTE","ID_DOCENTE")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UQ_POSTULACION_ACEPTADA_POR_PLAZA"
    ON "POSTULACION_PLAZA" ("ID_PLAZA_DOCENTE")
    WHERE "ACEPTADO" = TRUE AND "ACTIVO" = TRUE;

CREATE INDEX IF NOT EXISTS "IDX_POSTULACION_PLAZA_DOCENTE"
    ON "POSTULACION_PLAZA" ("ID_DOCENTE");

CREATE INDEX IF NOT EXISTS "IDX_POSTULACION_PLAZA_ESTADO"
    ON "POSTULACION_PLAZA" ("ESTADO");


