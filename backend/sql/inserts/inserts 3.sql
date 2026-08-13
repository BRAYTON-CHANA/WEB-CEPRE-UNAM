-- ============================================
-- INSERTS: Periodo 2027-I
-- Depende de: create table 3.sql
-- ============================================

INSERT INTO "PERIODOS" ("CODIGO_PERIODO", "NOMBRE_PERIODO", "FECHA_INICIO", "FECHA_FIN", "ACTIVO")
VALUES ('2027-I', '2027 I FASE I', '2027-09-12', '2027-12-06', TRUE)
ON CONFLICT ("CODIGO_PERIODO") DO NOTHING;

-- ============================================
-- INSERTS: Requisitos Docentes por condición laboral
-- Plantillas sin archivo (se suben después desde el admin)
-- Unicidad: (CONDICION_LABORAL, CLASIFICACION, NOMBRE)
-- ============================================

-- ============================================
-- EXTERNO
-- ============================================
INSERT INTO "REQUISITOS_DOCENTES" ("CONDICION_LABORAL", "CLASIFICACION", "NOMBRE", "ACTIVO") VALUES
('EXTERNO', 'CV', 'Curriculum', TRUE),
('EXTERNO', 'CV', 'DNI', TRUE),
('EXTERNO', 'CV', 'Grado Academico', TRUE),
('EXTERNO', 'CV', 'Capacitaciones', TRUE),
('EXTERNO', 'CV', 'Experiencia Laboral', TRUE),
('EXTERNO', 'CV', 'Ficha RUC', TRUE),
('EXTERNO', 'CV', 'Suspension 4ta Categoria', TRUE),
('EXTERNO', 'CV', 'RNP', TRUE),
('EXTERNO', 'ANEXOS', 'Anexo 1 - FUT UNAM', TRUE),
('EXTERNO', 'ANEXOS', 'Anexo 2 - Formato de Hoja de Vida', TRUE),
('EXTERNO', 'ANEXOS', 'Anexo 3 - DJ Nepotismo', TRUE),
('EXTERNO', 'ANEXOS', 'Anexo 4 - DJ Incompatibilidades', TRUE),
('EXTERNO', 'ANEXOS', 'Anexo 5 - DJ Propiedad Intelectual', TRUE),
('EXTERNO', 'ANEXOS', 'Anexo 6 - Compatibilidad Horaria', TRUE),
('EXTERNO', 'ANEXOS', 'Anexo 7 - DJ Compromiso y Cumplimiento Docente', TRUE),
('EXTERNO', 'ANEXOS', 'Anexo 8 - DJ Antecedentes Penales y Judiciales', TRUE)
ON CONFLICT ("CONDICION_LABORAL", "CLASIFICACION", "NOMBRE") DO NOTHING;

-- ============================================
-- CONTRATADO
-- ============================================
INSERT INTO "REQUISITOS_DOCENTES" ("CONDICION_LABORAL", "CLASIFICACION", "NOMBRE", "ACTIVO") VALUES
('CONTRATADO', 'CV', 'Curriculum', TRUE),
('CONTRATADO', 'CV', 'DNI', TRUE),
('CONTRATADO', 'CV', 'Grado Academico', TRUE),
('CONTRATADO', 'CV', 'Capacitaciones', TRUE),
('CONTRATADO', 'CV', 'Experiencia Laboral', TRUE),
('CONTRATADO', 'CV', 'Contrato', TRUE),
('CONTRATADO', 'CV', 'Racionalizacion', TRUE),
('CONTRATADO', 'ANEXOS', 'Anexo 1 - FUT UNAM', TRUE),
('CONTRATADO', 'ANEXOS', 'Anexo 2 - Formato de Hoja de Vida', TRUE),
('CONTRATADO', 'ANEXOS', 'Anexo 3 - DJ Nepotismo', TRUE),
('CONTRATADO', 'ANEXOS', 'Anexo 4 - DJ Incompatibilidades', TRUE),
('CONTRATADO', 'ANEXOS', 'Anexo 5 - DJ Propiedad Intelectual', TRUE),
('CONTRATADO', 'ANEXOS', 'Anexo 6 - Compatibilidad Horaria', TRUE),
('CONTRATADO', 'ANEXOS', 'Anexo 7 - DJ Compromiso y Cumplimiento Docente', TRUE),
('CONTRATADO', 'ANEXOS', 'Anexo 8 - DJ Antecedentes Penales y Judiciales', TRUE)
ON CONFLICT ("CONDICION_LABORAL", "CLASIFICACION", "NOMBRE") DO NOTHING;

-- ============================================
-- ORDINARIO
-- ============================================
INSERT INTO "REQUISITOS_DOCENTES" ("CONDICION_LABORAL", "CLASIFICACION", "NOMBRE", "ACTIVO") VALUES
('ORDINARIO', 'CV', 'Curriculum', TRUE),
('ORDINARIO', 'CV', 'DNI', TRUE),
('ORDINARIO', 'CV', 'Grado Academico', TRUE),
('ORDINARIO', 'CV', 'Capacitaciones', TRUE),
('ORDINARIO', 'CV', 'Experiencia Laboral', TRUE),
('ORDINARIO', 'CV', 'Contrato', TRUE),
('ORDINARIO', 'CV', 'Racionalizacion', TRUE),
('ORDINARIO', 'ANEXOS', 'Anexo 1 - FUT UNAM', TRUE),
('ORDINARIO', 'ANEXOS', 'Anexo 2 - Formato de Hoja de Vida', TRUE),
('ORDINARIO', 'ANEXOS', 'Anexo 3 - DJ Nepotismo', TRUE),
('ORDINARIO', 'ANEXOS', 'Anexo 4 - DJ Incompatibilidades', TRUE),
('ORDINARIO', 'ANEXOS', 'Anexo 5 - DJ Propiedad Intelectual', TRUE),
('ORDINARIO', 'ANEXOS', 'Anexo 6 - Compatibilidad Horaria', TRUE),
('ORDINARIO', 'ANEXOS', 'Anexo 7 - DJ Compromiso y Cumplimiento Docente', TRUE),
('ORDINARIO', 'ANEXOS', 'Anexo 8 - DJ Antecedentes Penales y Judiciales', TRUE)
ON CONFLICT ("CONDICION_LABORAL", "CLASIFICACION", "NOMBRE") DO NOTHING;
