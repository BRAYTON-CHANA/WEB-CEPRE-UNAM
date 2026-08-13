-- La vista VW_SEDES_AULAS fue eliminada.
-- Ya no es necesaria: el CRUD multinivel usa carga diferida con endpoints separados por nivel.

-- Vista VW_CURSOS: cursos sin áreas asignadas directamente
DROP VIEW IF EXISTS "VW_CURSOS";
CREATE OR REPLACE VIEW "VW_CURSOS" AS
SELECT
  c."ID_CURSO",
  c."CODIGO_CURSO",
  c."NOMBRE_CURSO",
  c."EJE_TEMATICO",
  c."COLOR",
  c."ACTIVO"
FROM "CURSOS" c;

-- Vista VW_CARRERAS: muestra carreras con nombre del área y sedes como array
DROP VIEW IF EXISTS "VW_CARRERAS_SEDE";
DROP VIEW IF EXISTS "VW_CARRERAS";
CREATE VIEW "VW_CARRERAS" AS
SELECT
  c."ID_CARRERA",
  c."NOMBRE_CARRERA",
  c."CODIGO_CARRERA",
  c."ID_AREA",
  a."NOMBRE_AREA",
  c."ID_SEDES",
  (
    SELECT array_agg(s."NOMBRE_SEDE" ORDER BY s."NOMBRE_SEDE")
    FROM unnest(c."ID_SEDES") AS sede_id
    JOIN "SEDES" s ON s."ID_SEDE" = sede_id
  ) AS "SEDES_NOMBRES",
  c."ACTIVO"
FROM "CARRERAS" c
JOIN "AREAS" a ON a."ID_AREA" = c."ID_AREA";

-- Vista VW_USUARIOS: muestra usuarios con roles interpretados y flag de docente
DROP VIEW IF EXISTS "VW_USUARIOS";
CREATE VIEW "VW_USUARIOS" AS
SELECT
  u."ID_USUARIO",
  u."DNI",
  u."APELLIDOS",
  u."NOMBRES",
  u."FECHA_NACIMIENTO",
  CASE
    WHEN u."FECHA_NACIMIENTO" IS NOT NULL THEN DATE_PART('year', AGE(u."FECHA_NACIMIENTO"))::INT
    ELSE NULL
  END AS "EDAD",
  CASE
    WHEN u."FECHA_NACIMIENTO" IS NOT NULL THEN (DATE_PART('year', AGE(u."FECHA_NACIMIENTO")) >= 18)
    ELSE NULL
  END AS "MAYOR_DE_EDAD",
  u."SEXO",
  u."TELEFONO",
  u."EMAIL",
  u."DIRECCION",
  u."ID_ROLES",
  (
    SELECT array_agg(nombre ORDER BY nombre)
    FROM (
      SELECT r."NOMBRE_ROL" AS nombre
      FROM unnest(u."ID_ROLES") AS rol_id
      JOIN "ROLES" r ON r."ID_ROL" = rol_id
      UNION ALL
      SELECT 'docente'
      WHERE d."ID_DOCENTE" IS NOT NULL
    ) combined
  ) AS "ROLES_NOMBRES",
  u."ACTIVO",
  u."REQUIERE_CAMBIO_PASSWORD"
FROM "USUARIOS" u
LEFT JOIN "DOCENTES" d ON d."ID_USUARIO" = u."ID_USUARIO";

-- Vista VW_DOCENTES: muestra docentes con datos de usuario y cursos
DROP VIEW IF EXISTS "VW_DOCENTES";
CREATE VIEW "VW_DOCENTES" AS
SELECT
  d."ID_DOCENTE",
  d."ID_USUARIO",
  u."DNI",
  u."APELLIDOS",
  u."NOMBRES",
  (u."APELLIDOS" || ' ' || u."NOMBRES") AS "NOMBRE_COMPLETO",
  u."TELEFONO",
  u."EMAIL",
  d."RUC",
  d."CONDICION_LABORAL",
  d."ACTIVO"
FROM "DOCENTES" d
JOIN "USUARIOS" u ON u."ID_USUARIO" = d."ID_USUARIO";

-- Vista VW_PERMISOS: select directo de PERMISOS
DROP VIEW IF EXISTS "VW_PERMISOS";
CREATE VIEW "VW_PERMISOS" AS
SELECT
  p."ID_PERMISO",
  p."RECURSO",
  p."ACCION",
  p."DESCRIPCION",
  p."ACTIVO"
FROM "PERMISOS" p;

-- Vista VW_ROLES: roles con nombres de permisos como array
DROP VIEW IF EXISTS "VW_ROLES";
CREATE VIEW "VW_ROLES" AS
SELECT
  r."ID_ROL",
  r."NOMBRE_ROL",
  r."DESCRIPCION",
  r."NIVEL_ACCESO",
  r."ACTIVO",
  r."ES_SISTEMA",
  r."ID_PERMISOS",
  (
    SELECT array_agg(pm."RECURSO" || ':' || pm."ACCION" ORDER BY pm."RECURSO", pm."ACCION")
    FROM unnest(r."ID_PERMISOS") AS permiso_id
    JOIN "PERMISOS" pm ON pm."ID_PERMISO" = permiso_id
  ) AS "PERMISOS_NOMBRES"
FROM "ROLES" r;

-- Vista VW_CORREOS: muestra correos con nombres de usuarios destinatarios
DROP VIEW IF EXISTS "VW_CORREOS";
CREATE OR REPLACE VIEW "VW_CORREOS" AS
SELECT
  c."ID_CORREO",
  c."TIPO",
  c."ID_USUARIOS",
  (
    SELECT array_agg(u."APELLIDOS" || ' ' || u."NOMBRES" ORDER BY u."APELLIDOS")
    FROM unnest(c."ID_USUARIOS") AS usuario_id
    JOIN "USUARIOS" u ON u."ID_USUARIO" = usuario_id
  ) AS "USUARIOS_NOMBRES",
  c."DESTINATARIOS",
  c."CC",
  c."BCC",
  c."ASUNTO",
  c."CUERPO_HTML",
  c."CUERPO_TEXTO",
  c."ESTADO",
  c."ERROR",
  c."PRIORIDAD",
  c."FECHA_PROGRAMADA",
  c."INTENTOS",
  c."CREADO_EN",
  c."ENVIADO_EN",
  c."CREADO_POR",
  c."ENVIO_AUTOMATICO",
  c."BLOQUEADO",
  c."PERSONALIZADO",
  c."OBSERVACIONES",
  c."REMITENTE",
  c."ADJUNTOS"
FROM "CORREOS" c;

-- Vista VW_PASSWORD_RESET_CODES: códigos de reset con asunto del correo asociado
DROP VIEW IF EXISTS "VW_PASSWORD_RESET_CODES";
CREATE OR REPLACE VIEW "VW_PASSWORD_RESET_CODES" AS
SELECT
  prc."ID_RESET",
  prc."ID_CORREO",
  c."ASUNTO" AS "CORREO_ASUNTO",
  prc."DNI",
  prc."EMAIL",
  prc."CODIGO",
  prc."CREADO_EN",
  prc."EXPIRA_EN",
  prc."USADO",
  prc."FECHA_USO"
FROM "PASSWORD_RESET_CODES" prc
LEFT JOIN "CORREOS" c ON c."ID_CORREO" = prc."ID_CORREO";

-- Vista VW_TIPOS_CORREO: tipos de correo con su cuenta por defecto
DROP VIEW IF EXISTS "VW_TIPO_CORREO_CUENTA_SEDE";
DROP VIEW IF EXISTS "VW_TIPOS_CORREO";
CREATE OR REPLACE VIEW "VW_TIPOS_CORREO" AS
SELECT
  tc."ID_TIPO",
  tc."NOMBRE_TIPO",
  tc."DESCRIPCION",
  tc."ENVIO_AUTOMATICO",
  tc."MULTI_USUARIO",
  tc."ACTIVO",
  tc."ID_CUENTA",
  c."NOMBRE_CUENTA" AS "CUENTA_NOMBRE"
FROM "TIPOS_CORREO" tc
LEFT JOIN "CUENTAS_SMTP" c ON c."ID_CUENTA" = tc."ID_CUENTA";
