import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
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
import { useDocenteUsuario, buildDocenteArchivo } from '@/features/docentes/hooks/useDocenteUsuario';
import { db } from '@/shared/api';
import { createPostulacionConDocente, createPostulacionesBatch } from '@/features/convocatorias/services/postulacionesService';
import cacheService from '@/shared/services/cacheService';

/**
 * usePostulacionWizard — lógica del wizard de 3 páginas para "Añadir Postulación".
 *
 * Página 1: Selección de sede-curso + selección/creación de docente (combinadas).
 * Página 2: Tablas relacionadas del docente.
 * Página 3: Adjuntos de postulación (requisitos).
 *
 * Al finalizar:
 *  1. Subir archivos docente (grado, título, constancia).
 *  2. guardarDocenteCompleto (transacción SQL).
 *  3. Construir snapshot de texto + paths.
 *  4. createPostulacionConDocente (insert + copiar archivos snapshot + adjuntos).
 *
 * @param {Object} params
 * @param {number|null} params.idConvocatoriaCursoInicial - si viene de filtro, bloquea selector.
 * @param {Array} params.convocatoriaCursos - lista de VW_CONVOCATORIAS_CURSO disponibles.
 * @param {string} params.convocatoriaLabel - texto a mostrar en campo convocatoria.
 * @param {Function} params.onSuccess - callback tras postulación creada.
 * @param {Function} params.onClose - callback cerrar modal.
 */
export function usePostulacionWizard({
  idConvocatoriaCursoInicial = null,
  convocatoriaCursos = [],
  convocatoriaLabel = '',
  onSuccess,
  onClose
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // IDs guardados al avanzar páginas
  const [idConvocatoriaCursoSeleccionado, setIdConvocatoriaCursoSeleccionado] = useState(idConvocatoriaCursoInicial || '');
  const [idUsuarioGuardado, setIdUsuarioGuardado] = useState(null);
  const [idDocenteGuardado, setIdDocenteGuardado] = useState(null);
  // Estado de carga al seleccionar un docente existente
  const [isLoadingDocente, setIsLoadingDocente] = useState(false);
  // Plazas a las que el docente ya se postuló (para bloquear en el selector)
  const [postulacionesExistentes, setPostulacionesExistentes] = useState([]);

  // Modo docente: 'seleccionar' (existente) | 'crear' (nuevo)
  const [modoDocente, setModoDocente] = useState('seleccionar');
  // Row del docente seleccionado (VW_DOCENTES) si modo = 'seleccionar'
  const [docenteSeleccionadoRow, setDocenteSeleccionadoRow] = useState(null);
  // Snapshot de paths originales del docente/usuario (para copiar al finalizar)
  const snapshotPathsRef = useRef({});
  // Snapshot del usuario original (para detectar cambios y pedir "Guardar cambios")
  const [usuarioSnapshot, setUsuarioSnapshot] = useState(null);
  // Indica si hay cambios sin guardar en el usuario
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  // Indica si se está guardando el usuario
  const [isSavingUsuario, setIsSavingUsuario] = useState(false);

  // Estado de adjuntos de postulación (página 4)
  const [adjuntosData, setAdjuntosData] = useState(null);
  // Estado de respuestas a preguntas (página 4)
  const [preguntasData, setPreguntasData] = useState(null);

  const tablasRelacionadasRef = useRef(null);

  // ── Valores iniciales del form ──
  const initialValues = useMemo(() => {
    const vals = {};
    docenteUsuarioFields.forEach(f => {
      vals[f.name] = f.defaultValue !== undefined ? f.defaultValue : '';
    });
    docenteDocenteFields.forEach(f => {
      vals[f.name] = f.defaultValue !== undefined ? f.defaultValue : '';
    });
    vals._modo_usuario = 'seleccionar';
    vals.ID_CONVOCATORIA_CURSOS = idConvocatoriaCursoInicial ? [idConvocatoriaCursoInicial] : [];
    return vals;
  }, [idConvocatoriaCursoInicial]);

  const { formData, setFieldValue, setAllTouched, setFormData } = useFormState(initialValues);
  const { errors, validatePage } = useFormValidation(docentesValidation, [...docenteUsuarioFields, ...docenteDocenteFields]);

  const {
    handleFieldChange,
    handleModeChange,
    llenarCamposUsuario,
    isLoadingUsuario
  } = useDocenteUsuario({ setFormData, setFieldValue, mode: 'create', formData });

  // ── Filtrar campos de página 2 según modo ──
  const getUsuarioFieldsForRender = () => {
    const modo = formData._modo_usuario;
    return docenteUsuarioFields.filter(field => {
      if (field.hidden && evaluateHidden(field.hidden, formData)) return false;
      if (field._page1Only && modoDocente === 'seleccionar') return false;
      if (field._visibleWhenModoSeleccionar && modo !== 'seleccionar') return false;
      return true;
    });
  };

  // ── Cargar datos del docente existente al seleccionarlo ──
  const handleDocenteSeleccionado = useCallback(async (idDocente) => {
    if (!idDocente) {
      setDocenteSeleccionadoRow(null);
      setIdDocenteGuardado(null);
      snapshotPathsRef.current = {};
      // Limpiar campos usuario + docente
      setFormData(prev => {
        const newData = { ...prev, ID_DOCENTE: '', ID_USUARIO: '', _usuario_seleccionado: '' };
        ['DNI', 'DNI_FECHA_VENCIMIENTO', 'APELLIDO_PATERNO', 'APELLIDO_MATERNO', 'NOMBRES', 'SEXO',
         'EMAIL', 'TELEFONO', 'TELEFONO_OPCIONAL', 'FECHA_NACIMIENTO',
         'DIRECCION', 'DEPARTAMENTO', 'PROVINCIA', 'DISTRITO',
         'REF_DOM', 'DISCAPACIDAD', 'TIPO_DISCAPACIDAD', 'NRO_CONADIS',
         'RUC', 'CONDICION_LABORAL', 'GRADO_ACADEMICO', 'GRADO_ACADEMICO_DESCRIPCION',
         'GRADO_ACADEMICO_ARCHIVO', 'CONSTANCIA_SUNEDU_DRE_ARCHIVO'
        ].forEach(f => { newData[f] = ''; });
        return newData;
      });
      return;
    }

    try {
      setIsLoadingDocente(true);
      // Cargar docente + usuario desde VW_DOCENTES y USUARIOS
      const docentes = await db.select('VW_DOCENTES', { ID_DOCENTE: idDocente });
      const docente = docentes?.[0];
      if (!docente) throw new Error('No se pudo cargar el docente seleccionado');

      setDocenteSeleccionadoRow(docente);
      setIdDocenteGuardado(idDocente);

      // Cargar usuario completo
      const usuario = await cargarUsuario(docente.ID_USUARIO);
      if (usuario) {
        llenarCamposUsuario(usuario, {
          ID_USUARIO: docente.ID_USUARIO,
          ID_DOCENTE: idDocente
        });
        // Guardar snapshot del usuario para detectar cambios
        const snapshot = {};
        ['DNI', 'DNI_FECHA_VENCIMIENTO', 'APELLIDO_PATERNO', 'APELLIDO_MATERNO', 'NOMBRES', 'SEXO',
         'EMAIL', 'TELEFONO', 'TELEFONO_OPCIONAL', 'FECHA_NACIMIENTO',
         'DIRECCION', 'DEPARTAMENTO', 'PROVINCIA', 'DISTRITO',
         'REF_DOM', 'DISCAPACIDAD', 'TIPO_DISCAPACIDAD', 'NRO_CONADIS'
        ].forEach(f => { snapshot[f] = usuario[f] !== null && usuario[f] !== undefined ? usuario[f] : ''; });
        snapshot.ID_USUARIO = docente.ID_USUARIO;
        setUsuarioSnapshot(snapshot);
        setHasUnsavedChanges(false);
      }

      // Llenar campos docente
      setFormData(prev => ({
        ...prev,
        ID_DOCENTE: idDocente,
        ID_USUARIO: docente.ID_USUARIO,
        _id_usuario_original: docente.ID_USUARIO,
        _usuario_seleccionado: docente.ID_USUARIO,
        RUC: docente.RUC || '',
        CONDICION_LABORAL: docente.CONDICION_LABORAL || '',
        GRADO_ACADEMICO: docente.GRADO_ACADEMICO || '',
        GRADO_ACADEMICO_DESCRIPCION: docente.GRADO_ACADEMICO_DESCRIPCION || '',
        // Archivos existentes del docente (metadata compatible con FileInput).
        // Si el docente ya tiene archivos subidos, se muestran en página 2.
        // Si el usuario no los reemplaza, se preservan los paths originales
        // (extractFile devuelve null para objetos que no son File, así que
        // guardarDocente no sobrescribe la metadata existente).
        GRADO_ACADEMICO_ARCHIVO: buildDocenteArchivo(docente, 'GRADO_ACADEMICO'),
        CONSTANCIA_SUNEDU_DRE_ARCHIVO: buildDocenteArchivo(docente, 'CONSTANCIA_SUNEDU_DRE'),
      }));

      // Capturar paths originales para snapshot (antes de cualquier edición)
      snapshotPathsRef.current = {
        dni: usuario?.DNI_STORAGE_PATH || null,
        grado: docente.GRADO_ACADEMICO_STORAGE_PATH || null,
        constancia: docente.CONSTANCIA_SUNEDU_DRE_STORAGE_PATH || null,
      };

      // Cargar postulaciones existentes del docente (para bloquear plazas ya postuladas)
      try {
        const postulaciones = await db.select('POSTULACION_PLAZA', { ID_DOCENTE: idDocente, ACTIVO: true });
        const idsPostulados = (postulaciones || []).map(p => p.ID_CONVOCATORIA_CURSO);
        setPostulacionesExistentes(idsPostulados);
      } catch (e) {
        console.error('[usePostulacionWizard] Error cargando postulaciones existentes:', e);
        setPostulacionesExistentes([]);
      }
    } catch (err) {
      console.error('[usePostulacionWizard] Error cargando docente:', err);
      setSubmitError(err.message || 'Error al cargar el docente seleccionado');
    } finally {
      setIsLoadingDocente(false);
    }
  }, [llenarCamposUsuario, setFormData]);

  // ── Cambiar modo docente (seleccionar ↔ crear) ──
  const handleModoDocenteChange = useCallback((newModo) => {
    setModoDocente(newModo);
    setDocenteSeleccionadoRow(null);
    setIdDocenteGuardado(null);
    snapshotPathsRef.current = {};

    // Limpiar todos los campos
    setFormData(prev => {
      const newData = { ...prev };
      ['_docente_seleccionado', 'ID_DOCENTE', 'ID_USUARIO', '_id_usuario_original', '_usuario_seleccionado'].forEach(f => { newData[f] = ''; });
      ['DNI', 'DNI_FECHA_VENCIMIENTO', 'APELLIDO_PATERNO', 'APELLIDO_MATERNO', 'NOMBRES', 'SEXO',
       'EMAIL', 'TELEFONO', 'TELEFONO_OPCIONAL', 'FECHA_NACIMIENTO',
       'DIRECCION', 'DEPARTAMENTO', 'PROVINCIA', 'DISTRITO',
       'REF_DOM', 'DISCAPACIDAD', 'TIPO_DISCAPACIDAD', 'NRO_CONADIS',
       'RUC', 'CONDICION_LABORAL', 'GRADO_ACADEMICO', 'GRADO_ACADEMICO_DESCRIPCION',
       'GRADO_ACADEMICO_ARCHIVO', 'CONSTANCIA_SUNEDU_DRE_ARCHIVO'
      ].forEach(f => { newData[f] = ''; });
      newData._modo_usuario = 'seleccionar';
      return newData;
    });
    setUsuarioSnapshot(null);
    setHasUnsavedChanges(false);
    setPostulacionesExistentes([]);
    setSubmitError(null);
  }, [setFormData]);

  // ── Cambiar modo usuario (seleccionar ↔ crear) ──
  const handleModoUsuarioChange = useCallback((newModo) => {
    setFieldValue('_modo_usuario', newModo);
    if (newModo === 'crear') {
      setFormData(prev => {
        const newData = { ...prev };
        ['ID_USUARIO', '_usuario_seleccionado', 'DNI', 'APELLIDO_PATERNO', 'APELLIDO_MATERNO',
         'NOMBRES', 'SEXO', 'EMAIL', 'TELEFONO', 'TELEFONO_OPCIONAL', 'FECHA_NACIMIENTO',
         'DIRECCION', 'DEPARTAMENTO', 'PROVINCIA', 'DISTRITO', 'REF_DOM',
         'DISCAPACIDAD', 'TIPO_DISCAPACIDAD', 'NRO_CONADIS',
         'DNI_ARCHIVO', 'DNI_FECHA_VENCIMIENTO'
        ].forEach(f => { newData[f] = ''; });
        newData.DISCAPACIDAD = false;
        return newData;
      });
    }
    setSubmitError(null);
  }, [setFieldValue, setFormData, setSubmitError]);

  // ── Detectar cambios en el usuario (comparar formData con snapshot) ──
  useEffect(() => {
    if (!usuarioSnapshot || modoDocente !== 'seleccionar' || !idDocenteGuardado) {
      setHasUnsavedChanges(false);
      return;
    }
    const camposUsuario = ['DNI', 'DNI_FECHA_VENCIMIENTO', 'APELLIDO_PATERNO', 'APELLIDO_MATERNO',
      'NOMBRES', 'SEXO', 'EMAIL', 'TELEFONO', 'TELEFONO_OPCIONAL', 'FECHA_NACIMIENTO',
      'DIRECCION', 'DEPARTAMENTO', 'PROVINCIA', 'DISTRITO',
      'REF_DOM', 'DISCAPACIDAD', 'TIPO_DISCAPACIDAD', 'NRO_CONADIS'];
    const hasChanges = camposUsuario.some(f => {
      const current = formData[f] !== undefined && formData[f] !== null ? formData[f] : '';
      const original = usuarioSnapshot[f] !== undefined && usuarioSnapshot[f] !== null ? usuarioSnapshot[f] : '';
      return String(current) !== String(original);
    }) || String(formData._usuario_seleccionado || '') !== String(usuarioSnapshot.ID_USUARIO || '');
    setHasUnsavedChanges(hasChanges);
  }, [formData, usuarioSnapshot, modoDocente, idDocenteGuardado]);

  // ── Guardar cambios del usuario (botón "Guardar cambios") ──
  const handleGuardarCambiosUsuario = useCallback(async () => {
    if (!formData.ID_USUARIO && !formData._usuario_seleccionado) {
      setSubmitError('No hay usuario para guardar.');
      return;
    }
    setIsSavingUsuario(true);
    setSubmitError(null);
    try {
      // Asegurar que ID_USUARIO esté seteado (por si cambió el selector)
      const idUsuario = formData._usuario_seleccionado || formData.ID_USUARIO;
      const dataToSave = { ...formData, ID_USUARIO: idUsuario, _modo_usuario: 'seleccionar' };
      await guardarUsuarioDocente(dataToSave);
      // Actualizar snapshot con los valores guardados
      const newSnapshot = {};
      ['DNI', 'DNI_FECHA_VENCIMIENTO', 'APELLIDO_PATERNO', 'APELLIDO_MATERNO', 'NOMBRES', 'SEXO',
       'EMAIL', 'TELEFONO', 'TELEFONO_OPCIONAL', 'FECHA_NACIMIENTO',
       'DIRECCION', 'DEPARTAMENTO', 'PROVINCIA', 'DISTRITO',
       'REF_DOM', 'DISCAPACIDAD', 'TIPO_DISCAPACIDAD', 'NRO_CONADIS'
      ].forEach(f => { newSnapshot[f] = formData[f] !== undefined && formData[f] !== null ? formData[f] : ''; });
      newSnapshot.ID_USUARIO = idUsuario;
      setUsuarioSnapshot(newSnapshot);
      setHasUnsavedChanges(false);
      setFieldValue('ID_USUARIO', idUsuario);
    } catch (err) {
      console.error('[usePostulacionWizard] Error guardando cambios del usuario:', err);
      setSubmitError(err.message || 'Error al guardar los cambios del usuario');
    } finally {
      setIsSavingUsuario(false);
    }
  }, [formData, setFieldValue, setSubmitError]);

  // ── Guardar usuario nuevo (botón "Guardar usuario nuevo" en modo crear) ──
  const handleGuardarUsuarioNuevo = useCallback(async () => {
    // Validar campos obligatorios
    const camposMinimos = ['DNI', 'APELLIDO_PATERNO', 'NOMBRES', 'EMAIL'];
    const faltantes = camposMinimos.filter(f => !formData[f] || String(formData[f]).trim() === '');
    if (faltantes.length > 0) {
      setSubmitError(`Complete los campos obligatorios: ${faltantes.join(', ')}`);
      return;
    }
    setIsSavingUsuario(true);
    setSubmitError(null);
    try {
      // Crear el usuario nuevo (no se vincula al docente, solo se crea)
      const dataToSave = { ...formData, _modo_usuario: 'crear' };
      const newIdUsuario = await guardarUsuarioDocente(dataToSave);
      // Volver a modo seleccionar
      setFieldValue('_modo_usuario', 'seleccionar');
      // Seleccionar automáticamente el nuevo usuario creado y cargar sus datos
      setFieldValue('_usuario_seleccionado', newIdUsuario);
      // Cargar los datos del nuevo usuario
      const usuario = await cargarUsuario(newIdUsuario);
      if (usuario) {
        llenarCamposUsuario(usuario, {
          ID_USUARIO: newIdUsuario
        });
      }
      // Actualizar snapshot con el nuevo usuario
      const newSnapshot = {};
      ['DNI', 'DNI_FECHA_VENCIMIENTO', 'APELLIDO_PATERNO', 'APELLIDO_MATERNO', 'NOMBRES', 'SEXO',
       'EMAIL', 'TELEFONO', 'TELEFONO_OPCIONAL', 'FECHA_NACIMIENTO',
       'DIRECCION', 'DEPARTAMENTO', 'PROVINCIA', 'DISTRITO',
       'REF_DOM', 'DISCAPACIDAD', 'TIPO_DISCAPACIDAD', 'NRO_CONADIS'
      ].forEach(f => { newSnapshot[f] = usuario[f] !== null && usuario[f] !== undefined ? usuario[f] : ''; });
      newSnapshot.ID_USUARIO = newIdUsuario;
      setUsuarioSnapshot(newSnapshot);
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('[usePostulacionWizard] Error creando usuario nuevo:', err);
      setSubmitError(err.message || 'Error al crear el usuario nuevo');
    } finally {
      setIsSavingUsuario(false);
    }
  }, [formData, setFieldValue, setFormData, setSubmitError, llenarCamposUsuario]);

  const handleNextPage1 = useCallback(async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setSubmitError(null);

    // TEMPORAL: validaciones comentadas para probar navegación
    // // 1. Validar sede-curso
    // const idCc = formData.ID_CONVOCATORIA_CURSO || idConvocatoriaCursoInicial;
    // if (!idCc) {
    //   setSubmitError('Debe seleccionar un sede-curso.');
    //   return;
    // }
    // setIdConvocatoriaCursoSeleccionado(idCc);

    // // 2. Validar campos usuario + docente
    // const allFields = [...docenteUsuarioFields, ...docenteDocenteFields];
    // const visibleFieldNames = allFields
    //   .filter(f => {
    //     if (f.hidden && evaluateHidden(f.hidden, formData)) return false;
    //     if (f._page1Only && modoDocente === 'seleccionar') return false;
    //     if (f._visibleWhenModoSeleccionar && formData._modo_usuario !== 'seleccionar') return false;
    //     return true;
    //   })
    //   .map(f => f.name);
    //
    // setAllTouched(visibleFieldNames);
    // const isValid = validatePage(formData, visibleFieldNames);
    // if (!isValid) return;

    // 3. Si docente existente, no es necesario guardar usuario aquí
    if (modoDocente === 'seleccionar' && idDocenteGuardado) {
      setCurrentPage(2);
      return;
    }

    // 4. Modo crear nuevo docente: validar que haya usuario seleccionado o creado
    if (modoDocente === 'crear') {
      const idUsuario = formData._usuario_seleccionado || formData.ID_USUARIO;
      if (!idUsuario) {
        setSubmitError('Debe seleccionar o crear un usuario antes de continuar.');
        return;
      }
      setIdUsuarioGuardado(idUsuario);
      setCurrentPage(2);
      return;
    }

    // 5. No hay docente seleccionado ni en modo crear
    setSubmitError('Debe seleccionar un docente existente o crear uno nuevo.');
  }, [formData.ID_CONVOCATORIA_CURSOS, formData._usuario_seleccionado, formData.ID_USUARIO, idConvocatoriaCursoInicial, formData, modoDocente, idDocenteGuardado, setAllTouched, validatePage, setIdUsuarioGuardado]);

  // ── Página 2 → 3: validar tablas relacionadas ──
  const handleNextPage2 = useCallback((e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setSubmitError(null);

    // Validar RUC
    if (!formData.RUC || String(formData.RUC).trim() === '') {
      setSubmitError('Debe ingresar el RUC del docente.');
      return;
    }

    // Validar condición laboral
    if (!formData.CONDICION_LABORAL || String(formData.CONDICION_LABORAL).trim() === '') {
      setSubmitError('Debe seleccionar la condición laboral del docente.');
      return;
    }

    // Validar al menos una plaza seleccionada
    const idsCc = formData.ID_CONVOCATORIA_CURSOS || [];
    if (!idsCc || idsCc.length === 0) {
      setSubmitError('Debe seleccionar al menos una plaza en alguna sede.');
      return;
    }

    setCurrentPage(3);
  }, [formData.RUC, formData.CONDICION_LABORAL, formData.ID_CONVOCATORIA_CURSOS, setSubmitError]);

  // ── Construir snapshot de texto desde formData + datos actuales ──
  const construirSnapshotTexto = useCallback(() => {
    const snapshot = {
      SNAP_DNI: formData.DNI || null,
      SNAP_DNI_FECHA_VENCIMIENTO: formData.DNI_FECHA_VENCIMIENTO || null,
      SNAP_APELLIDO_PATERNO: formData.APELLIDO_PATERNO || null,
      SNAP_APELLIDO_MATERNO: formData.APELLIDO_MATERNO || null,
      SNAP_NOMBRES: formData.NOMBRES || null,
      SNAP_EMAIL: formData.EMAIL || null,
      SNAP_TELEFONO: formData.TELEFONO || null,
      SNAP_SEXO: formData.SEXO || null,
      SNAP_FECHA_NACIMIENTO: formData.FECHA_NACIMIENTO || null,
      SNAP_RUC: formData.RUC || null,
      SNAP_CONDICION_LABORAL: formData.CONDICION_LABORAL || null,
      SNAP_GRADO_ACADEMICO: formData.GRADO_ACADEMICO || null,
      SNAP_GRADO_ACADEMICO_DESCRIPCION: formData.GRADO_ACADEMICO_DESCRIPCION || null,
    };

    // Limpiar strings vacíos → null
    Object.keys(snapshot).forEach(k => {
      if (snapshot[k] === '') snapshot[k] = null;
    });

    return snapshot;
  }, [formData]);

  // ── Finalizar (página 4): crear docente + postulación + snapshot ──
  const handleFinalizar = useCallback(async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setSubmitError(null);

    const idsCc = formData.ID_CONVOCATORIA_CURSOS || [];
    if (!idsCc || idsCc.length === 0) {
      setSubmitError('Debe seleccionar al menos una plaza. Vuelva a la página anterior.');
      return;
    }

    setIsSubmitting(true);
    let huboError = false;
    try {
      // 1. Validar tablas relacionadas y obtener sus datos
      const tablasResult = tablasRelacionadasRef.current?.validateAndGetAllData();
      if (!tablasResult || !tablasResult.valid) {
        setSubmitError(tablasResult?.error || 'Complete todos los campos en las tablas relacionadas.');
        setIsSubmitting(false);
        return;
      }

      // 2. Obtener ID_USUARIO (del selector, del guardado, o del estado)
      const idUsuario = formData._usuario_seleccionado || formData.ID_USUARIO || idUsuarioGuardado;
      if (!idUsuario) {
        setSubmitError('No hay un usuario vinculado. Vuelva a la página anterior.');
        setIsSubmitting(false);
        return;
      }

      const archivosMetadata = await subirArchivosDocente(idUsuario, formData);

      // 3. Guardar docente + tablas hijas en transacción
      const idDocenteParaGuardar = idDocenteGuardado || null;
      const result = await guardarDocenteCompleto(
        formData,
        idUsuario,
        idDocenteParaGuardar,
        tablasResult.data,
        archivosMetadata
      );
      const idDocenteFinal = result.id_docente;
      if (!idDocenteFinal) throw new Error('No se pudo obtener el ID del docente guardado');

      // Actualizar paths de snapshot si se subieron archivos nuevos
      if (archivosMetadata.grado) snapshotPathsRef.current.grado = archivosMetadata.grado.path;
      if (archivosMetadata.constancia) snapshotPathsRef.current.constancia = archivosMetadata.constancia.path;

      // 4. Construir snapshot de texto
      const snapshotTexto = construirSnapshotTexto();

      // 5. Crear postulaciones en batch (una sola pasada de inserts + storage paralelo)
      const idsNuevos = idsCc.filter(id => !postulacionesExistentes.includes(id));
      let count = 0;
      if (idsNuevos.length > 0) {
        const result = await createPostulacionesBatch(
          idsNuevos,
          idDocenteFinal,
          snapshotTexto,
          snapshotPathsRef.current,
          adjuntosData,
          preguntasData
        );
        count = result.count;
      }

      // 6. Invalidar cache una sola vez al final del flujo (no durante)
      cacheService.invalidateAll();

      onSuccess?.({ ID_DOCENTE: idDocenteFinal, ID_USUARIO: idUsuario, count });
      // Cerrar tras éxito
      console.log('[usePostulacionWizard] ✅ Cerrando modal tras éxito, onClose:', typeof onClose);
      onClose?.();
    } catch (err) {
      huboError = true;
      console.error('[usePostulacionWizard] Error finalizando:', err);
      setSubmitError(err.message || 'Error al crear la postulación');
    } finally {
      setIsSubmitting(false);
    }
  }, [idUsuarioGuardado, idDocenteGuardado, formData._usuario_seleccionado, formData.ID_USUARIO, formData.ID_CONVOCATORIA_CURSOS, formData, adjuntosData, preguntasData, postulacionesExistentes, construirSnapshotTexto, onSuccess, onClose]);

  // ── Handlers unificados ──
  const handleNext = useCallback(async (e) => {
    if (currentPage === 1) {
      await handleNextPage1(e);
    } else if (currentPage === 2) {
      handleNextPage2(e);
    }
  }, [currentPage, handleNextPage1, handleNextPage2]);

  const handlePrev = useCallback((e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setSubmitError(null);
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (currentPage === 3) {
      await handleFinalizar(e);
    }
  }, [currentPage, handleFinalizar]);

  // ── Reset al cerrar ──
  const resetWizard = useCallback(() => {
    setCurrentPage(1);
    setIsSubmitting(false);
    setSubmitError(null);
    setIdConvocatoriaCursoSeleccionado(idConvocatoriaCursoInicial || '');
    setIdUsuarioGuardado(null);
    setIdDocenteGuardado(null);
    setModoDocente('seleccionar');
    setDocenteSeleccionadoRow(null);
    snapshotPathsRef.current = {};
    setAdjuntosData(null);
    setPreguntasData(null);
    setFormData(initialValues);
  }, [idConvocatoriaCursoInicial, initialValues, setFormData]);

  // ── Cerrar modal ──
  const handleClose = useCallback(() => {
    resetWizard();
    onClose?.();
  }, [resetWizard, onClose]);

  // ── Configuración de campos para selector de docente (página 1) ──
  const docenteSelectorField = useMemo(() => ({
    name: '_docente_seleccionado',
    type: 'reference-select',
    label: 'Docente',
    referenceTable: 'VW_DOCENTES',
    referenceField: 'ID_DOCENTE',
    referenceQuery: '{NOMBRE_COMPLETO} (DNI: {DNI}) (RUC: {RUC})',
    referenceFilters: [
      { field: 'DOCENTE_ACTIVO', op: 'eq', value: true },
      { field: 'USUARIO_ACTIVO', op: 'eq', value: true }
    ],
    searchable: true,
    showRefreshButton: true,
    showAddButton: true,
    onAddClick: () => handleModoDocenteChange('crear'),
    placeholder: 'Seleccione un docente',
    addModalTitle: 'Crear nuevo docente'
  }), [handleModoDocenteChange]);

  // ── Configuración de campo de adjuntos (página 4) ──
  const adjuntosFieldConfig = useMemo(() => ({
    name: 'ADJUNTOS_DATA',
    type: 'predefined-files',
    label: 'Documentos de postulación',
    required: false,
    ignoreField: true,
    mode: 'create',
    triggerField: 'CONDICION_LABORAL',
    loadPredefined: async (formData) => {
      const cond = formData?.CONDICION_LABORAL;
      const idDocente = idDocenteGuardado || formData?.ID_DOCENTE;
      if (!cond && !idDocente) return null;
      const { loadDocumentosForDocente } = await import('@/features/convocatorias/requisitos/documentos/services/convocatoriaDocumentosService');
      return loadDocumentosForDocente({ ID_DOCENTE: idDocente, CONDICION_LABORAL: cond });
    },
    getDownloadUrl: async (path) => {
      const { getDocumentoUrl } = await import('@/features/convocatorias/requisitos/documentos/services/convocatoriaDocumentosService');
      return getDocumentoUrl(path);
    },
    labels: {
      contextBadgePrefix: 'Condición laboral: ',
      sinTrigger: 'Debe guardar el docente primero (página 1) para cargar los requisitos.',
      sinPredefinidos: 'No hay requisitos configurados para esta condición laboral.',
      cargando: 'Cargando requisitos del docente...',
      confirmarReset: 'Cambiar de docente reemplazará los documentos cargados. ¿Desea continuar?'
    },
    accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.png,.jpg,.jpeg',
    maxSize: 10 * 1024 * 1024
  }), [idDocenteGuardado]);

  // ── Configuración de campo de preguntas (página 4) ──
  const preguntasFieldConfig = useMemo(() => ({
    name: 'PREGUNTAS_DATA',
    mode: 'create',
    triggerField: 'CONDICION_LABORAL',
    loadPredefined: async (formData) => {
      const cond = formData?.CONDICION_LABORAL;
      const idDocente = idDocenteGuardado || formData?.ID_DOCENTE;
      if (!cond && !idDocente) return null;
      const { loadPreguntasForDocente } = await import('@/features/convocatorias/requisitos/preguntas/services/convocatoriaPreguntasService');
      return loadPreguntasForDocente({ ID_DOCENTE: idDocente, CONDICION_LABORAL: cond });
    },
    labels: {
      contextBadgePrefix: 'Condición laboral: ',
      sinTrigger: 'Debe guardar el docente primero (página 1) para cargar las preguntas.',
      sinPredefinidos: 'No hay preguntas configuradas para esta condición laboral.',
      cargando: 'Cargando preguntas del docente...',
    }
  }), [idDocenteGuardado]);

  // ── Sincronizar ID_CONVOCATORIA_CURSOS en formData cuando cambia el inicial ──
  useEffect(() => {
    if (idConvocatoriaCursoInicial) {
      setFieldValue('ID_CONVOCATORIA_CURSOS', [idConvocatoriaCursoInicial]);
      setIdConvocatoriaCursoSeleccionado(idConvocatoriaCursoInicial);
    }
  }, [idConvocatoriaCursoInicial, setFieldValue]);

  // ── Props del MultiStepNavigator ──
  const totalPages = 3;
  const isLastPage = currentPage === totalPages;
  const isFirstPage = currentPage === 1;
  const navProps = {
    currentPage,
    totalPages,
    completedPages: [],
    isLastPage,
    isFirstPage,
    canGoNext: !isSubmitting && !isSavingUsuario
      && !(currentPage === 1 && hasUnsavedChanges && modoDocente === 'seleccionar' && idDocenteGuardado)
      && !(currentPage === 1 && modoDocente === 'seleccionar' && !idDocenteGuardado)
      && !(currentPage === 2 && (!formData.RUC || !formData.CONDICION_LABORAL || !(formData.ID_CONVOCATORIA_CURSOS || []).length)),
    canGoPrev: !isSubmitting,
    onNext: handleNext,
    onPrev: handlePrev,
    showDots: true,
    nextText: 'Siguiente',
    prevText: 'Atrás',
    submitText: 'Finalizar',
    loading: isSubmitting || isSavingUsuario,
    currentPageTitle: currentPage === 1 ? 'Datos del Docente' : currentPage === 2 ? 'Destino y Docente' : 'Adjuntos'
  };

  return {
    // State
    currentPage,
    isSubmitting,
    submitError,
    modoDocente,
    docenteSeleccionadoRow,
    idConvocatoriaCursoSeleccionado,
    idUsuarioGuardado,
    idDocenteGuardado,
    isLoadingDocente,
    isLoadingUsuario,
    postulacionesExistentes,
    hasUnsavedChanges,
    isSavingUsuario,
    handleGuardarCambiosUsuario,
    handleGuardarUsuarioNuevo,
    // Form
    formData,
    errors,
    setFieldValue,
    handleFieldChange,
    handleModeChange,
    // Wizard
    navProps,
    handleNext,
    handlePrev,
    handleSubmit,
    handleClose,
    handleModoDocenteChange,
    handleModoUsuarioChange,
    handleDocenteSeleccionado,
    // Refs
    tablasRelacionadasRef,
    // Config
    docenteSelectorField,
    adjuntosFieldConfig,
    adjuntosData,
    setAdjuntosData,
    preguntasFieldConfig,
    preguntasData,
    setPreguntasData,
    // Helpers
    getUsuarioFieldsForRender,
  };
}
