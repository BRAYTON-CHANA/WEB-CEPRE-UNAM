import React, { useState, useMemo } from 'react';
import { Form } from '@/shared/components/form';
import { Modal } from '@/shared/components/modal';
import { DatabaseTableEditable } from '@/shared/components/table';
import { postulacionFormFields, postulacionValidation } from '../config/postulacionFormConfig';
import { usePostulacionesPlaza } from '../hooks/usePostulacionesPlaza';
import { loadAdjuntosPostulacion, updateAdjuntosPostulacion } from '../services/postulacionesService';

const formatDateTimePE = (value) => {
  if (!value) return <span className="text-gray-300 italic">—</span>;
  const d = new Date(value);
  const date = d.toLocaleDateString('es-PE', { timeZone: 'America/Lima' });
  const time = d.toLocaleTimeString('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit', hour12: false });
  return (
    <div className="flex flex-col">
      <span className="text-sm">{date}</span>
      <span className="text-xs text-gray-500">{time}</span>
    </div>
  );
};

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

const tableHeaders = [
  {
    field: 'DOCENTE_NOMBRE',
    title: 'Docente',
    type: 'string',
    render: (value, row) => (
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-900">{value}</span>
        <span className="text-xs text-gray-500">{row.DNI}</span>
      </div>
    ),
  },
  { field: 'ESTADO', title: 'Estado', type: 'string' },
  { field: 'ACEPTADO', title: 'Aceptado', type: 'boolean', editable: true, targetTable: 'POSTULACION_PLAZA', targetField: 'ACEPTADO' },
  { field: 'FECHA_POSTULACION', title: 'Postulado', type: 'date', render: (value) => formatDateTimePE(value) },
  { field: 'FECHA_ENTREVISTA', title: 'Entrevista', type: 'date', render: (value, row) => formatDatePEWithStatus(value, row.ENTREVISTA_REALIZADA, 'Realizada', 'Pendiente') },
  { field: 'FECHA_CONTRATO', title: 'Contrato', type: 'date', render: (value, row) => formatDatePEWithStatus(value, row.CONTRATO_FIRMADO, 'Firmado', 'Sin firmar') },
  { field: 'ACTIVO', title: 'Activo', type: 'boolean', render: (value) => value ? <span className="text-green-600 font-medium">Sí</span> : <span className="text-gray-500">No</span> }
];

function PostulacionesPlazaPanel({ plaza, convocatoriaCurso, onBack }) {
  // Acepta convocatoriaCurso directo, o deriva desde plaza (retrocompat)
  const convocatoria = convocatoriaCurso || (plaza ? { ...plaza, ID_CONVOCATORIA_CURSO: plaza.ID_CONVOCATORIA_CURSO } : null);
  const { postulaciones, loading, refresh, create } = usePostulacionesPlaza(convocatoria);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState(null);

  const initialValues = useMemo(() => ({
    ID_CONVOCATORIA_CURSO: convocatoria?.ID_CONVOCATORIA_CURSO,
    ESTADO: 'postulado',
    ACEPTADO: false,
    CONTRATO_FIRMADO: false,
    ENTREVISTA_REALIZADA: false,
    ACTIVO: true,
  }), [convocatoria?.ID_CONVOCATORIA_CURSO]);

  const handleSubmit = async (submitData, rawFormData) => {
    setCreating(true);
    setFormError(null);
    try {
      await create(submitData, rawFormData);
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setCreating(false);
    }
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
              ← Volver a plazas
            </button>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Postulantes de {convocatoria?.NOMBRE_CURSO || plaza?.IDENTIFICADOR_DOCENTE}
              </h2>
              <p className="text-sm text-gray-500">
                {convocatoria?.NOMBRE_SEDE || plaza?.NOMBRE_SEDE} · {convocatoria?.NOMBRE_PERIODO || plaza?.CODIGO_PERIODO}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
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
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto p-4">
        <DatabaseTableEditable
          data={postulaciones}
          headers={tableHeaders}
          primaryKey="ID_POSTULACION"
          externalLoading={loading}
          onSaveSuccess={refresh}
          onSaveError={(recordId, field, error) => setFormError(error?.message || 'Error al guardar')}
          tableProps={{ emptyMessage: 'No hay postulaciones para esta convocatoria' }}
        />
      </div>

      {/* Modal añadir */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
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
    </div>
  );
}

export default PostulacionesPlazaPanel;
