import React from 'react';
import { CrudForm } from '@/features/form';
import { Modal } from '@/features/modal';
import FormConfirmModal from '@/features/form/components/FormConfirmModal';
import TableMultiLevelRender from '@/features/table/views/TableMultiLevelRender';
import CrudHeader from '../views/CrudHeader';
import CrudFooter from '../views/CrudFooter';

/**
 * CrudMultiLevelManager — Encapsula layout, tabla multinivel y todos los modales CRUD
 * para múltiples niveles/tablas.
 *
 * Props:
 *   data, loading, error          — desde useTableData
 *   tableLevelConfigs             — config para TableMultiLevelRender (con handlers ya inyectados)
 *   headerProps                   — { headerTitle, headerDescription, actions: [...] }
 *   footerProps                   — opcional
 *   crudLevels                    — Array de configs CRUD, uno por tabla:
 *     [
 *       {
 *         crud: useCrudFormsResult,
 *         tableName: 'SEDES',
 *         primaryKey: 'ID_SEDE',
 *         formFields: [...],
 *         formLayout: null,
 *         multiStep: {...},
 *         validation: {...},
 *         confirmSubmit: true,
 *         modalConfig: {
 *           createTitle: '...',
 *           editTitle: '...',
 *           deleteTitle: '...',
 *           deleteMessage: (row) => '...',
 *           widthClass: 'w-1/2',
 *           createFormKey: 'free' | func,
 *           editFormKey: 'free' | func
 *         },
 *         onCreateSuccess: (result) => {},   // opcional, antes de handleFormSuccess
 *         onEditSuccess:   (result) => {},
 *         onCreateClose:   () => {},          // opcional, al cerrar modal crear
 *         onEditClose:     () => {},          // opcional, al cerrar modal editar
 *       }
 *     ]
 */
function CrudMultiLevelManager({
  data,
  loading,
  error,
  tableLevelConfigs,
  headerProps,
  footerProps,
  crudLevels
}) {
  return (
    <>
      <div className="px-8 py-8 space-y-8 pb-12">
        {/* Header */}
        {headerProps && (
          <CrudHeader
            headerTitle={headerProps.headerTitle}
            headerDescription={headerProps.headerDescription}
            actions={headerProps.actions || []}
          />
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
            <div className="inline-block w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-3" />
            <p className="text-gray-500 text-sm">Cargando datos...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 rounded-xl border border-red-100 p-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <h3 className="text-red-800 font-medium text-sm">Error al cargar datos</h3>
                <p className="text-red-600 text-sm mt-0.5">{error.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabla */}
        {!loading && !error && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
            <TableMultiLevelRender
              data={data}
              levelConfigs={tableLevelConfigs}
            />
          </div>
        )}

        <CrudFooter {...footerProps} />
      </div>

      {/* ===== MODALES POR CADA NIVEL CRUD ===== */}
      {crudLevels?.map((level, idx) => {
        const {
          crud,
          tableName,
          primaryKey,
          formFields,
          formLayout = null,
          multiStep,
          validation,
          confirmSubmit = true,
          modalConfig = {}
        } = level;

        const {
          createTitle = 'Crear Nuevo Registro',
          editTitle = 'Editar Registro',
          deleteTitle = '¿Eliminar registro?',
          deleteMessage = (row) => `¿Estás seguro de que deseas eliminar este registro?`,
          widthClass = 'w-1/2',
          size = 'md',
          createFormKey = 'free',
          editFormKey = 'free'
        } = modalConfig;

        const createKey = typeof createFormKey === 'function'
          ? createFormKey(crud)
          : createFormKey;
        const editKey = typeof editFormKey === 'function'
          ? editFormKey(crud)
          : editFormKey;

        return (
          <React.Fragment key={`crud-level-${idx}`}>
            {/* Crear */}
            <Modal
              isOpen={crud.isCreateOpen}
              onClose={() => {
                level.onCreateClose?.();
                crud.handleCloseCreate();
              }}
              title={createTitle}
              widthClass={widthClass}
              size={size}
              closeOnOutsideClick={false}
            >
              <div className="p-6">
                <CrudForm
                  key={`create-${tableName}-${createKey}`}
                  tableName={tableName}
                  mode="create"
                  fields={formFields}
                  primaryKey={primaryKey}
                  layout={formLayout}
                  multiStep={multiStep}
                  confirmSubmit={confirmSubmit}
                  validation={validation}
                  onSuccess={(result) => {
                    level.onCreateSuccess?.(result);
                    crud.handleFormSuccess(result);
                  }}
                  onError={crud.handleFormError}
                />
              </div>
            </Modal>

            {/* Editar */}
            <Modal
              isOpen={crud.isEditOpen}
              onClose={() => {
                level.onEditClose?.();
                crud.handleCloseEdit();
              }}
              title={editTitle}
              widthClass={widthClass}
              size={size}
              closeOnOutsideClick={false}
            >
              <div className="p-6">
                {crud.selectedRow && (
                  <CrudForm
                    key={`edit-${tableName}-${crud.selectedRow[primaryKey]}-${editKey}`}
                    tableName={tableName}
                    mode="edit"
                    recordId={crud.selectedRow[primaryKey]}
                    fields={formFields}
                    primaryKey={primaryKey}
                    layout={formLayout}
                    multiStep={multiStep}
                    confirmSubmit={confirmSubmit}
                    validation={validation}
                    onSuccess={(result) => {
                      level.onEditSuccess?.(result);
                      crud.handleFormSuccess(result);
                    }}
                    onError={crud.handleFormError}
                  />
                )}
              </div>
            </Modal>

            {/* Eliminar */}
            <FormConfirmModal
              isOpen={crud.isDeleteOpen}
              onConfirm={crud.handleConfirmDelete}
              onCancel={crud.handleCancelDelete}
              config={{
                title: deleteTitle,
                message: crud.rowToDelete
                  ? deleteMessage(crud.rowToDelete)
                  : '¿Estás seguro de que deseas eliminar este registro?',
                confirmText: crud.deleteLoading ? 'Eliminando...' : 'Sí, eliminar',
                cancelText: 'Cancelar'
              }}
            />

            {/* Notificación */}
            <Modal
              isOpen={crud.notification.isOpen}
              onClose={crud.closeNotification}
              title={crud.notification.title}
              closeOnOutsideClick={true}
              closeOnEscapeKey={true}
            >
              <div className="text-center py-4 px-6">
                {crud.notification.type === 'success' ? (
                  <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
                <p className={`text-sm ${crud.notification.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                  {crud.notification.message}
                </p>
                <button
                  onClick={crud.closeNotification}
                  className={`mt-4 px-4 py-2 rounded-md text-sm font-medium transition-colors
                    ${crud.notification.type === 'success'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                >
                  Aceptar
                </button>
              </div>
            </Modal>
          </React.Fragment>
        );
      })}
    </>
  );
}

export default CrudMultiLevelManager;
