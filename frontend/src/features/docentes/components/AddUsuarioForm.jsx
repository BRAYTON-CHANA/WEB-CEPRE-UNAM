import React, { useCallback, useMemo } from 'react';
import { CrudForm } from '@/shared/components/form';
import { authService } from '@/features/login/services/authService';
import cacheService from '@/shared/services/cacheService';
import { usuariosFormFields, usuariosFormLayout } from '@/features/usuarios/config/formConfig';

const AddUsuarioForm = ({ onSuccess, onError }) => {
  // Filtrar el campo de roles — no aplica al vincular usuario desde docente/wizard
  // TEMPORAL: quitar required para ir probando el layout
  const fieldsWithoutRoles = useMemo(
    () => usuariosFormFields
      .filter(f => f.name !== 'ID_ROLES')
      .map(f => ({ ...f, required: false })),
    []
  );

  const createUsuario = useCallback(async (formData) => {
    const payload = {
      dni: formData.DNI,
      apellido_paterno: formData.APELLIDO_PATERNO,
      apellido_materno: formData.APELLIDO_MATERNO || null,
      nombres: formData.NOMBRES,
      password: formData.DNI,
      email: formData.EMAIL || null,
      telefono: formData.TELEFONO || null,
      telefono_opcional: formData.TELEFONO_OPCIONAL || null,
      direccion: formData.DIRECCION || null,
      departamento: formData.DEPARTAMENTO || null,
      provincia: formData.PROVINCIA || null,
      distrito: formData.DISTRITO || null,
      ref_dom: formData.REF_DOM || null,
      fecha_nacimiento: formData.FECHA_NACIMIENTO || null,
      sexo: formData.SEXO || null,
      discapacidad: formData.DISCAPACIDAD || false,
      tipo_discapacidad: formData.TIPO_DISCAPACIDAD || null,
      nro_conadis: formData.NRO_CONADIS || null,
      id_roles: []
    };

    const result = await authService.register(payload);
    cacheService.invalidateAll();
    return result;
  }, []);

  const handleSuccess = useCallback((result) => {
    const id_usuario = result?.id_usuario ?? result?.ID_USUARIO;
    onSuccess?.({ ...result, ID_USUARIO: id_usuario });
  }, [onSuccess]);

  return (
    <CrudForm
      tableName="USUARIOS"
      mode="create"
      fields={fieldsWithoutRoles}
      layout={usuariosFormLayout}
      primaryKey="ID_USUARIO"
      validation={{}}
      createFunction={createUsuario}
      onSuccess={handleSuccess}
      onError={onError}
      submitWrapperClassName="hidden"
    />
  );
};

export default AddUsuarioForm;
