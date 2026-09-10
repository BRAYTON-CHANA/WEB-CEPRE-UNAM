import { useState, useCallback, useMemo } from 'react';
import { useTableData, useCrudForms } from '@/shared/components/crud';
import { useAuthContext } from '@/shared/context/AuthContext';
import { authService } from '@/features/login/services/authService';
import cacheService from '@/shared/services/cacheService';
import { db } from '@/shared/api';
import { tableConfig, getTableLevelConfigs } from '@/features/usuarios/config/tableConfig';
import { usuariosFormFields, usuariosFormLayout, usuariosValidation, usuariosModalConfig } from '@/features/usuarios/config/formConfig';
import { uploadDniFile, uploadConadisFile } from '@/features/usuarios/services/usuariosStorageService';

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
      const idUsuario = rolesEditingRow.ID_USUARIO;
      const rolesArr = '{' + newIds.map(Number).filter(Boolean).join(',') + '}';
      // upsert_usuario con p_id_usuario + p_id_roles, resto NULL (COALESCE no toca otros campos)
      await db.query(
        `SELECT upsert_usuario($1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, $2)`,
        idUsuario,
        rolesArr
      );
      cacheService.invalidateAll();
      // Actualizar la tabla ANTES de cerrar el modal para evitar parpadeo
      await refresh();
      setRolesModalOpen(false);
      setRolesEditingRow(null);
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

  const createUsuario = useCallback(async (data, id, formData) => {
    const rawFormData = formData || data;
    const id_roles = Array.isArray(rawFormData.ID_ROLES)
      ? rawFormData.ID_ROLES.map(r => (typeof r === 'object' ? Number(r.ID_ROL) : Number(r))).filter(Boolean)
      : [];

    const payload = {
      dni: rawFormData.DNI,
      apellido_paterno: rawFormData.APELLIDO_PATERNO,
      apellido_materno: rawFormData.APELLIDO_MATERNO || null,
      nombres: rawFormData.NOMBRES,
      password: rawFormData.DNI,
      email: rawFormData.EMAIL || null,
      telefono: rawFormData.TELEFONO || null,
      telefono_opcional: rawFormData.TELEFONO_OPCIONAL || null,
      direccion: rawFormData.DIRECCION || null,
      departamento: rawFormData.DEPARTAMENTO || null,
      provincia: rawFormData.PROVINCIA || null,
      distrito: rawFormData.DISTRITO || null,
      ref_dom: rawFormData.REF_DOM || null,
      fecha_nacimiento: rawFormData.FECHA_NACIMIENTO || null,
      sexo: rawFormData.SEXO || null,
      discapacidad: rawFormData.DISCAPACIDAD || false,
      tipo_discapacidad: rawFormData.TIPO_DISCAPACIDAD || null,
      nro_conadis: rawFormData.NRO_CONADIS || null,
      dni_fecha_vencimiento: rawFormData.DNI_FECHA_VENCIMIENTO || null,
      codigo_ubigeo_nacimiento: rawFormData.CODIGO_UBIGEO_NACIMIENTO || null,
      id_roles
    };

    const result = await authService.register(payload);
    const idUsuario = result?.id_usuario ?? result?.ID_USUARIO;

    // Subir archivo DNI si existe
    const dniArchivo = rawFormData.DNI_ARCHIVO;
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

    // Subir certificado CONADIS si existe
    const conadisArchivo = rawFormData.CONADIS_ARCHIVO;
    const conadisFile = Array.isArray(conadisArchivo) ? conadisArchivo[0] : conadisArchivo;
    if (conadisFile instanceof File && idUsuario) {
      try {
        const uploadResult = await uploadConadisFile(idUsuario, conadisFile);
        await db.update('USUARIOS', idUsuario, {
          CONADIS_STORAGE_PATH: uploadResult.path,
          CONADIS_FILENAME: uploadResult.filename,
          CONADIS_CONTENT_TYPE: uploadResult.contentType,
          CONADIS_TAMAÑO_BYTES: uploadResult.size
        }, 'ID_USUARIO');
      } catch (uploadErr) {
        console.error('[useUsuarios] Error subiendo CONADIS:', uploadErr);
      }
    }

    cacheService.invalidateAll();
    return result;
  }, []);

  const editUsuario = useCallback(async (data, id, formData) => {
    const rawFormData = formData || data;

    // Roles desde formData crudo (no desde data que está filtrado por buildPayload)
    const id_roles = Array.isArray(rawFormData.ID_ROLES)
      ? rawFormData.ID_ROLES.map(r => (typeof r === 'object' ? Number(r.ID_ROL) : Number(r))).filter(Boolean)
      : null;  // null = no tocar roles; [] = borrar todos

    // Convertir id_roles a formato PostgreSQL array literal o null
    const rolesArr = id_roles === null ? null : '{' + id_roles.join(',') + '}';

    // Llamar a upsert_usuario(id, ...) — modo editar (maneja USUARIOS + USUARIO_ROL)
    await db.query(
      `SELECT upsert_usuario($1, NULL, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31)`,
      id,
      data.APELLIDO_PATERNO || null,
      data.APELLIDO_MATERNO || null,
      data.NOMBRES || null,
      null,  // password_hash (no se cambia al editar)
      data.EMAIL || null,
      data.TELEFONO || null,
      data.TELEFONO_OPCIONAL || null,
      data.FECHA_NACIMIENTO || null,
      data.SEXO || null,
      data.DIRECCION || null,
      data.DEPARTAMENTO || null,
      data.PROVINCIA || null,
      data.DISTRITO || null,
      data.CODIGO_UBIGEO_NACIMIENTO || null,
      data.REF_DOM || null,
      data.DISCAPACIDAD ?? null,
      data.TIPO_DISCAPACIDAD || null,
      data.NRO_CONADIS || null,
      data.DNI_FECHA_VENCIMIENTO || null,
      null,  // dni_storage_path (se sube aparte)
      null,  // dni_filename
      null,  // dni_content_type
      null,  // dni_tamano_bytes
      null,  // conadis_storage_path
      null,  // conadis_filename
      null,  // conadis_content_type
      null,  // conadis_tamano_bytes
      data.ACTIVO ?? null,
      data.REQUIERE_CAMBIO_PASSWORD ?? null,
      rolesArr
    );

    // Subir nuevo archivo DNI si existe
    const dniArchivo = rawFormData?.DNI_ARCHIVO;
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

    // Subir nuevo certificado CONADIS si existe
    const conadisArchivo = rawFormData?.CONADIS_ARCHIVO;
    const conadisFile = Array.isArray(conadisArchivo) ? conadisArchivo[0] : conadisArchivo;
    if (conadisFile instanceof File) {
      try {
        const uploadResult = await uploadConadisFile(id, conadisFile);
        await db.update('USUARIOS', id, {
          CONADIS_STORAGE_PATH: uploadResult.path,
          CONADIS_FILENAME: uploadResult.filename,
          CONADIS_CONTENT_TYPE: uploadResult.contentType,
          CONADIS_TAMAÑO_BYTES: uploadResult.size
        }, 'ID_USUARIO');
      } catch (uploadErr) {
        console.error('[useUsuarios] Error subiendo CONADIS:', uploadErr);
      }
    }

    cacheService.invalidateAll();
    return { success: true };
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
    ID_ROLES: (record.ROLES || []).map(r => r.id_rol).filter(Boolean),
    DNI_ARCHIVO: record.DNI_STORAGE_PATH ? {
      name: record.DNI_FILENAME || 'archivo.pdf',
      size: record.DNI_TAMAÑO_BYTES || 0,
      url: null,
      storagePath: record.DNI_STORAGE_PATH  // path para generar URL firmada
    } : '',
    CONADIS_ARCHIVO: record.CONADIS_STORAGE_PATH ? {
      name: record.CONADIS_FILENAME || 'certificado-conadis.pdf',
      size: record.CONADIS_TAMAÑO_BYTES || 0,
      url: null,
      storagePath: record.CONADIS_STORAGE_PATH  // path para generar URL firmada
    } : ''
  }), []);

  const crudLevels = useMemo(() => [
    {
      crud: usuariosCrud,
      tableName: 'USUARIOS',
      viewName: 'VW_USUARIOS',
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
