import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Form from './Form';
import { useCrudForm } from '../hooks/useCrudForm';
import { validateFieldsAgainstSchema, buildPayload } from '../utils/schemaValidator';

/**
 * CrudForm - Formulario conectado directamente al backend
 * Valida campos contra el schema de la tabla antes de enviar
 * Soporta modos: create | edit
 */
const CrudForm = ({
  // Configuración de tabla
  tableName,
  mode = 'create',
  primaryKey = 'id',
  recordId = null,

  // Campos del formulario (definidos manualmente)
  fields,
  validation = {},
  
  // Layout y multi-step (nuevo)
  layout = null,
  multiStep = null,
  onPageChange = null,

  // Callbacks
  onSuccess,
  onError,
  onFieldMismatch,

  // UI
  submitText,
  className = '',

  // Debug
  showWarnings = false,
  showVisualDebugs = false,

  // Confirmación modal
  confirmSubmit = false,
  confirmConfig = {}
}) => {
  const [fieldErrors, setFieldErrors] = useState([]);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hook para manejo de CRUD
  const {
    schema,
    record,
    loading,
    error: crudError,
    isInitialized,
    submit
  } = useCrudForm(tableName, mode, recordId, primaryKey);

  // Memoizar initialValues para evitar re-renders en cascada
  const initialValues = useMemo(() => {
    return mode === 'edit' && record
      ? fields.reduce((acc, field) => {
          const value = record[field.name];
          // Preservar 0 y false como valores válidos, solo usar '' para null/undefined
          acc[field.name] = value !== null && value !== undefined ? value : '';
          return acc;
        }, {})
      : fields.reduce((acc, field) => {
          // Usar defaultValue si existe, sino valor vacío según el tipo
          acc[field.name] = field.defaultValue !== undefined ? field.defaultValue : '';
          return acc;
        }, {});
  }, [mode, record, fields]);

  // Resetear errores cuando cambia el schema
  useEffect(() => {
    if (schema) {
      setFieldErrors([]);
    }
  }, [schema]);

  /**
   * Manejar submit del formulario
   */
  const handleSubmit = async (formData) => {
    setSubmitAttempted(true);
    setFieldErrors([]);
    setIsSubmitting(true);

    // Validar que tenemos schema
    if (!schema) {
      const error = 'No se pudo cargar el schema de la tabla';
      console.error('[CrudForm.jsx]', error);
      setFieldErrors([{ field: '*', error }]);
      onFieldMismatch?.([{ field: '*', error }]);
      setIsSubmitting(false);
      return;
    }

    // Validar campos del form contra el schema
    const mismatches = validateFieldsAgainstSchema(formData, schema, fields, tableName);

    if (mismatches.length > 0) {
      setFieldErrors(mismatches);
      onFieldMismatch?.(mismatches);
      setIsSubmitting(false);
      return;
    }

    // Construir payload (filtrar campos que no están en schema, excluir PK y campos ignoreField)
    const payload = buildPayload(formData, schema, primaryKey, fields, mode === 'edit' ? record : null);

    try {
      // Enviar al backend
      const result = await submit(payload, recordId);

      // Éxito
      onSuccess?.(result);
    } catch (error) {
      // Error del backend
      console.error('[CrudForm.jsx] Error del backend:', error);
      onError?.(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determinar texto del botón
  const getSubmitText = () => {
    if (submitText) return submitText;
    return mode === 'create' ? 'Crear' : 'Actualizar';
  };

  // Renderizar errores de mismatch de campos
  const renderFieldErrors = () => {
    if (fieldErrors.length === 0) return null;

    return (
      <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
        <h4 className="text-sm font-medium text-red-800 mb-2">
          Errores de validación contra el schema:
        </h4>
        <ul className="list-disc list-inside text-sm text-red-600">
          {fieldErrors.map((err, idx) => (
            <li key={idx}>{err.error}</li>
          ))}
        </ul>
      </div>
    );
  };

  // Renderizar estado de carga
  if (!isInitialized && loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600">Cargando información...</p>
      </div>
    );
  }

  // Renderizar carga de reference-selects (solo en modo create)
  // Eliminado: ya no esperamos a que carguen los reference-selects

  // Renderizar error de inicialización
  if (!isInitialized && crudError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-sm text-red-600">Error: {crudError}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-sm text-blue-600 hover:underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Info del modo - solo si showVisualDebugs es true */}
      {showVisualDebugs && (
        <div className="mb-4 flex items-center justify-between">
          <span className={`
            inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
            ${mode === 'create' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}
          `}>
            {mode === 'create' ? 'Modo: Crear' : `Modo: Editar${recordId ? ` (ID: ${recordId})` : ''}`}
          </span>
          <span className="text-xs text-gray-500">
            Tabla: {tableName}
          </span>
        </div>
      )}

      {/* Errores de validación de campos */}
      {renderFieldErrors()}

      {/* Formulario base */}
      <Form
        fields={fields}
        initialValues={initialValues}
        onSubmit={handleSubmit}
        validation={validation}
        layout={layout}
        multiStep={multiStep}
        onPageChange={onPageChange}
        submitText={submitText}
        loading={isSubmitting}
        className={className}
        showWarnings={showWarnings}
        showVisualDebugs={showVisualDebugs}
        confirmSubmit={confirmSubmit}
        confirmConfig={confirmConfig}
      />

      {/* Debug: Schema cargado (solo en desarrollo y si showVisualDebugs es true) */}
      {process.env.NODE_ENV === 'development' && showVisualDebugs && schema && (
        <details className="mt-4 text-xs">
          <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
            Debug: Schema cargado
          </summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-40">
            {JSON.stringify(schema, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
};

export default React.memo(CrudForm);
