import React, { useState, useMemo } from 'react';
import { Form } from '@/shared/components/form';
import { Modal } from '@/shared/components/modal';
import { DatabaseTableEditable } from '@/shared/components/table';
import { postulacionFormFields, postulacionValidation } from '../config/postulacionFormConfig';
import { usePostulacionesPlaza } from '../hooks/usePostulacionesPlaza';

const tableHeaders = [
  { title: 'DOCENTE_NOMBRE', type: 'string', label: 'Docente' },
  { title: 'DNI', type: 'string', label: 'DNI' },
  { title: 'ESTADO', type: 'string', label: 'Estado' },
  { title: 'FECHA_POSTULACION', type: 'date', label: 'Postulado' },
  { title: 'FECHA_ENTREVISTA', type: 'date', label: 'Entrevista' },
  { title: 'ENTREVISTA_REALIZADA', type: 'boolean', label: 'Ent. hecha' },
  { title: 'FECHA_CONTRATO', type: 'date', label: 'Contrato' },
  { title: 'CONTRATO_FIRMADO', type: 'boolean', label: 'Firmado' },
  { title: 'ACTIVO', type: 'boolean', label: 'Activo' }
];

function PostulacionesPlazaPanel({ plaza, onBack }) {
  const { postulaciones, loading, bulkLoading, refresh, create, loadAllDocentes } = usePostulacionesPlaza(plaza);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState(null);

  const initialValues = useMemo(() => ({
    ID_PLAZA_DOCENTE: plaza?.ID_PLAZA_DOCENTE,
    ESTADO: 'postulado',
    ACEPTADO: false,
    CONTRATO_FIRMADO: false,
    ENTREVISTA_REALIZADA: false,
    ACTIVO: true,
  }), [plaza]);

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

  const handleBulk = async () => {
    setFormError(null);
    try {
      await loadAllDocentes();
    } catch (err) {
      setFormError(err.message);
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
                Postulantes de {plaza?.IDENTIFICADOR_DOCENTE}
              </h2>
              <p className="text-sm text-gray-500">
                {plaza?.NOMBRE_CURSO} · {plaza?.NOMBRE_SEDE} · {plaza?.CODIGO_PERIODO}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleBulk}
              disabled={bulkLoading}
              className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {bulkLoading ? 'Cargando...' : 'Cargar todos los docentes'}
            </button>
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
          tableProps={{ emptyMessage: 'No hay postulaciones para esta plaza' }}
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
