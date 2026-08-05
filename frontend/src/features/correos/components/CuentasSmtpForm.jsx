import React, { useState, useMemo } from 'react';
import { Form } from '@/shared/components/form';
import { cuentasSmtpFormFields, cuentasSmtpValidation, cuentasSmtpMultiStep } from '@/features/correos/config/cuentas-smtp/formConfig';
import { cuentasSmtpService } from '@/features/correos/services/cuentasSmtpService';

function CuentasSmtpForm({ mode = 'create', record = null, onSuccess, onError }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const initialValues = useMemo(() => {
    if (mode === 'edit' && record) {
      const values = {};
      cuentasSmtpFormFields.forEach(field => {
        if (field.name === 'SMTP_PASSWORD') {
          values[field.name] = '';
        } else if (record[field.name] !== undefined && record[field.name] !== null) {
          values[field.name] = record[field.name];
        } else if (field.defaultValue !== undefined) {
          values[field.name] = field.defaultValue;
        } else {
          values[field.name] = '';
        }
      });
      return values;
    }
    return cuentasSmtpFormFields.reduce((acc, field) => {
      acc[field.name] = field.defaultValue !== undefined ? field.defaultValue : '';
      return acc;
    }, {});
  }, [mode, record]);

  const validation = useMemo(() => {
    if (mode === 'edit') {
      const editValidation = { ...cuentasSmtpValidation };
      editValidation.SMTP_PASSWORD = { required: { value: false } };
      return editValidation;
    }
    return cuentasSmtpValidation;
  }, [mode]);

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {};
      cuentasSmtpFormFields.forEach(field => {
        if (formData[field.name] !== undefined) {
          payload[field.name] = formData[field.name];
        }
      });

      if (mode === 'edit' && (!payload.SMTP_PASSWORD || payload.SMTP_PASSWORD.trim() === '')) {
        delete payload.SMTP_PASSWORD;
      }

      if (mode === 'create') {
        await cuentasSmtpService.create(payload);
      } else {
        await cuentasSmtpService.update(record.ID_CUENTA, payload);
      }
      onSuccess?.();
    } catch (err) {
      setSubmitError(err.message || 'Ocurrió un error al guardar la cuenta SMTP');
      onError?.(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {submitError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {submitError}
        </div>
      )}
      <Form
        fields={cuentasSmtpFormFields}
        initialValues={initialValues}
        validation={validation}
        multiStep={cuentasSmtpMultiStep}
        submitText={mode === 'create' ? 'Crear Cuenta' : 'Guardar Cambios'}
        loading={isSubmitting}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

export default CuentasSmtpForm;
