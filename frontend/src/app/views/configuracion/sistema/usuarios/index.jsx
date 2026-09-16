import React, { useState, useMemo } from 'react';
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

  const [searchTerm, setSearchTerm] = useState('');

  const filteredRecords = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return records;
    return records.filter((row) => {
      const dni = (row.DNI || '').toLowerCase();
      const nombres = (row.NOMBRES || '').toLowerCase();
      const apPaterno = (row.APELLIDO_PATERNO || '').toLowerCase();
      const apMaterno = (row.APELLIDO_MATERNO || '').toLowerCase();
      const fullName = `${nombres} ${apPaterno} ${apMaterno}`.trim();

      return dni.includes(term) || fullName.includes(term);
    });
  }, [records, searchTerm]);

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

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  <div className="md:col-span-10">
                    <label htmlFor="usuario_search" className="block text-sm font-medium text-gray-700 mb-1">
                      Buscar por DNI, nombre o apellido
                    </label>
                    <input
                      id="usuario_search"
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Escribe DNI, nombre o apellido..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <button
                      onClick={() => setSearchTerm('')}
                      className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>
              </div>

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
                    data={filteredRecords}
                    levelConfigs={enrichedLevelConfigs}
                    saveMode="auto"
                    tableProps={{ pagination: true, itemsPerPage: 100 }}
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
            activeRole={selectedUser?.ROLES?.[0]?.nombre}
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
        selectedValues={(rolesEditingRow?.ROLES || []).map(r => r.id_rol).filter(Boolean)}
        onSave={handleSaveRoles}
        loading={rolesSaving}
      />
    </ConfigLayout>
  );
}

export default UsuariosConfig;
