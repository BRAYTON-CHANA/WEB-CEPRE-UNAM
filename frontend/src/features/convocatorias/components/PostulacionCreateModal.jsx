import React from 'react';
import { Form } from '@/shared/components/form';
import { Modal } from '@/shared/components/modal';
import { postulacionValidation } from '@/features/convocatorias/config/postulacionFormConfig';

/**
 * PostulacionCreateModal — modal para crear una postulación.
 * Muestra el formulario con convocatoria bloqueada + selector de sede-curso.
 *
 * @param {boolean} isOpen - si el modal está abierto
 * @param {Function} onClose - handler cerrar
 * @param {Array} formFields - campos del formulario (con selector de convocatoria_curso)
 * @param {Object} initialValues - valores iniciales del formulario
 * @param {Function} onSubmit - handler submit
 * @param {boolean} creating - estado de carga del submit
 * @param {string|null} formError - mensaje de error a mostrar
 */
function PostulacionCreateModal({
  isOpen,
  onClose,
  formFields,
  initialValues,
  onSubmit,
  creating,
  formError,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
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
          fields={formFields}
          initialValues={initialValues}
          validation={postulacionValidation}
          onSubmit={onSubmit}
          loading={creating}
          submitText="Guardar postulación"
        />
      </div>
    </Modal>
  );
}

export default PostulacionCreateModal;
