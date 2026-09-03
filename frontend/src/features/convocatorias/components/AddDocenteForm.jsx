import React from 'react';
import { CrudForm } from '@/shared/components/form';
import { docentesFormFields, docentesValidation } from '@/features/docentes/config/formConfig';

const AddDocenteForm = ({ onSuccess, onError }) => {
  const handleSuccess = (result) => {
    const data = result?.data ?? result;
    const record = Array.isArray(data) ? data[0] : data;
    onSuccess?.(record);
  };

  return (
    <CrudForm
      tableName="DOCENTES"
      mode="create"
      primaryKey="ID_DOCENTE"
      fields={docentesFormFields}
      validation={docentesValidation}
      onSuccess={handleSuccess}
      onError={onError}
      submitText="Guardar docente"
    />
  );
};

export default AddDocenteForm;
