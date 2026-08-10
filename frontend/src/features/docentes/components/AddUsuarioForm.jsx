import React, { useCallback } from 'react';
import { CrudForm } from '@/shared/components/form';
import { authService } from '@/features/login/services/authService';
import cacheService from '@/shared/services/cacheService';
import { usuariosFormFields, usuariosValidation } from '@/features/usuarios/config/formConfig';

const AddUsuarioForm = ({ onSuccess, onError }) => {
  const createUsuario = useCallback(async (formData) => {
    const id_roles = Array.isArray(formData.ID_ROLES)
      ? formData.ID_ROLES.map(r => (typeof r === 'object' ? Number(r.ID_ROL) : Number(r))).filter(Boolean)
      : [];

    const payload = {
      dni: formData.DNI,
      apellidos: formData.APELLIDOS,
      nombres: formData.NOMBRES,
      password: formData.DNI,
      email: formData.EMAIL || null,
      telefono: formData.TELEFONO || null,
      direccion: formData.DIRECCION || null,
      fecha_nacimiento: formData.FECHA_NACIMIENTO || null,
      sexo: formData.SEXO || null,
      id_roles
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
      fields={usuariosFormFields}
      primaryKey="ID_USUARIO"
      validation={usuariosValidation}
      createFunction={createUsuario}
      onSuccess={handleSuccess}
      onError={onError}
    />
  );
};

export default AddUsuarioForm;
