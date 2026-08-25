import React from 'react';
import { CrudMultiLevelManager, CrudHeader } from '@/shared/components/crud';
import { TableMultiLevelEditable } from '@/shared/components/table';
import Toast from '@/shared/components/ui/Toast';
import Modal from '@/shared/components/modal/views/Modal';
import PerfilView from '@/features/usuarios/components/PerfilView';
import DniViewerModal from '@/features/usuarios/components/DniViewerModal';
import ArrayEditorModal from '@/shared/components/ui/ArrayEditorModal';
import { ConfigLayout } from '@/features/layout';
import { headerProps, getHeaderActions } from '@/features/usuarios/config/headerConfig';
import { useUsuarios } from '@/features/usuarios/hooks/useUsuarios';

/**
 * Configuración de USUARIOS
 * CRUD + reset password + ver perfil.
 */
function UsuariosConfig() {
  const {
    records, loading, error,
    usuariosCrud, tableLevelConfigs, crudLevels,
    notification, setNotification,
    perfilModalOpen, setPerfilModalOpen, selectedUser,
    dniViewerOpen, setDniViewerOpen, dniViewerUser,
    refresh,
    rolesModalOpen, rolesEditingRow, rolesSaving,
    handleSaveRoles, handleCloseRoles
  } = useUsuarios();

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
                    data={records}
                    levelConfigs={enrichedLevelConfigs}
                    saveMode="auto"
                    formatToastMessage={(recordId, field, newValue, primaryKey, rowData, header) => {
                      const name = [rowData?.NOMBRES, rowData?.APELLIDO_PATERNO].filter(Boolean).join(' ') || 'Usuario';
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

      <Modal
        isOpen={perfilModalOpen}
        onClose={() => setPerfilModalOpen(false)}
        title="Perfil de usuario"
        size="xl"
      >
        <div className="px-4 pb-4">
          <PerfilView
            user={selectedUser}
            activeRole={selectedUser?.ROLES_NOMBRES?.[0]}
          />
        </div>
      </Modal>

      <DniViewerModal
        open={dniViewerOpen}
        user={dniViewerUser}
        onClose={() => setDniViewerOpen(false)}
        onUpdated={refresh}
      />

      <ArrayEditorModal
        isOpen={rolesModalOpen}
        onClose={handleCloseRoles}
        title={`Roles de: ${rolesEditingRow?.NOMBRE_COMPLETO || ''}`}
        tableName="ROLES"
        valueField="ID_ROL"
        labelField="NOMBRE_ROL"
        searchField="NOMBRE_ROL"
        searchPlaceholder="Buscar rol..."
        filters={[{ field: 'ES_SISTEMA', op: '=', value: false }]}
        selectedValues={rolesEditingRow?.ID_ROLES || []}
        onSave={handleSaveRoles}
        loading={rolesSaving}
      />
    </ConfigLayout>
  );
}

export default UsuariosConfig;
