import React, { useMemo } from 'react';
import { useFormState } from '../hooks/useFormState';
import { useFormValidation } from '../hooks/useFormValidation';
import { useMultiStepForm } from '../hooks/useMultiStepForm';
import { organizeFields, getFieldNamesByPage } from '../utils/layoutEngine';
import FormField from '../components/FormField';
import FormSection from '../components/FormSection';
import MultiStepNavigator from '../components/MultiStepNavigator';

/**
 * Componente Form reutilizable y refactorizado
 * Soporta diferentes tipos de campos mediante configuración declarativa
 */
const Form = ({ 
  // Props requeridos
  fields,
  onSubmit,
  
  // Props opcionales
  initialValues = {},
  submitText = 'Enviar',
  className = '',
  loading = false,
  
  // Props de validación
  validation = {},
  
  // Props de layout (nuevo)
  layout = null,
  
  // Props de multi-step (nuevo)
  multiStep = {
    showDots: true,
    persistData: false,
    nextText: 'Siguiente',
    prevText: 'Atrás',
    submitText: 'Confirmar'
  },
  
  // Callbacks (nuevo)
  onPageChange = null,
  
  // Props de estilo
  variant = 'default',
  size = 'medium',
  
  // Props de debug
  showWarnings = false
}) => {
  // Organizar campos según layout - memoizado para evitar re-ejecución innecesaria
  const organizedLayout = useMemo(() => 
    organizeFields(fields, layout, showWarnings), 
    [fields, layout, showWarnings]
  );
  const isMultiStep = organizedLayout.type === 'multistep';
  const totalPages = organizedLayout.totalPages;
  
  // Hooks personalizados para estado y validación
  const {
    formData,
    touched,
    setFieldValue,
    setFieldTouched,
    setAllTouched
  } = useFormState(initialValues);

  const {
    errors,
    validateForm,
    validatePage,
    clearError
  } = useFormValidation(validation);

  // Hook de navegación multi-step
  const {
    currentPage,
    completedPages,
    isLastPage,
    isFirstPage,
    canGoNext,
    canGoPrev,
    goToPage,
    goToNextPage,
    goToPrevPage,
    markPageComplete
  } = useMultiStepForm({
    totalPages,
    persistData: multiStep?.persistData || false,
    storageKey: 'form_' + (layout?.pages?.[0]?.id || 'default'),
    onPageChange
  });

  // Página actual del layout
  const currentPageData = isMultiStep 
    ? organizedLayout.pages.find(p => p.number === currentPage) 
    : organizedLayout.pages[0];

  /**
   * Maneja cambios en los campos
   */
  const handleChange = (fieldName, value) => {
    setFieldValue(fieldName, value);
    clearError(fieldName);
  };

  /**
   * Maneja blur para validación
   */
  const handleBlur = (fieldName) => {
    setFieldTouched(fieldName);
  };

  /**
   * Maneja avance a siguiente página (solo multi-step)
   */
  const handleNextPage = (e) => {
    if (e) {
      e.persist();
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!isMultiStep) return false;

    // Obtener campos de la página actual
    const pageFieldNames = getFieldNamesByPage(organizedLayout, currentPage);
    
    // Marcar todos los campos de la página como touched
    setAllTouched(pageFieldNames);

    // Validar solo la página actual
    const isPageValid = validatePage(formData, pageFieldNames);

    if (isPageValid) {
      // Marcar página como completada y avanzar
      markPageComplete(currentPage);
      goToNextPage();
    }
    
    return false;
  };

  /**
   * Maneja retroceso a página anterior (solo multi-step)
   */
  const handlePrevPage = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!isMultiStep) return;
    goToPrevPage();
  };

  /**
   * Maneja submit del formulario
   */
  const handleSubmit = (e) => {
    e.preventDefault();

    if (isMultiStep) {
      // En multi-step, validar TODO el formulario al final
      const allFieldNames = fields.map(f => f.name);
      setAllTouched(allFieldNames);
      
      const isValid = validateForm(formData);
      
      if (isValid) {
        onSubmit(formData);
      }
    } else {
      // Single page - comportamiento original
      const fieldNames = fields.map((field) => field.name);
      setAllTouched(fieldNames);

      const isValid = validateForm(formData);

      if (isValid) {
        onSubmit(formData);
      }
    }
  };

  /**
   * Renderiza un campo individual
   */
  const renderField = (field) => {
    const { name } = field;
    const value = formData[name];
    const error = touched[name] ? errors[name] : '';

    return (
      <FormField
        key={name}
        field={field}
        value={value}
        error={error}
        touched={touched[name]}
        onChange={(fieldName, newValue) => handleChange(fieldName, newValue)}
        onBlur={() => handleBlur(name)}
      />
    );
  };

  /**
   * Renderiza una sección con sus campos
   */
  const renderSection = (section) => {
    if (!section.fields || section.fields.length === 0) return null;

    return (
      <FormSection
        key={section.id}
        id={section.id}
        number={section.number}
        title={section.title}
        description={section.description}
        isActive={true}
      >
        {section.fields.map(renderField)}
      </FormSection>
    );
  };

  /**
   * Renderiza el contenido de la página actual
   */
  const renderPageContent = () => {
    if (!currentPageData) return null;

    return (
      <div className="page-content">
        {/* Título y descripción de la página */}
        {currentPageData.title && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              {currentPageData.title}
            </h2>
            {currentPageData.description && (
              <p className="text-gray-600 mt-1">
                {currentPageData.description}
              </p>
            )}
          </div>
        )}

        {/* Secciones de la página */}
        <div className="space-y-6">
          {currentPageData.sections.map(renderSection)}
        </div>
      </div>
    );
  };

  /**
   * Renderiza navegación para multi-step
   */
  const renderMultiStepNavigation = () => {
    if (!isMultiStep) return null;

    return (
      <MultiStepNavigator
        currentPage={currentPage}
        totalPages={totalPages}
        completedPages={completedPages}
        isLastPage={isLastPage}
        isFirstPage={isFirstPage}
        canGoNext={canGoNext}
        canGoPrev={canGoPrev}
        onNext={handleNextPage}
        onPrev={handlePrevPage}
        goToPage={goToPage}
        showDots={multiStep?.showDots !== false}
        nextText={multiStep?.nextText || 'Siguiente'}
        prevText={multiStep?.prevText || 'Atrás'}
        submitText={multiStep?.submitText || 'Confirmar'}
        loading={loading}
        currentPageTitle={currentPageData?.title || ''}
      />
    );
  };

  /**
   * Renderiza botón de submit para single-page
   */
  const renderSinglePageSubmit = () => {
    if (isMultiStep) return null;

    return (
      <div className="mt-6">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Enviando...' : submitText}
        </button>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className={className} noValidate>
      {/* Contenido de la página (campos) */}
      {renderPageContent()}
      
      {/* Navegación multi-step o botón submit */}
      {isMultiStep ? renderMultiStepNavigation() : renderSinglePageSubmit()}
    </form>
  );
};

export default Form;
