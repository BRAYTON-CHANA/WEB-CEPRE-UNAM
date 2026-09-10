import React, { useState, useMemo } from 'react';
import { Form } from '@/shared/components/form';
import { smtpFormFields, smtpValidation, smtpMultiStep } from '../config/formConfig';
import { smtpService } from '../services/smtpService';

function SmtpForm({ mode = 'create', record = null, onSuccess, onError }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const initialValues = useMemo(() => {
    if (mode === 'edit' && record) {
      const values = {};
      smtpFormFields.forEach(field => {
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
    return smtpFormFields.reduce((acc, field) => {
      acc[field.name] = field.defaultValue !== undefined ? field.defaultValue : '';
      return acc;
    }, {});
  }, [mode, record]);

  const validation = useMemo(() => {
    if (mode === 'edit') {
      const editValidation = { ...smtpValidation };
      editValidation.SMTP_PASSWORD = { required: { value: false } };
      return editValidation;
    }
    return smtpValidation;
  }, [mode]);

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {};
      smtpFormFields.forEach(field => {
        if (formData[field.name] !== undefined) {
          payload[field.name] = formData[field.name];
        }
      });

      if (mode === 'edit' && (!payload.SMTP_PASSWORD || payload.SMTP_PASSWORD.trim() === '')) {
        delete payload.SMTP_PASSWORD;
      }

      payload.SMTP_PORT = 587;

      if (mode === 'create') {
        await smtpService.create(payload);
      } else {
        await smtpService.update(record.ID_CUENTA, payload);
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
        fields={smtpFormFields}
        initialValues={initialValues}
        validation={validation}
        multiStep={smtpMultiStep}
        submitText={mode === 'create' ? 'Crear Cuenta' : 'Guardar Cambios'}
        loading={isSubmitting}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

export default SmtpForm;
