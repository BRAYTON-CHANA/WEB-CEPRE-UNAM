# Database Schema Summary

> **Source:** `backend/src/database/migrations/*.sql`  
> **Total tables:** 17 | **Ignored:** All INSERT/seed data

---

## Table of Contents



- [022. ASIGNACION_HORARIO](#022-asignacion_horario)



## 022. ASIGNACION_HORARIO

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| ID_ASIGNACION_HORARIO | INTEGER | PK, AUTOINCREMENT | — |
| ID_GRUPO_PLAN_CURSO | INTEGER | NOT NULL, FK | — |
| ID_HORARIO_BLOQUE | INTEGER | NOT NULL, FK | — |
| FECHA | DATE | NOT NULL | — |

**FKs:**
- `ID_GRUPO_PLAN_CURSO` → `GRUPO_PLAN_CURSO(ID_GRUPO_PLAN_CURSO)` — `ON DELETE CASCADE`, `ON UPDATE CASCADE`
- `ID_HORARIO_BLOQUE` → `HORARIO_BLOQUES(ID_BLOQUE)` — `ON DELETE CASCADE`, `ON UPDATE CASCADE`

**Constraints:**
- `UQ_ASIGNACION_HORARIO`: `UNIQUE (ID_GRUPO_PLAN_CURSO, ID_HORARIO_BLOQUE, FECHA)`

**Indexes:**
- `IDX_ASIGNACION_HORARIO_GRUPO_PLAN_CURSO` on `ID_GRUPO_PLAN_CURSO`
- `IDX_ASIGNACION_HORARIO_HORARIO_BLOQUE` on `ID_HORARIO_BLOQUE`
- `IDX_ASIGNACION_HORARIO_FECHA` on `FECHA`

---

*End of schema summary.*
