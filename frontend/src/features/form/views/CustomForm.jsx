import React, { useState } from 'react';
import Form from './Form';

/**
 * CustomForm - Formulario con lógica completamente personalizada
 * Permite definir funciones custom para validación, transformación y submit
 * No tiene conexión directa al backend, todo se maneja mediante callbacks
 */
const CustomForm = ({
  // Campos del formulario
  fields,
  initialValues = {},
  validation = {},

  // Funciones personalizadas
  onSubmit,              // Función principal: async (formData) => {}
  onValidate,            // Validación custom: (formData) => errorsObject
  transformData,         // Transformar antes de submit: (formData) => transformedData
  beforeSubmit,          // Hook antes de submit: (formData) => boolean (si false, cancela)
  afterSubmit,           // Hook después de submit: (result, formData) => {}

  // UI
  submitText = 'Guardar',
  className = '',
  loading: externalLoading = false,

  // Render custom
  renderHeader,          // () => ReactNode
  renderFooter,          // () => ReactNode
  renderBeforeForm,      // () => ReactNode
  renderAfterForm,        // () => ReactNode

  // Debug
  showWarnings = false
}) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const [customError, setCustomError] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);

  const loading = externalLoading || internalLoading;

  /**
   * Manejar submit con lógica personalizada
   */
  const handleSubmit = async (formData) => {
    setCustomError(null);
    setSubmitResult(null);

    // Hook beforeSubmit - puede cancelar el submit
    if (beforeSubmit) {
      const shouldProceed = beforeSubmit(formData);
      if (shouldProceed === false) {
        return;
      }
    }

    // Validación custom
    if (onValidate) {
      const validationErrors = onValidate(formData);
      if (validationErrors && Object.keys(validationErrors).length > 0) {
        // Convertir errores a formato que Form pueda usar
        const formattedErrors = Object.entries(validationErrors).map(([field, error]) => ({
          field,
          error
        }));

        setCustomError({
          type: 'validation',
          message: 'Error de validación',
          details: formattedErrors
        });

        return;
      }
    }

    // Transformar datos si es necesario
    const dataToSubmit = transformData ? transformData(formData) : formData;

    // Ejecutar submit
    setInternalLoading(true);

    try {
      const result = await onSubmit(dataToSubmit);

      setSubmitResult({
        success: true,
        data: result
      });

      // Hook afterSubmit
      afterSubmit?.(result, formData);

    } catch (error) {
      setCustomError({
        type: 'submit',
        message: error.message || 'Error al procesar el formulario',
        error
      });

      // Hook afterSubmit también se llama en error (con null result)
      afterSubmit?.(null, formData);

    } finally {
      setInternalLoading(false);
    }
  };

  /**
   * Renderizar errores de validación custom
   */
  const renderValidationErrors = () => {
    if (!customError || customError.type !== 'validation') return null;

    return (
      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <h4 className="text-sm font-medium text-yellow-800 mb-2">
          {customError.message}
        </h4>
        <ul className="list-disc list-inside text-sm text-yellow-600">
          {customError.details.map((err, idx) => (
            <li key={idx}>{err.field}: {err.error}</li>
          ))}
        </ul>
      </div>
    );
  };

  /**
   * Renderizar error de submit
   */
  const renderSubmitError = () => {
    if (!customError || customError.type !== 'submit') return null;

    return (
      <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-sm text-red-600">{customError.message}</p>
      </div>
    );
  };

  /**
   * Renderizar mensaje de éxito
   */
  const renderSuccessMessage = () => {
    if (!submitResult || !submitResult.success) return null;

    return (
      <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
        <p className="text-sm text-green-600">¡Operación completada exitosamente!</p>
      </div>
    );
  };

  return (
    <div className={className}>
      {/* Header custom */}
      {renderHeader?.()}

      {/* Mensajes de estado */}
      {renderValidationErrors()}
      {renderSubmitError()}
      {renderSuccessMessage()}

      {/* Contenido antes del form */}
      {renderBeforeForm?.()}

      {/* Formulario base */}
      <Form
        fields={fields}
        initialValues={initialValues}
        validation={validation}
        onSubmit={handleSubmit}
        submitText={submitText}
        loading={loading}
        showWarnings={showWarnings}
      />

      {/* Contenido después del form */}
      {renderAfterForm?.()}

      {/* Footer custom */}
      {renderFooter?.()}

      {/* Debug: Estado interno (solo en desarrollo) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-4 text-xs">
          <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
            Debug: Estado del CustomForm
          </summary>
          <div className="mt-2 p-2 bg-gray-100 rounded space-y-1">
            <div>Loading: {loading ? 'Sí' : 'No'}</div>
            <div>Error: {customError ? JSON.stringify(customError) : 'Ninguno'}</div>
            <div>Result: {submitResult ? JSON.stringify(submitResult) : 'Ninguno'}</div>
          </div>
        </details>
      )}
    </div>
  );
};

export default CustomForm;
