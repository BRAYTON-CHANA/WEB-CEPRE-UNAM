-- =============================================
-- TRIGGER: GRUPO_PLAN_CURSO_PLAN_MATCH
-- Verifica que el curso del plan pertenezca al mismo plan que el grupo
-- =============================================

-- Trigger BEFORE INSERT
CREATE TRIGGER IF NOT EXISTS trg_grupo_plan_curso_plan_match_insert
BEFORE INSERT ON GRUPO_PLAN_CURSO
SELECT RAISE(ABORT, 'Error: El curso del plan no pertenece al plan académico del grupo.')
WHERE NOT EXISTS (
  SELECT 1 
  FROM GRUPOS g
  INNER JOIN PLAN_ACADEMICO_CURSOS pac ON pac.ID_PLAN_ACADEMICO_CURSO = NEW.ID_PLAN_ACADEMICO_CURSO
  WHERE g.ID_GRUPO = NEW.ID_GRUPO
  AND g.ID_PLAN = pac.ID_PLAN_ACADEMICO
);

-- Trigger BEFORE UPDATE
CREATE TRIGGER IF NOT EXISTS trg_grupo_plan_curso_plan_match_update
BEFORE UPDATE OF ID_GRUPO, ID_PLAN_ACADEMICO_CURSO ON GRUPO_PLAN_CURSO
SELECT RAISE(ABORT, 'Error: El curso del plan no pertenece al plan académico del grupo.')
WHERE NOT EXISTS (
  SELECT 1 
  FROM GRUPOS g
  INNER JOIN PLAN_ACADEMICO_CURSOS pac ON pac.ID_PLAN_ACADEMICO_CURSO = NEW.ID_PLAN_ACADEMICO_CURSO
  WHERE g.ID_GRUPO = NEW.ID_GRUPO
  AND g.ID_PLAN = pac.ID_PLAN_ACADEMICO
);
