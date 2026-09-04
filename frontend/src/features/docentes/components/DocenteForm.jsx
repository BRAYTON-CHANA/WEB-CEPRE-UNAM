import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import FormField from '@/shared/components/form/components/FormField';
import FormSection from '@/shared/components/form/components/FormSection';
import MultiStepNavigator from '@/shared/components/form/components/MultiStepNavigator';
import { useFormState } from '@/shared/components/form/hooks/useFormState';
import { useFormValidation } from '@/shared/components/form/hooks/useFormValidation';
import { evaluateHidden } from '@/shared/components/form/utils/conditionEvaluator';
import {
  docenteUsuarioFields,
  docenteDocenteFields,
  docentesValidation
} from '@/features/docentes/config/formConfig';
import {
  guardarUsuarioDocente,
  guardarDocenteCompleto,
  subirArchivosDocente,
  cargarUsuario
} from '@/features/docentes/services/docenteService';
import { getDniUrl, getDocenteFileUrl } from '@/features/docentes/services/docentesStorageService';
import DocenteTablasRelacionadas from '@/features/docentes/components/DocenteTablasRelacionadas';
import { useDocenteUsuario, buildDocenteArchivo } from '@/features/docentes/hooks/useDocenteUsuario';
import cacheService from '@/shared/services/cacheService';

/**
 * DocenteForm - Formulario especial de docentes de 2 páginas.
 *
 * Página 1: Datos de usuario (seleccionar existente o crear/editar).
 *   - Al pasar a página 2, guarda el usuario y obtiene ID_USUARIO.
 * Página 2: Datos de docente.
 *   - Al hacer submit, crea/actualiza DOCENTES con el ID_USUARIO.
 *
 * Props:
 *   - mode: 'create' | 'edit'
 *   - recordId: ID_DOCENTE (modo edit)
 *   - selectedRow: fila de VW_DOCENTES (modo edit)
 *   - onSuccess, onError
 */
const DocenteForm = ({
  mode = 'create',
  recordId = null,
  selectedRow = null,
  onSuccess,
  onError
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [idUsuarioGuardado, setIdUsuarioGuardado] = useState(null);
  const [idDocenteGuardado, setIdDocenteGuardado] = useState(mode === 'edit' ? recordId : null);
  const [loadingRecord, setLoadingRecord] = useState(mode === 'edit');
  const tablasRelacionadasRef = useRef(null);

  // ── Valores iniciales ──
  const initialValues = useMemo(() => {
    if (mode === 'edit' && selectedRow) {
      const vals = {};
      docenteUsuarioFields.forEach(f => {
        if (f.name === '_modo_usuario') {
          vals[f.name] = 'editar';
        } else if (f.name === '_usuario_seleccionado') {
          vals[f.name] = '';
        } else if (f.name === 'ID_DOCENTE') {
          vals[f.name] = selectedRow.ID_DOCENTE || '';
        } else if (f.name === 'ID_USUARIO') {
          vals[f.name] = selectedRow.ID_USUARIO || '';
          vals._id_usuario_original = selectedRow.ID_USUARIO || '';
        } else {
          vals[f.name] = selectedRow[f.name] !== null && selectedRow[f.name] !== undefined
            ? selectedRow[f.name] : '';
        }
      });
      docenteDocenteFields.forEach(f => {
        // Los campos file de docente (grado, constancia) no existen como
        // columna literal en VW_DOCENTES; se reconstruyen desde las columnas de
        // metadata de storage (<prefix>_STORAGE_PATH, _FILENAME, _TAMAÑO_BYTES).
        if (f.type === 'file' && f.name === 'GRADO_ACADEMICO_ARCHIVO') {
          vals[f.name] = buildDocenteArchivo(selectedRow, 'GRADO_ACADEMICO');
        } else if (f.type === 'file' && f.name === 'CONSTANCIA_SUNEDU_DRE_ARCHIVO') {
          vals[f.name] = buildDocenteArchivo(selectedRow, 'CONSTANCIA_SUNEDU_DRE');
        } else {
          vals[f.name] = selectedRow[f.name] !== null && selectedRow[f.name] !== undefined
            ? selectedRow[f.name] : (f.defaultValue !== undefined ? f.defaultValue : '');
        }
      });
      return vals;
    }
    // Modo create
    const vals = {};
    docenteUsuarioFields.forEach(f => {
      vals[f.name] = f.defaultValue !== undefined ? f.defaultValue : '';
    });
    docenteDocenteFields.forEach(f => {
      vals[f.name] = f.defaultValue !== undefined ? f.defaultValue : '';
    });
    vals._modo_usuario = 'seleccionar';
    return vals;
  }, [mode, selectedRow]);

  // ── Hooks de form ──
  const { formData, setFieldValue, setAllTouched, setFormData } = useFormState(initialValues);
  const { errors, validatePage } = useFormValidation(docentesValidation, [...docenteUsuarioFields, ...docenteDocenteFields]);

  // ── Lógica de usuario (selección/creación/limpieza) extraída al hook ──
  const {
    handleFieldChange,
    handleModeChange,
    llenarCamposUsuario,
    isLoadingUsuario
  } = useDocenteUsuario({ setFormData, setFieldValue, mode, formData });

  // ── En modo edit, cargar datos completos del usuario desde USUARIOS ──
  useEffect(() => {
    if (mode === 'edit' && selectedRow?.ID_USUARIO) {
      const loadUsuario = async () => {
        try {
          setLoadingRecord(true);
          const usuario = await cargarUsuario(selectedRow.ID_USUARIO);
          if (usuario) {
            llenarCamposUsuario(usuario);
          }
        } catch (err) {
          console.error('[DocenteForm] Error cargando usuario:', err);
        } finally {
          setLoadingRecord(false);
        }
      };
      loadUsuario();
    } else if (mode === 'edit') {
      setLoadingRecord(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selectedRow]);

  // ── Filtrar campos de página 1 según modo ──
  const getUsuarioFieldsForRender = () => {
    const modo = formData._modo_usuario;
    return docenteUsuarioFields.filter(field => {
      if (field.hidden && evaluateHidden(field.hidden, formData)) return false;
      if (field._page1Only && mode === 'edit') return false;
      if (field._visibleWhenModoSeleccionar && modo !== 'seleccionar') return false;
      return true;
    });
  };

  // ── Siguiente (página 1 → 2): guardar usuario ──
  const handleNextPage1 = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setSubmitError(null);

    // Validar campos de página 1
    const page1FieldNames = getUsuarioFieldsForRender().map(f => f.name);
    setAllTouched(page1FieldNames);
    const isPage1Valid = validatePage(formData, page1FieldNames);
    if (!isPage1Valid) return;

    // Guardar usuario via service
    setIsSubmitting(true);
    try {
      const idUsuario = await guardarUsuarioDocente(formData);
      setIdUsuarioGuardado(idUsuario);
      setCurrentPage(2);
    } catch (err) {
      console.error('[DocenteForm] Error guardando usuario:', err);
      setSubmitError(err.message || 'Error al guardar el usuario');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Siguiente unificado: dispatch según página actual ──
  const handleNext = async (e) => {
    if (currentPage === 1) {
      await handleNextPage1(e);
    } else if (currentPage === 2) {
      await handleNextPage2(e);
    }
  };

  // ── Atrás ──
  const handlePrev = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setSubmitError(null);
    // Página 3 → 2, Página 2 → 1
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  // ── Siguiente (página 2 → 3): solo validar y pasar, NO guardar docente ──
  const handleNextPage2 = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setSubmitError(null);

    // Validar campos de página 2
    const page2FieldNames = docenteDocenteFields.map(f => f.name);
    setAllTouched(page2FieldNames);
    const isValid = validatePage(formData, page2FieldNames);
    if (!isValid) return;

    // Pasar a página 3 sin guardar (el guardado es al Finalizar)
    setCurrentPage(3);
  };

  // ── Finalizar (página 3): guardar docente + 4 tablas hijas en transacción ──
  const handleFinalizar = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setSubmitError(null);

    const idUsuario = idUsuarioGuardado || formData.ID_USUARIO;
    if (!idUsuario) {
      setSubmitError('No hay un usuario guardado. Vuelva a la página 1.');
      return;
    }

    // 1. Validar todas las tablas relacionadas y obtener sus datos
    const tablasResult = tablasRelacionadasRef.current?.validateAndGetAllData();
    if (!tablasResult || !tablasResult.valid) {
      setSubmitError(tablasResult?.error || 'Complete todos los campos en las tablas relacionadas.');
      return;
    }

    // 2. Subir archivos de docente (grado, título, constancia) a Storage
    setIsSubmitting(true);
    try {
      const archivosMetadata = await subirArchivosDocente(idUsuario, formData);

      // 3. Guardar todo en una transacción
      const idDocenteParaGuardar = mode === 'edit' ? recordId : null;
      const result = await guardarDocenteCompleto(
        formData,
        idUsuario,
        idDocenteParaGuardar,
        tablasResult.data,
        archivosMetadata
      );
      // Invalidar cache aquí (se removió de guardarDocenteCompleto para evitar
      // invalidaciones redundantes cuando el caller hace su propia invalidación)
      cacheService.invalidateAll();
      setIdDocenteGuardado(result.id_docente);
      onSuccess?.({ ID_DOCENTE: result.id_docente, ID_USUARIO: idUsuario });
    } catch (err) {
      console.error('[DocenteForm] Error guardando docente completo:', err);
      setSubmitError(err.message || 'Error al guardar el docente y sus tablas relacionadas');
      onError?.(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Submit handler unificado (disparado por botón submit en última página) ──
  const handleSubmit = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    // Solo relevante en página 3 (botón "Finalizar")
    if (currentPage === 3) {
      handleFinalizar(e);
      return;
    }
    // Página 2 también puede llegar aquí si el form hace submit
    if (currentPage === 2) {
      await handleNextPage2(e);
    }
  };

  // ── Renderizar un campo ──
  const renderField = (field) => {
    const isHidden = field.hidden ? evaluateHidden(field.hidden, formData) : false;
    if (isHidden) return null;

    // Determinar si el campo de usuario debe estar disabled:
    // En modo create + "seleccionar existente" → siempre bloquear (con o sin usuario)
    // En modo "crear" o edit → habilitados
    const isUserField = field.name !== '_modo_usuario'
      && field.name !== '_usuario_seleccionado'
      && field.name !== 'ID_DOCENTE'
      && field.name !== 'ID_USUARIO'
      && !field.hidden;
    const shouldBeDisabled = isUserField
      && mode === 'create'
      && currentPage === 1
      && (
        (formData._modo_usuario === 'seleccionar' && !formData._usuario_seleccionado)
        || isLoadingUsuario
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

    // Intercept + en _usuario_seleccionado: cambiar a modo crear
    const fieldWithInlineAdd = field.name === '_usuario_seleccionado' && field._inlineAddMode
      ? { ...fieldWithDownload, onAddClick: () => handleModeChange('crear') }
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
    const visibleFields = fields.filter(f => {
      if (f.hidden && evaluateHidden(f.hidden, formData)) return false;
      // No renderizar _modo_usuario como campo normal — se renderiza como switcher custom
      if (f.name === '_modo_usuario') return false;
      if (f._page1Only && mode === 'edit') return false;
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

  // ── Mode switcher (segmented control) ──
  const modoUsuario = formData._modo_usuario || 'seleccionar';
  const showModeSwitcher = mode === 'create';

  const renderModeSwitcher = () => {
    if (!showModeSwitcher) return null;

    const options = [
      {
        value: 'seleccionar',
        label: 'Seleccionar existente',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        )
      },
      {
        value: 'crear',
        label: 'Crear nuevo',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        )
      }
    ];

    return (
      <div className="inline-flex w-full rounded-lg border border-gray-200 bg-gray-50 p-1">
        {options.map(opt => {
          const isActive = modoUsuario === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleModeChange(opt.value)}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium
                transition-all duration-200
                ${isActive
                  ? 'bg-white text-blue-700 shadow-sm border border-blue-100'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                }
              `}
            >
                {opt.icon}
                {opt.label}
              </button>
            );
          })}
      </div>
    );
  };

  if (loadingRecord) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600">Cargando información del docente...</p>
      </div>
    );
  }

  const totalPages = 3;
  const isLastPage = currentPage === totalPages;
  const isFirstPage = currentPage === 1;
  const navProps = {
    currentPage,
    totalPages,
    completedPages: [],
    isLastPage,
    isFirstPage,
    canGoNext: !isSubmitting,
    canGoPrev: !isSubmitting,
    onNext: handleNext,
    onPrev: handlePrev,
    showDots: true,
    nextText: 'Siguiente',
    prevText: 'Atrás',
    submitText: 'Finalizar',
    loading: isSubmitting,
    currentPageTitle: currentPage === 1 ? 'Datos de Usuario' : currentPage === 2 ? 'Datos de Docente' : 'Tablas Relacionadas'
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {submitError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600"><strong>Error:</strong> {submitError}</p>
        </div>
      )}

      <MultiStepNavigator {...navProps} part="header" />

      <div className="page-content mt-4">
        {currentPage === 1 && (
          <>
            {mode === 'create' && modoUsuario === 'crear' && (
              <div className="flex items-center justify-between mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-sm font-medium text-blue-800">
                  Creando nuevo usuario — complete los datos
                </span>
                <button
                  type="button"
                  onClick={() => handleModeChange('seleccionar')}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancelar creación
                </button>
              </div>
            )}
            <div className={`relative ${isLoadingUsuario ? 'pointer-events-none' : ''}`}>
              {renderSection(docenteUsuarioFields, {
                title: mode === 'edit'
                  ? 'Información del Usuario'
                  : modoUsuario === 'crear'
                    ? 'Nuevo Usuario'
                    : null,
                description: mode === 'edit'
                  ? 'Datos del usuario asociado al docente'
                  : modoUsuario === 'crear'
                    ? 'Complete los datos del nuevo usuario que será vinculado al docente.'
                    : null,
                columns: 3
              })}
              {isLoadingUsuario && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-lg">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="text-sm font-medium text-blue-700">Cargando datos del usuario...</span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        {currentPage === 2 && (
          renderSection(docenteDocenteFields, {
            title: 'Información del Docente',
            description: 'Datos académicos y laborales del docente',
            columns: 3
          })
        )}
        {currentPage === 3 && (
          <DocenteTablasRelacionadas
            ref={tablasRelacionadasRef}
            idDocente={idDocenteGuardado}
            mode={mode === 'edit' ? 'edit' : 'create'}
          />
        )}
      </div>

      <MultiStepNavigator {...navProps} part="footer" />
    </form>
  );
};

export default DocenteForm;
