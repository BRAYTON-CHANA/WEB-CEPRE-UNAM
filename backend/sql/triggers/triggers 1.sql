-- Triggers relacionados a create table 1.sql

-- Proteger roles de sistema
CREATE OR REPLACE FUNCTION fn_prevenir_borrar_rol_sistema()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD."ES_SISTEMA" = TRUE THEN
    RAISE EXCEPTION 'No se puede eliminar el rol de sistema: %', OLD."NOMBRE_ROL";
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevenir_borrar_rol_sistema ON "ROLES";
CREATE TRIGGER trg_prevenir_borrar_rol_sistema
BEFORE DELETE ON "ROLES"
FOR EACH ROW
EXECUTE FUNCTION fn_prevenir_borrar_rol_sistema();

-- Validar que cada sede en CARRERAS.ID_SEDES exista
CREATE OR REPLACE FUNCTION fn_validar_sedes_carrera()
RETURNS TRIGGER AS $$
DECLARE
  v_id_sede INTEGER;
BEGIN
  FOREACH v_id_sede IN ARRAY NEW."ID_SEDES"
  LOOP
    IF NOT EXISTS (SELECT 1 FROM "SEDES" WHERE "ID_SEDE" = v_id_sede) THEN
      RAISE EXCEPTION 'La sede % no existe', v_id_sede;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validar_sedes_carrera ON "CARRERAS";
CREATE TRIGGER trg_validar_sedes_carrera
BEFORE INSERT OR UPDATE ON "CARRERAS"
FOR EACH ROW
EXECUTE FUNCTION fn_validar_sedes_carrera();

-- Validar que USUARIOS.ID_ROLES no incluya roles de sistema
CREATE OR REPLACE FUNCTION fn_validar_roles_usuario()
RETURNS TRIGGER AS $$
DECLARE
  v_id_rol INTEGER;
  v_es_sistema BOOLEAN;
BEGIN
  FOREACH v_id_rol IN ARRAY NEW."ID_ROLES"
  LOOP
    SELECT "ES_SISTEMA" INTO v_es_sistema
    FROM "ROLES"
    WHERE "ID_ROL" = v_id_rol;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'El rol % no existe', v_id_rol;
    END IF;

    IF v_es_sistema = TRUE THEN
      RAISE EXCEPTION 'No se puede asignar el rol de sistema % a un usuario', v_id_rol;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validar_roles_usuario ON "USUARIOS";
CREATE TRIGGER trg_validar_roles_usuario
BEFORE INSERT OR UPDATE ON "USUARIOS"
FOR EACH ROW
EXECUTE FUNCTION fn_validar_roles_usuario();

-- Validar que CORREOS.TIPO exista y esté activo en TIPOS_CORREO
CREATE OR REPLACE FUNCTION fn_validar_tipo_correo()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "TIPOS_CORREO"
    WHERE "NOMBRE_TIPO" = NEW."TIPO" AND "ACTIVO" = TRUE
  ) THEN
    RAISE EXCEPTION 'El tipo de correo % no existe o está inactivo', NEW."TIPO";
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validar_tipo_correo ON "CORREOS";
CREATE TRIGGER trg_validar_tipo_correo
BEFORE INSERT OR UPDATE ON "CORREOS"
FOR EACH ROW
EXECUTE FUNCTION fn_validar_tipo_correo();

-- Prevenir eliminar TIPOS_CORREO en uso (forzar desactivar con ACTIVO=FALSE)
CREATE OR REPLACE FUNCTION fn_prevenir_borrar_tipo_correo()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "CORREOS" WHERE "TIPO" = OLD."NOMBRE_TIPO"
  ) THEN
    RAISE EXCEPTION 'No se puede eliminar el tipo de correo %: hay correos asociados. Desactivar con ACTIVO=FALSE', OLD."NOMBRE_TIPO";
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevenir_borrar_tipo_correo ON "TIPOS_CORREO";
CREATE TRIGGER trg_prevenir_borrar_tipo_correo
BEFORE DELETE ON "TIPOS_CORREO"
FOR EACH ROW
EXECUTE FUNCTION fn_prevenir_borrar_tipo_correo();
