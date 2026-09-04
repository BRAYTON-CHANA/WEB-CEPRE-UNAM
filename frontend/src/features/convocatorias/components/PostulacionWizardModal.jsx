import React, { useMemo, useEffect, useRef } from 'react';
import { Modal } from '@/shared/components/modal';
import FormField from '@/shared/components/form/components/FormField';
import FormSection from '@/shared/components/form/components/FormSection';
import MultiStepNavigator from '@/shared/components/form/components/MultiStepNavigator';
import { evaluateHidden } from '@/shared/components/form/utils/conditionEvaluator';
import PredefinedFilesInput from '@/shared/components/ui/inputs/PredefinedFilesInput';
import PredefinedQuestionsInput from '@/shared/components/ui/inputs/PredefinedQuestionsInput';
import DocenteTablasRelacionadas from '@/features/docentes/components/DocenteTablasRelacionadas';
import { getDniUrl, getDocenteFileUrl } from '@/features/docentes/services/docentesStorageService';
import PlazasSelector from '@/features/convocatorias/components/PlazasSelector';
import {
  docenteUsuarioFields,
  docenteDocenteFields
} from '@/features/docentes/config/formConfig';
import { usePostulacionWizard } from '@/features/convocatorias/hooks/usePostulacionWizard';

/**
 * Badge reutilizable para modo creación inline (docente o usuario).
 */
function CrearModeBadge({ label, onCancel }) {
  return (
    <div className="flex items-center justify-between mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <span className="text-sm font-medium text-blue-800">
        {label}
      </span>
      <button
        type="button"
        onClick={onCancel}
        className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
      >
        Cancelar creación
      </button>
    </div>
  );
}

/**
 * PostulacionWizardModal — wizard de 3 páginas para "Añadir Postulación".
 *
 * Página 1: Selección de sede-curso + selección/creación de docente (combinadas).
 * Página 2: Tablas relacionadas del docente.
 * Página 3: Adjuntos de postulación (requisitos).
 *
 * Al finalizar: crea docente (si nuevo) + tablas + postulación + snapshot + adjuntos.
 *
 * Props:
 *   isOpen, onClose
 *   idConvocatoriaCursoInicial - si viene de filtro, bloquea selector página 1
 *   convocatoriaCursos - lista de VW_CONVOCATORIAS_CURSO disponibles
 *   convocatoriaLabel - texto a mostrar en campo convocatoria
 *   onSuccess - callback tras postulación creada
 */
function PostulacionWizardModal({
  isOpen,
  onClose,
  idConvocatoriaCursoInicial = null,
  convocatoriaCursos = [],
  convocatoriaLabel = '',
  onSuccess,
  onRefreshPlazas,
  refreshingPlazas = false
}) {
  const wizard = usePostulacionWizard({
    idConvocatoriaCursoInicial,
    convocatoriaCursos,
    convocatoriaLabel,
    onSuccess,
    onClose
  });

  const {
    currentPage,
    isSubmitting,
    submitError,
    modoDocente,
    formData,
    errors,
    setFieldValue,
    handleFieldChange,
    navProps,
    handleSubmit,
    handleClose,
    handleModoDocenteChange,
    handleModoUsuarioChange,
    handleDocenteSeleccionado,
    tablasRelacionadasRef,
    docenteSelectorField,
    adjuntosFieldConfig,
    adjuntosData,
    setAdjuntosData,
    preguntasFieldConfig,
    preguntasData,
    setPreguntasData,
    getUsuarioFieldsForRender,
    idDocenteGuardado,
    isLoadingDocente,
    isLoadingUsuario,
    postulacionesExistentes,
    hasUnsavedChanges,
    isSavingUsuario,
    handleGuardarCambiosUsuario,
    handleGuardarUsuarioNuevo,
    idConvocatoriaCursoSeleccionado,
  } = wizard;

  // Scroll al inicio del modal al cambiar de página
  const pageContentRef = useRef(null);
  useEffect(() => {
    if (pageContentRef.current) {
      // Buscar el contenedor scrollable más cercano (body del modal)
      let scrollContainer = pageContentRef.current.closest('.overflow-y-auto');
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // Fallback: scroll al top del page-content
        pageContentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [currentPage]);

  // ── Renderizar un campo ──
  const renderField = (field) => {
    const isHidden = field.hidden ? evaluateHidden(field.hidden, formData) : false;
    if (isHidden) return null;

    const isUserField = field.name !== '_modo_usuario'
      && field.name !== '_usuario_seleccionado'
      && field.name !== 'ID_DOCENTE'
      && field.name !== 'ID_USUARIO'
      && !field.hidden;

    // Modo seleccionar docente: ocultar campos si no hay docente seleccionado
    const shouldHideField = isUserField
      && currentPage === 1
      && modoDocente === 'seleccionar'
      && !idDocenteGuardado;

    if (shouldHideField) return null;

    // Ocultar el selector _usuario_seleccionado cuando estamos en modo crear usuario
    if (field.name === '_usuario_seleccionado'
      && modoDocente === 'seleccionar'
      && idDocenteGuardado
      && formData._modo_usuario === 'crear') {
      return null;
    }

    // Modo crear docente + sub-modo seleccionar usuario: bloquear hasta elegir usuario
    // Modo seleccionar docente: bloquear si se quitó el usuario vinculado
    // También bloquear durante la carga del docente o usuario
    const shouldBeDisabled = isUserField
      && currentPage === 1
      && (
        isLoadingDocente
        || isLoadingUsuario
        || (modoDocente === 'crear' && formData._modo_usuario === 'seleccionar' && !formData._usuario_seleccionado)
        || (modoDocente === 'seleccionar' && idDocenteGuardado && !formData._usuario_seleccionado && formData._modo_usuario !== 'crear')
      );

    // Inyectar getDownloadUrl para campos file con storagePath
    // DNI_ARCHIVO usa getDniUrl (bucket usuarios); los archivos de docente
    // (grado, constancia) usan getDocenteFileUrl (bucket usuarios-adjuntos).
    const fieldWithDownload = field.type === 'file' && field.name === 'DNI_ARCHIVO'
      ? { ...field, getDownloadUrl: (fileValue) => {
          if (fileValue && fileValue.storagePath) {
            return getDniUrl(fileValue.storagePath);
          }
          return null;
        }}
      : field.type === 'file' && (
          field.name === 'GRADO_ACADEMICO_ARCHIVO'
          || field.name === 'CONSTANCIA_SUNEDU_DRE_ARCHIVO'
        )
        ? { ...field, getDownloadUrl: (fileValue) => {
            if (fileValue && fileValue.storagePath) {
              return getDocenteFileUrl(fileValue.storagePath);
            }
            return null;
          }}
        : field;

    // Si es el campo _usuario_seleccionado, pasar onAddClick para modo crear inline
    const fieldWithInlineAdd = field.name === '_usuario_seleccionado' && field._inlineAddMode
      ? { ...fieldWithDownload, onAddClick: () => handleModoUsuarioChange('crear') }
      : fieldWithDownload;

    return (
      <FormField
        key={field.name}
        field={fieldWithInlineAdd}
        value={formData[field.name]}
        error={errors[field.name]}
        touched={!!errors[field.name]}
        onChange={handleFieldChange}
        formData={formData}
        disabled={shouldBeDisabled}
      />
    );
  };

  // ── Renderizar sección con grid de columnas ──
  const renderSection = (fields, sectionConfig) => {
    // Modo seleccionar docente sin docente elegido: ocultar toda la sección
    if (currentPage === 1 && modoDocente === 'seleccionar' && !idDocenteGuardado) return null;

    const visibleFields = fields.filter(f => {
      if (f.hidden && evaluateHidden(f.hidden, formData)) return false;
      if (f.name === '_modo_usuario') return false;
      if (f._page1Only && modoDocente === 'seleccionar') return false;
      if (f._visibleWhenModoSeleccionar && formData._modo_usuario !== 'seleccionar') return false;
      return true;
    });

    if (visibleFields.length === 0) return null;

    const columns = sectionConfig?.columns || 3;

    return (
      <FormSection
        title={sectionConfig?.title || ''}
        description={sectionConfig?.description || ''}
        columns={columns}
        variant={sectionConfig?.variant || 'default'}
        isActive={true}
      >
        {visibleFields.map(field => {
          const colSpan = Math.min(field.colSpan || 1, columns);
          const colSpanClass = colSpan === 1 ? 'md:col-span-1'
            : colSpan === 2 ? 'md:col-span-2'
            : colSpan === 3 ? 'md:col-span-3'
            : 'md:col-span-1';
          return (
            <div key={field.name} className={colSpanClass}>
              {renderField(field)}
            </div>
          );
        })}
      </FormSection>
    );
  };

  // ── Página 1: docente + sede-curso (al final) ──
  const renderPage1 = () => {
    return (
      <div className="space-y-4">
        {/* Convocatoria (informativo, sin wrapper) */}
        <FormField
          field={{
            name: 'ID_CONVOCATORIA',
            type: 'text',
            label: 'Convocatoria',
            disabled: true,
            defaultValue: convocatoriaLabel,
            ignoreField: true
          }}
          value={convocatoriaLabel}
          onChange={() => {}}
          formData={formData}
        />

        {/* Badge de modo crear docente + cancelar */}
        {modoDocente === 'crear' && (
          <CrearModeBadge
            label="Creando nuevo docente — complete los datos"
            onCancel={() => handleModoDocenteChange('seleccionar')}
          />
        )}

        {/* Selector de docente existente (solo en modo seleccionar) */}
        {modoDocente === 'seleccionar' && (
          <FormField
            field={docenteSelectorField}
            value={formData._docente_seleccionado}
            error={errors._docente_seleccionado}
            touched={!!errors._docente_seleccionado}
            onChange={(name, value) => {
              setFieldValue('_docente_seleccionado', value);
              handleDocenteSeleccionado(value);
            }}
            formData={formData}
          />
        )}

        {/* Campos de usuario — en modo seleccionar con docente, se muestran como contenido cargado */}
        {modoDocente === 'seleccionar' && idDocenteGuardado ? (
          <div
            className="relative mt-6 border-l-4 pl-5 [&>div]:bg-transparent [&>div]:mb-0"
            style={{ borderLeftColor: '#25346A' }}
          >
            {/* Overlay de carga (docente o usuario) */}
            {(isLoadingDocente || isLoadingUsuario) && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-lg">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="text-sm font-medium text-blue-700">Cargando datos del usuario...</span>
                </div>
              </div>
            )}

            {/* Badge de modo crear usuario + cancelar */}
            {formData._modo_usuario === 'crear' && (
              <div className="mb-6">
                <CrearModeBadge
                  label="Creando nuevo usuario — complete los datos"
                  onCancel={() => handleModoUsuarioChange('seleccionar')}
                />
              </div>
            )}

            <div className="relative">
              {renderSection(getUsuarioFieldsForRender(), {
                title: null,
                description: null,
                columns: 3,
                variant: 'plain'
              })}
            </div>

            {/* Botón Guardar usuario nuevo — aparece en modo crear */}
            {formData._modo_usuario === 'crear' && (
              <div className="flex items-center justify-end mt-4">
                <button
                  type="button"
                  onClick={handleGuardarUsuarioNuevo}
                  disabled={isSavingUsuario}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingUsuario ? 'Guardando...' : 'Guardar usuario nuevo'}
                </button>
              </div>
            )}

            {/* Botón Guardar cambios — aparece cuando hay cambios sin guardar (modo seleccionar) */}
            {hasUnsavedChanges && formData._modo_usuario !== 'crear' && (
              <div className="flex items-center justify-between mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <span className="text-sm font-medium text-amber-800">
                  Hay cambios sin guardar en el usuario
                </span>
                <button
                  type="button"
                  onClick={handleGuardarCambiosUsuario}
                  disabled={isSavingUsuario}
                  className="px-4 py-1.5 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingUsuario ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            )}
          </div>
        ) : modoDocente === 'crear' ? (
          <div
            className="relative mt-6 border-l-4 pl-5 [&>div]:bg-transparent [&>div]:mb-0"
            style={{ borderLeftColor: '#25346A' }}
          >
            {/* Overlay de carga (usuario) */}
            {isLoadingUsuario && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-lg">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="text-sm font-medium text-blue-700">Cargando datos del usuario...</span>
                </div>
              </div>
            )}

            {/* Badge de modo crear usuario + cancelar */}
            {formData._modo_usuario === 'crear' && (
              <div className="mb-6">
                <CrearModeBadge
                  label="Creando nuevo usuario — complete los datos"
                  onCancel={() => handleModoUsuarioChange('seleccionar')}
                />
              </div>
            )}

            <div className="relative">
              {renderSection(getUsuarioFieldsForRender(), {
                title: formData._modo_usuario === 'crear' ? 'Nuevo Usuario' : null,
                description: formData._modo_usuario === 'crear'
                  ? 'Complete los datos del nuevo usuario que será vinculado al docente.'
                  : null,
                columns: 3,
                variant: 'plain'
              })}
            </div>

            {/* Botón Guardar usuario nuevo — aparece en modo crear */}
            {formData._modo_usuario === 'crear' && (
              <div className="flex items-center justify-end mt-4">
                <button
                  type="button"
                  onClick={handleGuardarUsuarioNuevo}
                  disabled={isSavingUsuario}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingUsuario ? 'Guardando...' : 'Guardar usuario nuevo'}
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    );
  };

  // ── Página 2: campos docente + plazas + tablas relacionadas ──
  const renderPage2 = () => {
    const tablasMode = modoDocente === 'seleccionar' ? 'edit' : 'create';
    return (
      <div className="space-y-4">
        {/* Campos de docente */}
        {renderSection(docenteDocenteFields, {
          title: 'Información del Docente',
          description: 'Datos académicos y laborales del docente.',
          columns: 3
        })}

        {/* Selector de plazas múltiples por sede */}
        <PlazasSelector
          convocatoriaCursos={convocatoriaCursos}
          selectedIds={formData.ID_CONVOCATORIA_CURSOS || []}
          postuladasIds={postulacionesExistentes}
          onChange={(newIds) => setFieldValue('ID_CONVOCATORIA_CURSOS', newIds)}
          onRefresh={onRefreshPlazas}
          refreshing={refreshingPlazas}
          error={errors.ID_CONVOCATORIA_CURSOS}
        />

        {/* Tablas relacionadas */}
        <DocenteTablasRelacionadas
          ref={tablasRelacionadasRef}
          idDocente={idDocenteGuardado}
          mode={tablasMode}
        />
      </div>
    );
  };

  // ── Página 3: preguntas + documentos de postulación ──
  const renderPage3 = () => {
    return (
      <div className="space-y-4">
        <FormSection
          title="Preguntas de postulación"
          description="Responda las preguntas según la condición laboral del docente."
          columns={1}
          isActive={true}
        >
          <div className="md:col-span-1">
            <PredefinedQuestionsInput
              name="PREGUNTAS_DATA"
              value={preguntasData}
              onChange={(name, value) => setPreguntasData(value)}
              mode="create"
              triggerField="CONDICION_LABORAL"
              loadPredefined={preguntasFieldConfig.loadPredefined}
              labels={preguntasFieldConfig.labels}
              formData={formData}
            />
          </div>
        </FormSection>

        <FormSection
          title="Documentos de postulación"
          description="Suba los documentos requeridos según la condición laboral del docente."
          columns={1}
          isActive={true}
        >
          <div className="md:col-span-1">
            <PredefinedFilesInput
              name="ADJUNTOS_DATA"
              value={adjuntosData}
              onChange={(name, value) => setAdjuntosData(value)}
              mode="create"
              triggerField="CONDICION_LABORAL"
              loadPredefined={adjuntosFieldConfig.loadPredefined}
              getDownloadUrl={adjuntosFieldConfig.getDownloadUrl}
              labels={adjuntosFieldConfig.labels}
              accept={adjuntosFieldConfig.accept}
              maxSize={adjuntosFieldConfig.maxSize}
              formData={formData}
            />
          </div>
        </FormSection>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Añadir postulación"
      size="full"
      closeOnOutsideClick={false}
    >
      <div className="p-8 space-y-6">
        {submitError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600"><strong>Error:</strong> {submitError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <MultiStepNavigator {...navProps} part="header" />

          <div ref={pageContentRef} className="page-content mt-8 min-h-[60vh]">
            <div className={currentPage === 1 ? '' : 'hidden'}>{renderPage1()}</div>
            <div className={currentPage === 2 ? '' : 'hidden'}>{renderPage2()}</div>
            <div className={currentPage === 3 ? '' : 'hidden'}>{renderPage3()}</div>
          </div>

          <MultiStepNavigator {...navProps} part="footer" />
        </form>
      </div>
    </Modal>
  );
}

export default PostulacionWizardModal;
