import React, { useState, useEffect, useCallback } from 'react';
import { useTableData, useCrudForms, CrudMultiLevelManager, CrudHeader } from '@/shared/components/crud';
import { TableMultiLevelEditable } from '@/shared/components/table';
import { useAuthContext } from '@/shared/context/AuthContext';
import { authService } from '@/features/login/services/authService';
import Toast from '@/shared/components/ui/Toast';
import { ConfigLayout } from '@/features/layout';
import { tableConfig, getTableLevelConfigs } from '@/features/usuarios/config/tableConfig';
import { usuariosFormFields, usuariosValidation, usuariosModalConfig } from '@/features/usuarios/config/formConfig';
import { headerProps, getHeaderActions } from '@/features/usuarios/config/headerConfig';

/**
 * Configuración de USUARIOS
 * CRUD completo para la tabla USUARIOS usando CrudMultiLevelManager con un solo nivel.
 */
function UsuariosConfig() {
  const { records, loading, error, refresh } = useTableData(tableConfig.tableName);
  const { token } = useAuthContext();
  const [tableRecords, setTableRecords] = useState(records || []);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    setTableRecords(records || []);
  }, [records]);

  const usuariosCrud = useCrudForms({
    tableName: 'USUARIOS',
    primaryKey: 'ID_USUARIO',
    onRefresh: refresh
  });

  const handleSaveSuccess = useCallback((recordId, field, newValue) => {
    setTableRecords(prev =>
      prev.map(row => String(row.ID_USUARIO) === String(recordId) ? { ...row, [field]: newValue } : row)
    );
  }, []);

  const handleResetPassword = useCallback(async (row) => {
    if (!window.confirm(`¿Reiniciar la contraseña de ${row.NOMBRES} ${row.APELLIDOS}? Su DNI será la nueva contraseña.`)) return;
    try {
      await authService.resetPasswordAdmin(row.DNI, token);
      setTableRecords(prev =>
        prev.map(r => String(r.ID_USUARIO) === String(row.ID_USUARIO) ? { ...r, REQUIERE_CAMBIO_PASSWORD: true } : r)
      );
      setNotification({ title: 'Contraseña reiniciada', description: `Se reinició la contraseña de ${row.NOMBRES} ${row.APELLIDOS}`, type: 'success' });
    } catch (err) {
      setNotification({ title: 'Error', description: err.message || 'Error al reiniciar la contraseña', type: 'error' });
    }
  }, [token]);

  const tableLevelConfigs = getTableLevelConfigs(usuariosCrud, handleResetPassword);

  const crudLevels = [
    {
      crud: usuariosCrud,
      tableName: 'USUARIOS',
      primaryKey: 'ID_USUARIO',
      formFields: usuariosFormFields,
      formLayout: null,
      validation: usuariosValidation,
      confirmSubmit: true,
      modalConfig: usuariosModalConfig
    }
  ];

  return (
    <ConfigLayout>
      <CrudMultiLevelManager crudLevels={crudLevels}>
        {([h]) => {
          const enrichedLevelConfigs = tableLevelConfigs.map(level => ({
            ...level,
            actions: level.actions ? {
              ...level.actions,
              edit: level.actions.edit ? { ...level.actions.edit, onClick: h.handleEdit } : undefined,
              delete: level.actions.delete ? { ...level.actions.delete, onClick: h.handleDelete } : undefined
            } : undefined
          }));

          return (
            <div className="px-8 py-8 space-y-8 pb-12">
              {notification && (
                <Toast
                  {...notification}
                  onClose={() => setNotification(null)}
                  duration={3000}
                  position="top-right"
                  size="lg"
                  showProgress
                  fontFamily="inherit"
                  backgroundColor="#2E3A68"
                />
              )}
              <CrudHeader
                headerTitle={headerProps.headerTitle}
                headerDescription={headerProps.headerDescription}
                titleClassName={headerProps.titleClassName}
                descriptionClassName={headerProps.descriptionClassName}
                actions={getHeaderActions(usuariosCrud)}
              />

              {loading && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
                  <div className="inline-block w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-3" />
                  <p className="text-gray-500 text-sm">Cargando datos...</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 rounded-xl border border-red-100 p-6">
                  <p className="text-red-700 text-sm"><strong>Error:</strong> {error.message}</p>
                </div>
              )}

              {!loading && !error && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
                  <TableMultiLevelEditable
                    data={tableRecords}
                    levelConfigs={enrichedLevelConfigs}
                    saveMode="auto"
                    onSaveSuccess={handleSaveSuccess}
                    formatToastMessage={(recordId, field, newValue, primaryKey, rowData, header) => {
                      const name = [rowData?.NOMBRES, rowData?.APELLIDOS].filter(Boolean).join(' ') || 'Usuario';
                      return `${name}: ${header?.label || field} → ${newValue ? 'Activo' : 'No activo'}`;
                    }}
                    toastProps={{ fontFamily: 'inherit', backgroundColor: '#2E3A68' }}
                  />
                </div>
              )}
            </div>
          );
        }}
      </CrudMultiLevelManager>
    </ConfigLayout>
  );
}

export default UsuariosConfig;
