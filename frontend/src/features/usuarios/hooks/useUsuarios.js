import { useState, useCallback, useMemo } from 'react';
import { useTableData, useCrudForms } from '@/shared/components/crud';
import { useAuthContext } from '@/shared/context/AuthContext';
import { authService } from '@/features/login/services/authService';
import cacheService from '@/shared/services/cacheService';
import { tableConfig, getTableLevelConfigs } from '@/features/usuarios/config/tableConfig';
import { usuariosFormFields, usuariosValidation, usuariosModalConfig } from '@/features/usuarios/config/formConfig';

/**
 * useUsuarios — lógica de la página de Usuarios.
 * CRUD + reset password + ver perfil + custom create function.
 * ACTIVO optimistic update lo maneja TableMultiLevelEditable internamente.
 */
export function useUsuarios() {
  const { records, loading, error, refresh } = useTableData(tableConfig.tableName);
  const { token } = useAuthContext();
  const [notification, setNotification] = useState(null);
  const [perfilModalOpen, setPerfilModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const usuariosCrud = useCrudForms({
    tableName: 'USUARIOS',
    primaryKey: 'ID_USUARIO',
    onRefresh: refresh
  });

  const handleResetPassword = useCallback(async (row) => {
    if (!window.confirm(`¿Reiniciar la contraseña de ${row.NOMBRES} ${row.APELLIDOS}? Su DNI será la nueva contraseña.`)) return;
    try {
      await authService.resetPasswordAdmin(row.DNI, token);
      refresh();
      setNotification({ title: 'Contraseña reiniciada', description: `Se reinició la contraseña de ${row.NOMBRES} ${row.APELLIDOS}`, type: 'success' });
    } catch (err) {
      setNotification({ title: 'Error', description: err.message || 'Error al reiniciar la contraseña', type: 'error' });
    }
  }, [token, refresh]);

  const handleVerPerfil = useCallback((row) => {
    setSelectedUser(row);
    setPerfilModalOpen(true);
  }, []);

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

  const tableLevelConfigs = useMemo(() => getTableLevelConfigs({
    usuariosCrud,
    onResetPassword: handleResetPassword,
    onVerPerfil: handleVerPerfil
  }), [usuariosCrud, handleResetPassword, handleVerPerfil]);

  const crudLevels = useMemo(() => [
    {
      crud: usuariosCrud,
      tableName: 'USUARIOS',
      primaryKey: 'ID_USUARIO',
      formFields: usuariosFormFields,
      formLayout: null,
      validation: usuariosValidation,
      confirmSubmit: true,
      modalConfig: usuariosModalConfig,
      createFunction: createUsuario
    }
  ], [usuariosCrud, createUsuario]);

  return {
    records,
    loading,
    error,
    usuariosCrud,
    tableLevelConfigs,
    crudLevels,
    notification,
    setNotification,
    perfilModalOpen,
    setPerfilModalOpen,
    selectedUser
  };
}
