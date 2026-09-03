import { useState, useCallback, useMemo } from 'react';
import { useTableData, useCrudForms } from '@/shared/components/crud';
import { useAuthContext } from '@/shared/context/AuthContext';
import { authService } from '@/features/login/services/authService';
import cacheService from '@/shared/services/cacheService';
import { db } from '@/shared/api';
import { tableConfig, getTableLevelConfigs } from '@/features/usuarios/config/tableConfig';
import { usuariosFormFields, usuariosFormLayout, usuariosValidation, usuariosModalConfig } from '@/features/usuarios/config/formConfig';
import { uploadDniFile } from '@/features/usuarios/services/usuariosStorageService';

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
  const [dniViewerOpen, setDniViewerOpen] = useState(false);
  const [dniViewerUser, setDniViewerUser] = useState(null);
  const [rolesModalOpen, setRolesModalOpen] = useState(false);
  const [rolesEditingRow, setRolesEditingRow] = useState(null);
  const [rolesSaving, setRolesSaving] = useState(false);

  const usuariosCrud = useCrudForms({
    tableName: 'USUARIOS',
    primaryKey: 'ID_USUARIO',
    onRefresh: refresh
  });

  const handleResetPassword = useCallback(async (row) => {
    const nombre = row.NOMBRE_COMPLETO || `${row.NOMBRES || ''} ${row.APELLIDO_PATERNO || ''}`.trim();
    if (!window.confirm(`¿Reiniciar la contraseña de ${nombre}? Su DNI será la nueva contraseña.`)) return;
    try {
      await authService.resetPasswordAdmin(row.DNI, token);
      refresh();
      setNotification({ title: 'Contraseña reiniciada', description: `Se reinició la contraseña de ${nombre}`, type: 'success' });
    } catch (err) {
      setNotification({ title: 'Error', description: err.message || 'Error al reiniciar la contraseña', type: 'error' });
    }
  }, [token, refresh]);

  const handleVerPerfil = useCallback((row) => {
    setSelectedUser(row);
    setPerfilModalOpen(true);
  }, []);

  const handleVerDni = useCallback((row) => {
    setDniViewerUser(row);
    setDniViewerOpen(true);
  }, []);

  const handleAdminRoles = useCallback((row) => {
    setRolesEditingRow(row);
    setRolesModalOpen(true);
  }, []);

  const handleSaveRoles = useCallback(async (newIds) => {
    if (!rolesEditingRow) return;
    setRolesSaving(true);
    try {
      await db.update('USUARIOS', rolesEditingRow.ID_USUARIO, { ID_ROLES: newIds }, 'ID_USUARIO');
      cacheService.invalidateAll();
      setRolesModalOpen(false);
      setRolesEditingRow(null);
      refresh();
    } catch (err) {
      console.error('Error guardando roles:', err);
    } finally {
      setRolesSaving(false);
    }
  }, [rolesEditingRow, refresh]);

  const handleCloseRoles = useCallback(() => {
    setRolesModalOpen(false);
    setRolesEditingRow(null);
  }, []);

  const createUsuario = useCallback(async (formData) => {
    const id_roles = Array.isArray(formData.ID_ROLES)
      ? formData.ID_ROLES.map(r => (typeof r === 'object' ? Number(r.ID_ROL) : Number(r))).filter(Boolean)
      : [];

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
      dni_fecha_vencimiento: formData.DNI_FECHA_VENCIMIENTO || null,
      id_roles
    };

    const result = await authService.register(payload);
    const idUsuario = result?.id_usuario ?? result?.ID_USUARIO;

    // Subir archivo DNI si existe
    const dniArchivo = formData.DNI_ARCHIVO;
    const dniFile = Array.isArray(dniArchivo) ? dniArchivo[0] : dniArchivo;
    if (dniFile instanceof File && idUsuario) {
      try {
        const uploadResult = await uploadDniFile(idUsuario, dniFile);
        await db.update('USUARIOS', idUsuario, {
          DNI_STORAGE_PATH: uploadResult.path,
          DNI_FILENAME: uploadResult.filename,
          DNI_CONTENT_TYPE: uploadResult.contentType,
          DNI_TAMAÑO_BYTES: uploadResult.size
        }, 'ID_USUARIO');
      } catch (uploadErr) {
        console.error('[useUsuarios] Error subiendo DNI:', uploadErr);
      }
    }

    cacheService.invalidateAll();
    return result;
  }, []);

  const editUsuario = useCallback(async (data, id, formData) => {
    // Actualizar datos del usuario
    const updateData = { ...data };

    // Asegurar campos correctos
    if (updateData.ID_ROLES) {
      updateData.ID_ROLES = Array.isArray(updateData.ID_ROLES)
        ? updateData.ID_ROLES.map(r => (typeof r === 'object' ? Number(r.ID_ROL) : Number(r))).filter(Boolean)
        : [];
    }

    const result = await db.update('USUARIOS', id, updateData, 'ID_USUARIO');

    // Subir nuevo archivo DNI si existe
    const dniArchivo = formData?.DNI_ARCHIVO;
    const dniFile = Array.isArray(dniArchivo) ? dniArchivo[0] : dniArchivo;
    if (dniFile instanceof File) {
      try {
        const uploadResult = await uploadDniFile(id, dniFile);
        await db.update('USUARIOS', id, {
          DNI_STORAGE_PATH: uploadResult.path,
          DNI_FILENAME: uploadResult.filename,
          DNI_CONTENT_TYPE: uploadResult.contentType,
          DNI_TAMAÑO_BYTES: uploadResult.size
        }, 'ID_USUARIO');
      } catch (uploadErr) {
        console.error('[useUsuarios] Error subiendo DNI:', uploadErr);
      }
    }

    cacheService.invalidateAll();
    return { success: true, data: result };
  }, []);

  const tableLevelConfigs = useMemo(() => getTableLevelConfigs({
    usuariosCrud,
    onResetPassword: handleResetPassword,
    onVerPerfil: handleVerPerfil,
    onVerDni: handleVerDni,
    onAdminRoles: handleAdminRoles
  }), [usuariosCrud, handleResetPassword, handleVerPerfil, handleVerDni, handleAdminRoles]);

  // Transformar record para construir objetos file desde metadata de storage
  const transformRecord = useCallback((record) => ({
    ...record,
    DNI_ARCHIVO: record.DNI_STORAGE_PATH ? {
      name: record.DNI_FILENAME || 'archivo.pdf',
      size: record.DNI_TAMAÑO_BYTES || 0,
      url: null,
      storagePath: record.DNI_STORAGE_PATH  // path para generar URL firmada
    } : ''
  }), []);

  const crudLevels = useMemo(() => [
    {
      crud: usuariosCrud,
      tableName: 'USUARIOS',
      primaryKey: 'ID_USUARIO',
      formFields: usuariosFormFields,
      formLayout: usuariosFormLayout,
      validation: usuariosValidation,
      confirmSubmit: true,
      modalConfig: usuariosModalConfig,
      createFunction: createUsuario,
      editFunction: editUsuario,
      transformRecord
    }
  ], [usuariosCrud, createUsuario, editUsuario, transformRecord]);

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
    selectedUser,
    dniViewerOpen,
    setDniViewerOpen,
    dniViewerUser,
    refresh,
    rolesModalOpen,
    rolesEditingRow,
    rolesSaving,
    handleSaveRoles,
    handleCloseRoles
  };
}
