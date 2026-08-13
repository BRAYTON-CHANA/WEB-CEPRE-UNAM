-- ============================================
-- INSERTS: Planes Académicos 2026
-- ============================================

-- Planes por área
INSERT INTO "PLAN_ACADEMICO" ("ID_AREA", "DESCRIPCION", "ACTIVO")
SELECT "ID_AREA", 'PLAN ACADEMICO SOCIALES 2026', TRUE FROM "AREAS" WHERE "NOMBRE_AREA" = 'SOCIALES'
ON CONFLICT ("DESCRIPCION") DO NOTHING;

INSERT INTO "PLAN_ACADEMICO" ("ID_AREA", "DESCRIPCION", "ACTIVO")
SELECT "ID_AREA", 'PLAN ACADEMICO INGENIERIAS 2026', TRUE FROM "AREAS" WHERE "NOMBRE_AREA" = 'INGENIERIAS'
ON CONFLICT ("DESCRIPCION") DO NOTHING;

INSERT INTO "PLAN_ACADEMICO" ("ID_AREA", "DESCRIPCION", "ACTIVO")
SELECT "ID_AREA", 'PLAN ACADEMICO SALUD 2026', TRUE FROM "AREAS" WHERE "NOMBRE_AREA" = 'SALUD'
ON CONFLICT ("DESCRIPCION") DO NOTHING;

-- Cursos del plan SOCIALES 2026
WITH plan_id AS (
  SELECT "ID_PLAN" AS id FROM "PLAN_ACADEMICO" WHERE "DESCRIPCION" = 'PLAN ACADEMICO SOCIALES 2026'
)
INSERT INTO "PLAN_ACADEMICO_CURSOS" ("ID_PLAN_ACADEMICO", "ID_CURSO", "HORAS_ACADEMICAS_CICLO", "HORAS_ACADEMICAS_TOTALES", "ACTIVO")
SELECT p.id, c."ID_CURSO", n.horas_ciclo, n.horas_total, TRUE
FROM plan_id p
CROSS JOIN (
  VALUES
    ('ARITMETICA-ALGEBRA', 3, 21),
    ('GEOMETRIA-TRIGONOMETRIA', 3, 21),
    ('RAZONAMIENTO MATEMATICO', 6, 42),
    ('LENGUAJE', 4, 28),
    ('LITERATURA', 3, 21),
    ('RAZONAMIENTO VERBAL', 6, 42),
    ('HISTORIA', 2, 14),
    ('GEOGRAFIA', 3, 21),
    ('ECONOMIA', 3, 21),
    ('BIOLOGIA', 2, 14)
) AS n(nombre, horas_ciclo, horas_total)
JOIN "CURSOS" c ON c."NOMBRE_CURSO" = n.nombre
ON CONFLICT ("ID_PLAN_ACADEMICO", "ID_CURSO") DO NOTHING;

-- Cursos del plan INGENIERIAS 2026
WITH plan_id AS (
  SELECT "ID_PLAN" AS id FROM "PLAN_ACADEMICO" WHERE "DESCRIPCION" = 'PLAN ACADEMICO INGENIERIAS 2026'
)
INSERT INTO "PLAN_ACADEMICO_CURSOS" ("ID_PLAN_ACADEMICO", "ID_CURSO", "HORAS_ACADEMICAS_CICLO", "HORAS_ACADEMICAS_TOTALES", "ACTIVO")
SELECT p.id, c."ID_CURSO", n.horas_ciclo, n.horas_total, TRUE
FROM plan_id p
CROSS JOIN (
  VALUES
    ('ARITMETICA-ALGEBRA', 4, 28),
    ('GEOMETRIA-TRIGONOMETRIA', 3, 21),
    ('RAZONAMIENTO MATEMATICO', 6, 42),
    ('LENGUAJE', 3, 21),
    ('RAZONAMIENTO VERBAL', 6, 42),
    ('HISTORIA', 2, 14),
    ('GEOGRAFIA', 2, 14),
    ('BIOLOGIA', 3, 21),
    ('FISICA', 3, 21),
    ('QUIMICA', 3, 21)
) AS n(nombre, horas_ciclo, horas_total)
JOIN "CURSOS" c ON c."NOMBRE_CURSO" = n.nombre
ON CONFLICT ("ID_PLAN_ACADEMICO", "ID_CURSO") DO NOTHING;

-- Cursos del plan SALUD 2026
WITH plan_id AS (
  SELECT "ID_PLAN" AS id FROM "PLAN_ACADEMICO" WHERE "DESCRIPCION" = 'PLAN ACADEMICO SALUD 2026'
)
INSERT INTO "PLAN_ACADEMICO_CURSOS" ("ID_PLAN_ACADEMICO", "ID_CURSO", "HORAS_ACADEMICAS_CICLO", "HORAS_ACADEMICAS_TOTALES", "ACTIVO")
SELECT p.id, c."ID_CURSO", n.horas_ciclo, n.horas_total, TRUE
FROM plan_id p
CROSS JOIN (
  VALUES
    ('ARITMETICA-ALGEBRA', 3, 21),
    ('GEOMETRIA-TRIGONOMETRIA', 3, 21),
    ('RAZONAMIENTO MATEMATICO', 6, 42),
    ('LENGUAJE', 2, 14),
    ('RAZONAMIENTO VERBAL', 6, 42),
    ('HISTORIA', 2, 14),
    ('FISICA', 3, 21),
    ('QUIMICA', 4, 28),
    ('BIOLOGIA', 6, 42)
) AS n(nombre, horas_ciclo, horas_total)
JOIN "CURSOS" c ON c."NOMBRE_CURSO" = n.nombre
ON CONFLICT ("ID_PLAN_ACADEMICO", "ID_CURSO") DO NOTHING;

-- ============================================
-- INSERTS: Horario "Sab-Dom (Mañana-Tarde)" - Sede MOQUEGUA
-- ============================================

INSERT INTO "HORARIOS" ("ID_SEDE", "NOMBRE_HORARIO", "HORA_INICIO_JORNADA", "HORA_FIN_JORNADA", "ACTIVO", "MATRIZ_DIAS")
SELECT s."ID_SEDE", 'Sab-Dom (Mañana-Tarde)', '07:10:00', '19:00:00', TRUE, ARRAY[[6,7,6],[7,6,7]]
FROM "SEDES" s
WHERE s."NOMBRE_SEDE" = 'MOQUEGUA'
ON CONFLICT ("ID_SEDE", "NOMBRE_HORARIO") DO NOTHING;

-- Bloques del horario (15 bloques: 12 clases + 3 breaks)
WITH horario_id AS (
  SELECT h."ID_HORARIO" AS id
  FROM "HORARIOS" h
  JOIN "SEDES" s ON s."ID_SEDE" = h."ID_SEDE"
  WHERE s."NOMBRE_SEDE" = 'MOQUEGUA' AND h."NOMBRE_HORARIO" = 'Sab-Dom (Mañana-Tarde)'
)
INSERT INTO "HORARIO_BLOQUES" ("ID_HORARIO", "ORDEN", "DURACION", "TIPO_BLOQUE", "ETIQUETA", "ACTIVO")
SELECT h.id, n.orden, n.duracion, n.tipo, n.etiqueta, TRUE
FROM horario_id h
CROSS JOIN (
  VALUES
    (1,  50, 'clase',  'Bloque 1'),
    (2,  50, 'clase',  'Bloque 2'),
    (3,  50, 'clase',  'Bloque 3'),
    (4,  20, 'break',  'Recreo'),
    (5,  50, 'clase',  'Bloque 4'),
    (6,  50, 'clase',  'Bloque 5'),
    (7,  50, 'clase',  'Bloque 6'),
    (8,  50, 'clase',  'Bloque 7'),
    (9,  70, 'break',  'Almuerzo'),
    (10, 50, 'clase',  'Bloque 8'),
    (11, 50, 'clase',  'Bloque 9'),
    (12, 50, 'clase',  'Bloque 10'),
    (13, 20, 'break',  'Recreo'),
    (14, 50, 'clase',  'Bloque 11'),
    (15, 50, 'clase',  'Bloque 12')
) AS n(orden, duracion, tipo, etiqueta)
ON CONFLICT ("ID_HORARIO", "ORDEN") DO NOTHING;


-- ============================================
-- INSERTS: Horario "Sab-Dom (Mañana-Tarde)" - Sede ILO
-- ============================================

INSERT INTO "HORARIOS" ("ID_SEDE", "NOMBRE_HORARIO", "HORA_INICIO_JORNADA", "HORA_FIN_JORNADA", "ACTIVO", "MATRIZ_DIAS")
SELECT s."ID_SEDE", 'Sab-Dom (Mañana-Tarde)', '07:30:00', '19:00:00', TRUE, ARRAY[[6,7,6],[7,6,7]]
FROM "SEDES" s
WHERE s."NOMBRE_SEDE" = 'ILO'
ON CONFLICT ("ID_SEDE", "NOMBRE_HORARIO") DO NOTHING;

-- Bloques del horario (15 bloques: 12 clases + 3 breaks)
WITH horario_id AS (
  SELECT h."ID_HORARIO" AS id
  FROM "HORARIOS" h
  JOIN "SEDES" s ON s."ID_SEDE" = h."ID_SEDE"
  WHERE s."NOMBRE_SEDE" = 'ILO' AND h."NOMBRE_HORARIO" = 'Sab-Dom (Mañana-Tarde)'
)
INSERT INTO "HORARIO_BLOQUES" ("ID_HORARIO", "ORDEN", "DURACION", "TIPO_BLOQUE", "ETIQUETA", "ACTIVO")
SELECT h.id, n.orden, n.duracion, n.tipo, n.etiqueta, TRUE
FROM horario_id h
CROSS JOIN (
  VALUES
    (1,  50, 'clase',  'Bloque 1'),
    (2,  50, 'clase',  'Bloque 2'),
    (3,  50, 'clase',  'Bloque 3'),
    (4,  50, 'clase',  'Bloque 4'),
    (5,  20, 'break',  'Recreo'),
    (6,  50, 'clase',  'Bloque 5'),
    (7,  50, 'clase',  'Bloque 6'),
    (8,  50, 'clase',  'Bloque 7'),
    (9,  50, 'break',  'Almuerzo'),
    (10, 50, 'clase',  'Bloque 8'),
    (11, 50, 'clase',  'Bloque 9'),
    (12, 50, 'clase',  'Bloque 10'),
    (13, 20, 'break',  'Recreo'),
    (14, 50, 'clase',  'Bloque 11'),
    (15, 50, 'clase',  'Bloque 12')
) AS n(orden, duracion, tipo, etiqueta)
ON CONFLICT ("ID_HORARIO", "ORDEN") DO NOTHING;


