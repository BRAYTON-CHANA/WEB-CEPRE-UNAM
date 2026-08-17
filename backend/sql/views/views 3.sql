-- ============================================
-- VISTAS: Períodos, Convocatorias, Plazas y Postulaciones
-- Tablas de create table 3.sql
-- ============================================

-- Vista unificada: plazas docentes + postulación aceptada + flag de plaza activa
DROP VIEW IF EXISTS "VW_PLAZA_DOCENTE_ASIGNADA";
CREATE OR REPLACE VIEW "VW_PLAZA_DOCENTE_ASIGNADA" AS
SELECT
    pd."ID_PLAZA_DOCENTE",
    pd."ID_CONVOCATORIA_CURSO",
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
    p."CODIGO_PERIODO" || '-' || s."CODIGO_SEDE" || '-' || c."CODIGO_CURSO" || '-' ||
        ROW_NUMBER() OVER (
            PARTITION BY pd."ID_PERIODO", pd."ID_SEDE", pd."ID_CURSO"
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
    AND pp."ACTIVO" = TRUE
LEFT JOIN "DOCENTES" d
    ON d."ID_DOCENTE" = pp."ID_DOCENTE"
LEFT JOIN "USUARIOS" u
    ON u."ID_USUARIO" = d."ID_USUARIO";

-- ============================================
-- Vista VW_CONVOCATORIAS
-- Muestra convocatorias (1 por periodo) con datos del periodo.
-- ============================================

DROP VIEW IF EXISTS "VW_CONVOCATORIAS";
CREATE OR REPLACE VIEW "VW_CONVOCATORIAS" AS
SELECT
    cv."ID_CONVOCATORIA",
    cv."ID_PERIODO",
    p."CODIGO_PERIODO",
    p."NOMBRE_PERIODO",
    cv."DESCRIPCION",
    cv."FECHA_APERTURA",
    cv."FECHA_CIERRE",
    cv."ACTIVO",
    (SELECT COUNT(*) FROM "PLAZA_DOCENTE" pd
     JOIN "CONVOCATORIA_CURSO" cc ON cc."ID_CONVOCATORIA_CURSO" = pd."ID_CONVOCATORIA_CURSO"
     WHERE cc."ID_CONVOCATORIA" = cv."ID_CONVOCATORIA"
       AND pd."ACTIVO" = TRUE) AS "TOTAL_PLAZAS",
    (SELECT COUNT(*) FROM "POSTULACION_PLAZA" pp
     JOIN "CONVOCATORIA_CURSO" cc ON cc."ID_CONVOCATORIA_CURSO" = pp."ID_CONVOCATORIA_CURSO"
     WHERE cc."ID_CONVOCATORIA" = cv."ID_CONVOCATORIA"
       AND pp."ACTIVO" = TRUE) AS "TOTAL_POSTULACIONES"
FROM "CONVOCATORIA" cv
JOIN "PERIODOS" p ON p."ID_PERIODO" = cv."ID_PERIODO";

-- ============================================
-- Vista VW_CONVOCATORIAS_CURSO
-- Muestra el detalle de convocatoria por (sede + curso) con conteos.
-- ============================================

DROP VIEW IF EXISTS "VW_CONVOCATORIAS_CURSO";
CREATE OR REPLACE VIEW "VW_CONVOCATORIAS_CURSO" AS
SELECT
    cc."ID_CONVOCATORIA_CURSO",
    cc."ID_CONVOCATORIA",
    cv."ID_PERIODO",
    p."CODIGO_PERIODO",
    p."NOMBRE_PERIODO",
    cv."DESCRIPCION" AS "DESCRIPCION_CONVOCATORIA",
    cv."FECHA_APERTURA",
    cv."FECHA_CIERRE",
    cc."ID_SEDE",
    s."CODIGO_SEDE",
    s."NOMBRE_SEDE",
    cc."ID_CURSO",
    c."CODIGO_CURSO",
    c."NOMBRE_CURSO",
    c."EJE_TEMATICO",
    cc."NUMERO_PLAZAS",
    cc."ACTIVO",
    (SELECT COUNT(*) FROM "PLAZA_DOCENTE" pd
     WHERE pd."ID_CONVOCATORIA_CURSO" = cc."ID_CONVOCATORIA_CURSO"
       AND pd."ACTIVO" = TRUE) AS "PLAZAS_CREADAS",
    (SELECT COUNT(*) FROM "POSTULACION_PLAZA" pp
     WHERE pp."ID_CONVOCATORIA_CURSO" = cc."ID_CONVOCATORIA_CURSO"
       AND pp."ACTIVO" = TRUE
       AND pp."ACEPTADO" = TRUE) AS "PLAZAS_ASIGNADAS",
    (SELECT COUNT(*) FROM "POSTULACION_PLAZA" pp
     WHERE pp."ID_CONVOCATORIA_CURSO" = cc."ID_CONVOCATORIA_CURSO"
       AND pp."ACTIVO" = TRUE) AS "TOTAL_POSTULACIONES"
FROM "CONVOCATORIA_CURSO" cc
JOIN "CONVOCATORIA" cv ON cv."ID_CONVOCATORIA" = cc."ID_CONVOCATORIA"
JOIN "PERIODOS" p ON p."ID_PERIODO" = cv."ID_PERIODO"
JOIN "SEDES" s ON s."ID_SEDE" = cc."ID_SEDE"
JOIN "CURSOS" c ON c."ID_CURSO" = cc."ID_CURSO";

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
    r."OBLIGATORIO",
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
    pp."ID_CONVOCATORIA_CURSO",
    cc."ID_CONVOCATORIA",
    cv."ID_PERIODO",
    p."CODIGO_PERIODO",
    p."NOMBRE_PERIODO",
    cc."ID_SEDE",
    s."CODIGO_SEDE",
    s."NOMBRE_SEDE",
    cc."ID_CURSO",
    c."CODIGO_CURSO",
    c."NOMBRE_CURSO",
    c."EJE_TEMATICO",
    pp."ID_PLAZA_DOCENTE",
    pd."PAGO_POR_HORA",
    CASE WHEN pp."ID_PLAZA_DOCENTE" IS NOT NULL THEN
      (p."CODIGO_PERIODO" || '-' || s."CODIGO_SEDE" || '-' ||
       c."CODIGO_CURSO" || '-' ||
       (SELECT COUNT(*)::TEXT
        FROM "PLAZA_DOCENTE" pd2
        WHERE pd2."ID_CONVOCATORIA_CURSO" = pp."ID_CONVOCATORIA_CURSO"
          AND pd2."ACTIVO" = TRUE
          AND (pd2."FECHA_CREACION", pd2."ID_PLAZA_DOCENTE") <=
              (pd."FECHA_CREACION", pd."ID_PLAZA_DOCENTE")
       ))
    ELSE NULL END AS "IDENTIFICADOR_PLAZA",
    pp."ID_DOCENTE",
    u."DNI",
    d."RUC",
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
    pp."CONDICION_LABORAL_SNAPSHOT",
    pp."OBSERVACIONES",
    pp."ACTIVO"
FROM "POSTULACION_PLAZA" pp
JOIN "CONVOCATORIA_CURSO" cc ON cc."ID_CONVOCATORIA_CURSO" = pp."ID_CONVOCATORIA_CURSO"
JOIN "CONVOCATORIA" cv ON cv."ID_CONVOCATORIA" = cc."ID_CONVOCATORIA"
JOIN "PERIODOS" p ON p."ID_PERIODO" = cv."ID_PERIODO"
JOIN "SEDES" s ON s."ID_SEDE" = cc."ID_SEDE"
JOIN "CURSOS" c ON c."ID_CURSO" = cc."ID_CURSO"
LEFT JOIN "PLAZA_DOCENTE" pd ON pd."ID_PLAZA_DOCENTE" = pp."ID_PLAZA_DOCENTE"
JOIN "DOCENTES" d ON d."ID_DOCENTE" = pp."ID_DOCENTE"
JOIN "USUARIOS" u ON u."ID_USUARIO" = d."ID_USUARIO";

-- ============================================
-- Vista VW_POSTULACION_ADJUNTOS
-- Documentos de postulación normalizados + datos del docente.
-- Útil para reportes: pendientes, subidos, por convocatoria, etc.
-- ============================================

DROP VIEW IF EXISTS "VW_POSTULACION_ADJUNTOS";
CREATE OR REPLACE VIEW "VW_POSTULACION_ADJUNTOS" AS
SELECT
    a."ID_ADJUNTO",
    a."ID_POSTULACION",
    a."CLASIFICACION",
    a."TIPO",
    a."ID_REQUISITO",
    a."NOMBRE",
    a."OBLIGATORIO",
    a."PLANTILLA_RUTA",
    a."PLANTILLA_FILENAME",
    a."ARCHIVO_PATH",
    a."ARCHIVO_FILENAME",
    a."ARCHIVO_CONTENT_TYPE",
    a."ARCHIVO_SIZE",
    a."ARCHIVO_SUBIDO_EN",
    a."FECHA_CREACION",
    pp."ID_CONVOCATORIA_CURSO",
    pp."ID_DOCENTE",
    pp."CONDICION_LABORAL_SNAPSHOT",
    u."APELLIDOS" || ' ' || u."NOMBRES" AS "DOCENTE_NOMBRE",
    u."DNI"
FROM "POSTULACION_ADJUNTOS" a
JOIN "POSTULACION_PLAZA" pp ON pp."ID_POSTULACION" = a."ID_POSTULACION"
JOIN "DOCENTES" d ON d."ID_DOCENTE" = pp."ID_DOCENTE"
JOIN "USUARIOS" u ON u."ID_USUARIO" = d."ID_USUARIO";
