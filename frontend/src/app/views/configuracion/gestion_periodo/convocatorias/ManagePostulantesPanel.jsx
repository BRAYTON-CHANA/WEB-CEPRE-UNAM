import React, { useState, useEffect } from 'react';
import { Form } from '@/shared/components/form';
import { Modal } from '@/shared/components/modal';
import { DatabaseTableEditable } from '@/shared/components/table';
import PredefinedFilesInput from '@/shared/components/ui/inputs/PredefinedFilesInput';
import { postulacionFormFields, postulacionValidation } from '@/features/plazas_docentes/config/postulacionFormConfig';
import { getRequisitoUrl } from '@/features/requisitos_docentes/services/requisitosDocentesService';
import { useManagePostulantes } from '@/features/convocatorias/hooks/useManagePostulantes';

const formatDatePEWithStatus = (value, isDone, doneLabel, pendingLabel) => {
  if (!value) return <span className="text-gray-300 italic">—</span>;
  const d = new Date(value);
  const date = d.toLocaleDateString('es-PE', { timeZone: 'America/Lima' });
  const time = d.toLocaleTimeString('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit', hour12: false });
  const label = isDone ? doneLabel : pendingLabel;
  const color = isDone ? 'text-green-600' : 'text-gray-500';
  return (
    <div className="flex flex-col">
      <span className="text-sm">{date} · {time}</span>
      <span className={`text-xs ${color}`}>{label}</span>
    </div>
  );
};

const formatDatePE = (value) => {
  if (!value) return <span className="text-gray-300 italic">—</span>;
  const d = new Date(value);
  return <span className="text-sm">{d.toLocaleDateString('es-PE', { timeZone: 'America/Lima' })}</span>;
};

const formatPostuladoCompact = (value) => {
  if (!value) return <span className="text-gray-300 italic">—</span>;
  const d = new Date(value);
  const date = d.toLocaleDateString('es-PE', { timeZone: 'America/Lima' });
  const time = d.toLocaleTimeString('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit', hour12: false });
  return `${date} ${time}`;
};

const getTableHeaders = () => [
  {
    field: 'DOCENTE_NOMBRE',
    title: 'Docente',
    type: 'string',
    render: (value, row) => (
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-gray-900">{value}</span>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>DNI: {row.DNI}</span>
          {row.RUC && <span>· RUC: {row.RUC}</span>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {row.CONDICION_LABORAL_SNAPSHOT && (
            <span className="inline-flex w-fit items-center px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] rounded font-medium border border-indigo-200">
              {row.CONDICION_LABORAL_SNAPSHOT}
            </span>
          )}
          <span className="text-[10px] text-gray-400">Postulado: {formatPostuladoCompact(row.FECHA_POSTULACION)}</span>
        </div>
      </div>
    ),
  },
  {
    field: 'FECHA_ENTREVISTA',
    title: 'Entrevista',
    type: 'date',
    editable: true,
    targetTable: 'POSTULACION_PLAZA',
    targetField: 'FECHA_ENTREVISTA',
    render: (value, row) => formatDatePEWithStatus(value, row.ENTREVISTA_REALIZADA, 'Realizada', 'Pendiente'),
  },
  { field: 'FECHA_CONTRATO', title: 'Contrato', type: 'date', render: (value, row) => formatDatePEWithStatus(value, row.CONTRATO_FIRMADO, 'Firmado', 'Sin firmar') },
  { field: 'ESTADO', title: 'Estado', type: 'string' },
  {
    field: 'ID_PLAZA_DOCENTE',
    title: 'Plaza',
    type: 'function-select',
    editable: true,
    functionName: 'fn_plazas_disponibles_para_postulacion',
    functionParams: {
      p_id_convocatoria_curso: '{ID_CONVOCATORIA_CURSO}',
      p_id_plaza_actual: '{ID_PLAZA_DOCENTE}'
    },
    optionalParams: ['p_id_plaza_actual'],
    valueField: 'id_plaza_docente',
    labelField: '{identificador}',
    targetTable: 'POSTULACION_PLAZA',
    targetField: 'ID_PLAZA_DOCENTE',
    placeholder: 'Sin asignar',
    render: (value, row) => {
      if (!value) return <span className="text-gray-300 italic">Sin asignar</span>;
      return (
        <span className="inline-flex items-center px-2 py-0.5 bg-[#57C7C2]/10 text-[#57C7C2] text-xs rounded font-medium border border-[#57C7C2]/20">
          {row.IDENTIFICADOR_PLAZA || value}
        </span>
      );
    },
  },
];

function ManagePostulantesPanel({ convocatoriaCurso, onBack }) {
  const {
    postulaciones, loading,
    isModalOpen, creating, formError,
    initialValues,
    handleOpenCreate, handleCloseModal, handleSubmit,
    asignarModal, setAsignarModal, handleConfirmarAsignacion, closeAsignarModal,
    handleSaveSuccess, handleSaveError,
    handleDeletePostulacion,
    adjuntosModal, handleViewAdjuntos, handleSaveAdjuntos, closeAdjuntosModal,
  } = useManagePostulantes({ convocatoriaCurso });

  // Estado local del PredefinedFilesInput del modal de adjuntos
  const [adjuntosLocalValue, setAdjuntosLocalValue] = useState(null);

  const tableActions = [
    {
      label: 'Adjuntos',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
      ),
      onClick: (row) => handleViewAdjuntos(row),
      className: 'text-indigo-600 hover:bg-indigo-50',
    },
    {
      label: 'Eliminar',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.993-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
        </svg>
      ),
      onClick: (row) => handleDeletePostulacion(row),
      className: 'text-red-600 hover:bg-red-50',
    },
  ];

  // Cuando el modal de adjuntos carga los datos, sincronizar con el estado local
  useEffect(() => {
    if (adjuntosModal.open && adjuntosModal.adjuntos) {
      setAdjuntosLocalValue(adjuntosModal.adjuntos);
    }
  }, [adjuntosModal.open, adjuntosModal.adjuntos]);

  const handleAdjuntosChange = (name, value) => {
    setAdjuntosLocalValue(value);
  };

  const handleGuardarAdjuntos = () => {
    handleSaveAdjuntos(adjuntosLocalValue);
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Volver a convocatorias
            </button>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Postulantes de {convocatoriaCurso?.NOMBRE_CURSO}
              </h2>
              <p className="text-sm text-gray-500">
                {convocatoriaCurso?.NOMBRE_SEDE} · {convocatoriaCurso?.NOMBRE_PERIODO} · Máx {convocatoriaCurso?.NUMERO_PLAZAS} plazas
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Creadas: {convocatoriaCurso?.PLAZAS_CREADAS ?? 0} · Asignadas: {convocatoriaCurso?.PLAZAS_ASIGNADAS ?? 0}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700"
            >
              Añadir postulación
            </button>
          </div>
        </div>

        {formError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded text-sm text-red-700">
            {formError}
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-visible p-4">
        <DatabaseTableEditable
          data={postulaciones}
          headers={getTableHeaders()}
          actions={tableActions}
          primaryKey="ID_POSTULACION"
          externalLoading={loading}
          onSaveSuccess={handleSaveSuccess}
          onSaveError={handleSaveError}
          tableProps={{ emptyMessage: 'No hay postulaciones para esta convocatoria' }}
        />
      </div>

      {/* Modal crear/editar postulación */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Añadir postulación"
        size="lg"
        closeOnOutsideClick={false}
      >
        <div className="p-6">
          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded text-sm text-red-700">
              {formError}
            </div>
          )}
          <Form
            fields={postulacionFormFields}
            initialValues={initialValues}
            validation={postulacionValidation}
            onSubmit={handleSubmit}
            loading={creating}
            submitText="Guardar postulación"
          />
        </div>
      </Modal>

      {/* Modal asignar plaza */}
      <Modal
        isOpen={asignarModal.open}
        onClose={closeAsignarModal}
        title="Asignar plaza disponible"
        size="md"
        closeOnOutsideClick={false}
      >
        <div className="p-6 space-y-4">
          <div className="text-sm text-gray-600">
            Postulación de <strong>{asignarModal.postulacion?.DOCENTE_NOMBRE}</strong>
          </div>

          {asignarModal.loadingPlazas && (
            <div className="text-center py-4">
              <div className="inline-block w-5 h-5 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-2" />
              <p className="text-sm text-gray-500">Cargando plazas disponibles...</p>
            </div>
          )}

          {!asignarModal.loadingPlazas && asignarModal.plazas.length === 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded text-sm text-amber-700">
              No hay plazas disponibles para asignar. Cree más plazas en la gestión de plazas docentes.
            </div>
          )}

          {!asignarModal.loadingPlazas && asignarModal.plazas.length > 0 && (
            <>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {asignarModal.plazas.map((plaza) => (
                  <label
                    key={plaza.id_plaza_docente}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      asignarModal.selectedPlaza === plaza.id_plaza_docente
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="plaza"
                      checked={asignarModal.selectedPlaza === plaza.id_plaza_docente}
                      onChange={() => setAsignarModal(prev => ({ ...prev, selectedPlaza: plaza.id_plaza_docente }))}
                      className="text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{plaza.identificador}</div>
                      <div className="text-xs text-gray-500">
                        {plaza.modalidad} · S/. {plaza.pago_por_hora}/hora
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={closeAsignarModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmarAsignacion}
                  disabled={!asignarModal.selectedPlaza || asignarModal.asignando}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {asignarModal.asignando ? 'Asignando...' : 'Asignar plaza'}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Modal ver/editar adjuntos */}
      <Modal
        isOpen={adjuntosModal.open}
        onClose={closeAdjuntosModal}
        title={`Documentos de ${adjuntosModal.postulacion?.DOCENTE_NOMBRE || ''}`}
        size="lg"
        closeOnOutsideClick={false}
      >
        <div className="p-6">
          {adjuntosModal.loading && (
            <div className="text-center py-8">
              <div className="inline-block w-5 h-5 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-2" />
              <p className="text-sm text-gray-500">Cargando documentos...</p>
            </div>
          )}

          {!adjuntosModal.loading && adjuntosModal.adjuntos && (
            <>
              <PredefinedFilesInput
                name="ADJUNTOS_DATA"
                value={adjuntosLocalValue}
                onChange={handleAdjuntosChange}
                label="Documentos de postulación"
                mode="edit"
                getDownloadUrl={getRequisitoUrl}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.png,.jpg,.jpeg"
                maxSize={10 * 1024 * 1024}
              />

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 mt-4">
                <button
                  onClick={closeAdjuntosModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cerrar
                </button>
                <button
                  onClick={handleGuardarAdjuntos}
                  disabled={adjuntosModal.saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {adjuntosModal.saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </>
          )}

          {!adjuntosModal.loading && !adjuntosModal.adjuntos && (
            <div className="text-center py-8 text-sm text-gray-500">
              Esta postulación no tiene documentos.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default ManagePostulantesPanel;
