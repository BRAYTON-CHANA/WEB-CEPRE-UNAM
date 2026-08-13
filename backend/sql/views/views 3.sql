-- ============================================
-- VISTAS: Períodos, Plazas y Postulaciones
-- Tablas de create table 3.sql
-- ============================================

-- Vista unificada: plazas docentes + postulación aceptada + flag de plaza activa
DROP VIEW IF EXISTS "VW_PLAZA_DOCENTE_ASIGNADA";
CREATE OR REPLACE VIEW "VW_PLAZA_DOCENTE_ASIGNADA" AS
SELECT
    pd."ID_PLAZA_DOCENTE",
    pd."ID_PERIODO",
    p."CODIGO_PERIODO",
    p."NOMBRE_PERIODO",
    pd."ID_SEDE",
    s."CODIGO_SEDE",
    s."NOMBRE_SEDE",
    pd."ID_CURSO",
    c."CODIGO_CURSO",
    c."NOMBRE_CURSO",
    c."EJE_TEMATICO",
    pd."MODALIDAD",
    p."CODIGO_PERIODO" || '-' || s."CODIGO_SEDE" || '-' ||
        CASE WHEN pd."MODALIDAD" = 'PRESENCIAL' THEN 'P' ELSE 'V' END || '-' || c."CODIGO_CURSO" || '-' ||
        ROW_NUMBER() OVER (
            PARTITION BY pd."ID_PERIODO", pd."ID_SEDE", pd."MODALIDAD", pd."ID_CURSO"
            ORDER BY pd."FECHA_CREACION", pd."ID_PLAZA_DOCENTE"
        ) AS "IDENTIFICADOR_DOCENTE",
    pd."PAGO_POR_HORA",
    pd."FECHA_CREACION",
    pd."ACTIVO" AS "PLAZA_ACTIVO",
    pp."ID_POSTULACION",
    pp."FECHA_POSTULACION",
    pp."FECHA_ACEPTACION",
    pp."FECHA_CONTRATO",
    pp."CONTRATO_FIRMADO",
    u."DNI",
    d."RUC",
    COALESCE(NULLIF(TRIM(CONCAT_WS(' ', u."APELLIDOS", u."NOMBRES")), ''), 'Sin asignar') AS "DOCENTE_NOMBRE"
FROM "PLAZA_DOCENTE" pd
JOIN "PERIODOS" p ON p."ID_PERIODO" = pd."ID_PERIODO"
JOIN "SEDES" s ON s."ID_SEDE" = pd."ID_SEDE"
JOIN "CURSOS" c ON c."ID_CURSO" = pd."ID_CURSO"
LEFT JOIN "POSTULACION_PLAZA" pp
    ON pp."ID_PLAZA_DOCENTE" = pd."ID_PLAZA_DOCENTE"
    AND pp."ACEPTADO" = TRUE
    AND pp."ACTIVO" = TRUE
LEFT JOIN "DOCENTES" d
    ON d."ID_DOCENTE" = pp."ID_DOCENTE"
LEFT JOIN "USUARIOS" u
    ON u."ID_USUARIO" = d."ID_USUARIO";

-- ============================================
-- Vista VW_PERIODOS
-- ============================================

DROP VIEW IF EXISTS "VW_PERIODOS";
CREATE OR REPLACE VIEW "VW_PERIODOS" AS
SELECT
    p."ID_PERIODO",
    p."CODIGO_PERIODO",
    p."NOMBRE_PERIODO",
    p."FECHA_INICIO",
    p."FECHA_FIN",
    p."ACTIVO",
    p."CODIGO_PERIODO" || ' - ' || p."NOMBRE_PERIODO" AS "PERIODO_NOMBRE"
FROM "PERIODOS" p;

-- ============================================
-- Vista VW_REQUISITOS_DOCENTES
-- ============================================

DROP VIEW IF EXISTS "VW_REQUISITOS_DOCENTES";
CREATE OR REPLACE VIEW "VW_REQUISITOS_DOCENTES" AS
SELECT
    r."ID_REQUISITO",
    r."CONDICION_LABORAL",
    r."CLASIFICACION",
    r."NOMBRE",
    r."DESCRIPCION",
    r."STORAGE_PATH",
    r."FILENAME",
    r."CONTENT_TYPE",
    r."TAMAÑO_BYTES",
    r."FECHA_SUBIDA",
    r."ACTIVO"
FROM "REQUISITOS_DOCENTES" r
ORDER BY r."CONDICION_LABORAL", r."CLASIFICACION", r."NOMBRE";

-- ============================================
-- Vista VW_POSTULACIONES_PLAZA
-- ============================================

DROP VIEW IF EXISTS "VW_POSTULACIONES_PLAZA";
CREATE OR REPLACE VIEW "VW_POSTULACIONES_PLAZA" AS
SELECT
    pp."ID_POSTULACION",
    pp."ID_PLAZA_DOCENTE",
    pd."ID_PERIODO",
    p."CODIGO_PERIODO",
    p."NOMBRE_PERIODO",
    pd."ID_SEDE",
    s."CODIGO_SEDE",
    s."NOMBRE_SEDE",
    pd."ID_CURSO",
    c."CODIGO_CURSO",
    c."NOMBRE_CURSO",
    c."EJE_TEMATICO",
    pd."MODALIDAD",
    p."CODIGO_PERIODO" || '-' || s."CODIGO_SEDE" || '-' ||
        CASE WHEN pd."MODALIDAD" = 'PRESENCIAL' THEN 'P' ELSE 'V' END || '-' || c."CODIGO_CURSO" || '-' ||
        ROW_NUMBER() OVER (
            PARTITION BY pd."ID_PERIODO", pd."ID_SEDE", pd."MODALIDAD", pd."ID_CURSO"
            ORDER BY pd."FECHA_CREACION", pd."ID_PLAZA_DOCENTE"
        ) AS "IDENTIFICADOR_DOCENTE",
    pd."PAGO_POR_HORA",
    d."ID_DOCENTE",
    u."DNI",
    u."APELLIDOS" || ' ' || u."NOMBRES" AS "DOCENTE_NOMBRE",
    pp."FECHA_POSTULACION",
    pp."ESTADO",
    pp."ACEPTADO",
    pp."FECHA_ACEPTACION",
    pp."FECHA_ENTREVISTA",
    pp."ENTREVISTA_REALIZADA",
    pp."NOTA_ENTREVISTA",
    pp."CONTRATO_FIRMADO",
    pp."FECHA_CONTRATO",
    pp."ADJUNTOS",
    pp."OBSERVACIONES",
    pp."ACTIVO"
FROM "POSTULACION_PLAZA" pp
JOIN "PLAZA_DOCENTE" pd ON pd."ID_PLAZA_DOCENTE" = pp."ID_PLAZA_DOCENTE"
JOIN "PERIODOS" p ON p."ID_PERIODO" = pd."ID_PERIODO"
JOIN "SEDES" s ON s."ID_SEDE" = pd."ID_SEDE"
JOIN "CURSOS" c ON c."ID_CURSO" = pd."ID_CURSO"
JOIN "DOCENTES" d ON d."ID_DOCENTE" = pp."ID_DOCENTE"
JOIN "USUARIOS" u ON u."ID_USUARIO" = d."ID_USUARIO";

