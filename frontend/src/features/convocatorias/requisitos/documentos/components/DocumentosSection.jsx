import React, { useState } from 'react';
import { TableMultiLevelEditable } from '@/shared/components/table';
import { Modal } from '@/shared/components/modal';
import FormConfirmModal from '@/shared/components/form/components/FormConfirmModal';
import { CrudForm } from '@/shared/components/form';
import { useConvocatoriaDocumentos } from '@/features/convocatorias/requisitos/documentos/hooks/useConvocatoriaDocumentos';
import DocumentoCreateForm from '@/features/convocatorias/requisitos/documentos/components/DocumentoCreateForm';
import ClasificacionCreateForm from '@/features/convocatorias/requisitos/documentos/components/ClasificacionCreateForm';
import SectionAccordion from '@/features/convocatorias/components/SectionAccordion';

const CONDICIONES_LABORALES = [
  { value: 'CONTRATADO', label: 'Contratado' },
  { value: 'EXTERNO', label: 'Externo' },
  { value: 'ORDINARIO', label: 'Ordinario' }
];

/**
 * Sección de Documentos Docentes (tabs por condición + tabla agrupada por clasificación + form inline).
 */
function DocumentosSection({ activeCondicion }) {
  const {
    clasificacionesData, clasificacionesRecords, loading, error, handleSaveSuccess, tableLevelConfigs,
    childrenData, childrenLoading, onExpand,
    isCreateFormOpen, condicionesPreseleccionadas,
    handleCreate, handleCreateSuccess, handleCreateCancel,
    isClasificacionFormOpen, condicionesClasificacionPre,
    handleCreateClasificacion, handleCreateClasificacionSuccess, handleCreateClasificacionCancel,
    isEditOpen, selectedRecord, editFormFields, editFunctionWrapper, handleCloseEdit,
    handleEditSuccess, handleError,
    isDeleteOpen, rowToDelete, deleteLoading, handleCancelDelete, handleConfirmDelete,
    isDeleteClasificacionOpen, clasificacionToDelete, deleteClasificacionLoading,
    handleCancelDeleteClasificacion, handleConfirmDeleteClasificacion,
    isAddDocumentoToClasOpen, clasificacionToAddTo, addDocumentoLoading,
    addDocumentoForm, handleAddDocumentoFormChange,
    handleCancelAddDocumentoToClasificacion, handleConfirmAddDocumentoToClasificacion,
    notification, closeNotification,
    documentosMultiStep, documentosValidation, documentosModalConfig
  } = useConvocatoriaDocumentos(activeCondicion);

  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="space-y-4">
      <SectionAccordion
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        }
        title="Documentos Docentes"
        actions={[
          { text: 'Nueva Clasificación', onClick: handleCreateClasificacion, font: 'bg-blue-600 hover:bg-blue-700 text-white' },
          { text: 'Crear Documento', onClick: handleCreate, font: 'bg-green-600 hover:bg-green-700 text-white' }
        ]}
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="space-y-4">
          {/* Form inline de crear clasificación */}
          {isClasificacionFormOpen && (
            <div className="bg-white rounded-xl border border-blue-200 shadow-md overflow-hidden">
              <ClasificacionCreateForm
                clasificacionesRecords={clasificacionesRecords}
                condicionesPreseleccionadas={condicionesClasificacionPre}
                onSuccess={handleCreateClasificacionSuccess}
                onCancel={handleCreateClasificacionCancel}
              />
            </div>
          )}

          {/* Form inline de crear documento */}
          {isCreateFormOpen && (
            <div className="bg-white rounded-xl border border-green-200 shadow-md overflow-hidden">
              <DocumentoCreateForm
                tableRecords={[]}
                clasificacionesRecords={clasificacionesRecords}
                condicionesPreseleccionadas={condicionesPreseleccionadas}
                onSuccess={handleCreateSuccess}
                onCancel={handleCreateCancel}
              />
            </div>
          )}

          {loading && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
              <div className="inline-block w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-3" />
              <p className="text-gray-500 text-sm">Cargando clasificaciones...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 rounded-xl border border-red-100 p-6">
              <p className="text-red-700 text-sm"><strong>Error:</strong> {error.message}</p>
            </div>
          )}

          {!loading && !error && clasificacionesData.length === 0 && !isCreateFormOpen && !isClasificacionFormOpen && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm font-medium mb-1">No hay clasificaciones para esta condición</p>
              <p className="text-gray-400 text-xs">Crea una nueva clasificación para "{CONDICIONES_LABORALES.find(c => c.value === activeCondicion)?.label}".</p>
            </div>
          )}

          {!loading && !error && clasificacionesData.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
              <TableMultiLevelEditable
                data={clasificacionesData}
                levelConfigs={tableLevelConfigs}
                saveMode="auto"
                externalLoading={loading}
                onSaveSuccess={handleSaveSuccess}
                tableProps={{
                  onExpand,
                  childrenData,
                  childrenLoading
                }}
              />
            </div>
          )}
        </div>
      </SectionAccordion>

      {/* Modal Editar Documento */}
      <Modal isOpen={isEditOpen} onClose={handleCloseEdit} title={documentosModalConfig.editTitle} size="lg" closeOnOutsideClick={false}>
        <div className="p-6">
          {selectedRecord && (
            <CrudForm
              key={`edit-documento-${selectedRecord.ID_DOCUMENTO}`}
              tableName="CONVOCATORIA_DOCUMENTOS"
              mode="edit"
              recordId={selectedRecord.ID_DOCUMENTO}
              fields={editFormFields}
              primaryKey="ID_DOCUMENTO"
              multiStep={documentosMultiStep}
              confirmSubmit
              validation={documentosValidation}
              editFunction={editFunctionWrapper}
              onSuccess={handleEditSuccess}
              onError={handleError}
            />
          )}
        </div>
      </Modal>

      {/* Modal Eliminar Documento */}
      <FormConfirmModal
        isOpen={isDeleteOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        config={{
          title: documentosModalConfig.deleteTitle,
          message: rowToDelete ? documentosModalConfig.deleteMessage(rowToDelete) : '¿Estás seguro?',
          confirmText: deleteLoading ? 'Eliminando...' : 'Sí, eliminar',
          cancelText: 'Cancelar'
        }}
      />

      {/* Modal Eliminar Clasificación */}
      <FormConfirmModal
        isOpen={isDeleteClasificacionOpen}
        onConfirm={handleConfirmDeleteClasificacion}
        onCancel={handleCancelDeleteClasificacion}
        config={{
          title: '¿Eliminar clasificación?',
          message: clasificacionToDelete
            ? `¿Estás seguro de que deseas eliminar la clasificación "${clasificacionToDelete.NOMBRE}"? Se eliminarán también todos sus documentos asociados.`
            : '¿Estás seguro?',
          confirmText: deleteClasificacionLoading ? 'Eliminando...' : 'Sí, eliminar',
          cancelText: 'Cancelar'
        }}
      />

      {/* Modal Agregar Documento a Clasificación */}
      <Modal
        isOpen={isAddDocumentoToClasOpen}
        onClose={handleCancelAddDocumentoToClasificacion}
        title="Añadir plantilla documento"
        size="md"
        closeOnOutsideClick={false}
      >
        <div className="p-6 space-y-4">
          {/* Campo disabled: CONDICION_LABORAL - NOMBRE */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Clasificación
            </label>
            <input
              type="text"
              disabled
              value={clasificacionToAddTo
                ? `${clasificacionToAddTo.CONDICION_LABORAL} - ${clasificacionToAddTo.NOMBRE}`
                : ''
              }
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-400">
              El documento se agregará a esta clasificación.
            </p>
          </div>

          {/* NOMBRE */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nombre del documento <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={addDocumentoForm.NOMBRE || ''}
              onChange={(e) => handleAddDocumentoFormChange('NOMBRE', e.target.value)}
              placeholder="Ej: Plantilla de CV, DNI escaneado, etc."
              autoFocus
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* DESCRIPCION */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Descripción
            </label>
            <textarea
              value={addDocumentoForm.DESCRIPCION || ''}
              onChange={(e) => handleAddDocumentoFormChange('DESCRIPCION', e.target.value)}
              placeholder="Descripción de la plantilla"
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
            />
          </div>

          {/* Botones */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={handleCancelAddDocumentoToClasificacion}
              disabled={addDocumentoLoading}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmAddDocumentoToClasificacion}
              disabled={addDocumentoLoading || !addDocumentoForm.NOMBRE?.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {addDocumentoLoading && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {addDocumentoLoading ? 'Agregando...' : 'Agregar documento'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Notificación Documento */}
      <Modal isOpen={notification.isOpen} onClose={closeNotification} title={notification.title} closeOnOutsideClick={true} closeOnEscapeKey={true}>
        <div className="text-center py-4 px-6">
          {notification.type === 'success' ? (
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
          <p className={`text-sm ${notification.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
            {notification.message}
          </p>
          <button
            onClick={closeNotification}
            className={`mt-4 px-4 py-2 rounded-md text-sm font-medium transition-colors
              ${notification.type === 'success' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-600 text-white hover:bg-red-700'}`}
          >
            Aceptar
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default DocumentosSection;
