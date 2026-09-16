import { useState, useMemo, useCallback } from 'react';
import { useTableData, useCrudForms } from '@/shared/components/crud';
import { db } from '@/shared/api';
import cacheService from '@/shared/services/cacheService';
import { usePeriodo } from '@/shared/context/PeriodoContext';
import { tableConfig, getTableLevelConfigs } from '@/features/postulantes/config/tableConfig';
import { postulanteFormFields, postulanteValidation, postulanteModalConfig } from '@/features/postulantes/config/formConfig';

/**
 * usePostulantes — lógica de la página de Postulantes.
 * Selector de período + CRUD 3 niveles + CSV import.
 */
export function usePostulantes() {
  // ===== CSV Import =====
  const [csvModalOpen, setCsvModalOpen] = useState(false);

  // ===== Selector de período (contexto global) =====
  const { periodo: selectedPeriodo, setPeriodo } = usePeriodo();

  const handlePeriodoChange = (_, value) => {
    setPeriodo(value ? Number(value) : null);
  };

  const filters = useMemo(() => {
    return selectedPeriodo ? { ID_PERIODO: selectedPeriodo } : {};
  }, [selectedPeriodo]);

  // ===== Datos =====
  const { records, loading, error, refresh } = useTableData(
    selectedPeriodo ? tableConfig.tableName : null,
    filters
  );

  const handleImportSuccess = async () => {
    return refresh();
  };

  // ===== Asignación de grupos =====
  const [asignarModalOpen, setAsignarModalOpen] = useState(false);
  const [asignarTargets, setAsignarTargets] = useState([]);
  const [asignando, setAsignando] = useState(false);

  const handleOpenAsignar = (rows) => {
    setAsignarTargets(Array.isArray(rows) ? rows : [rows]);
    setAsignarModalOpen(true);
  };

  const handleCloseAsignar = () => {
    setAsignarTargets([]);
    setAsignarModalOpen(false);
  };

  const handleAsignarMasivo = useCallback(async (idGrupo, targets) => {
    if (!idGrupo || !targets || targets.length === 0) return;
    setAsignando(true);
    try {
      const updates = targets.map((row) => ({
        id: Number(row.ID_POSTULANTE),
        data: { ID_GRUPO: Number(idGrupo) }
      }));
      await db.updateBatch('POSTULANTES', updates, 'ID_POSTULANTE');
      // Reconciliar asistencias de los postulantes reasignados
      // (crea las del grupo nuevo, desactiva las del anterior)
      const result = await db.executeFunction('fn_regenerar_asistencias_postulantes', {
        p_ids: targets.map((row) => Number(row.ID_POSTULANTE))
      });
      console.log('[usePostulantes] Asistencias tras asignación masiva:', result);
      cacheService.invalidateAll();
      await refresh();
    } catch (err) {
      console.error('Error asignando grupo:', err);
      throw err;
    } finally {
      setAsignando(false);
    }
  }, [refresh]);

  const handleAsignarGrupo = useCallback(async (idGrupo) => {
    if (!idGrupo || asignarTargets.length === 0) return;
    await handleAsignarMasivo(idGrupo, asignarTargets);
    handleCloseAsignar();
  }, [asignarTargets, handleAsignarMasivo]);

  // ===== Regenerar asistencias del postulante (acción explícita) =====
  const handleRegenerarAsistenciasPostulante = useCallback(async (idPostulantes) => {
    const ids = (Array.isArray(idPostulantes) ? idPostulantes : [idPostulantes]).map(Number);
    try {
      const result = await db.executeFunction('fn_regenerar_asistencias_postulantes', { p_ids: ids });
      console.log('[usePostulantes] Asistencias regeneradas:', result);
      cacheService.invalidateAll();
      await refresh();
    } catch (err) {
      console.error('[usePostulantes] Error regenerando asistencias de postulante:', err);
    }
  }, [refresh]);

  // ===== CRUD =====
  const postulantesCrud = useCrudForms({
    tableName: 'POSTULANTES',
    primaryKey: 'ID_POSTULANTE',
    onRefresh: refresh
  });

  // ===== Crear postulante desde grupo =====
  const [selectedGrupoId, setSelectedGrupoId] = useState(null);
  const [selectedSedeId, setSelectedSedeId] = useState(null);

  const handleAddPostulante = (row) => {
    setSelectedGrupoId(row.ID_GRUPO);
    setSelectedSedeId(row.ID_SEDE_VACANTE);
    postulantesCrud.handleCreate();
  };

  const handleCreateClose = () => {
    setSelectedGrupoId(null);
    setSelectedSedeId(null);
    postulantesCrud.handleCloseCreate();
  };

  // ===== Form dinámico =====
  const dynamicPostulanteFields = useMemo(() => {
    const isCreatingFromGrupo = selectedPeriodo != null && selectedSedeId !== null;
    return postulanteFormFields.map((field) => {
      if (isCreatingFromGrupo && field.name === 'ID_PERIODO') {
        return { ...field, defaultValue: selectedPeriodo, disabled: true };
      }
      if (isCreatingFromGrupo && field.name === 'ID_SEDE_VACANTE') {
        return { ...field, defaultValue: selectedSedeId, disabled: true };
      }
      if (isCreatingFromGrupo && field.name === 'ID_GRUPO') {
        return { ...field, defaultValue: selectedGrupoId || '', disabled: true };
      }
      if (postulantesCrud.selectedRow && !isCreatingFromGrupo) {
        const row = postulantesCrud.selectedRow;
        if (field.name === 'NOMBRES') return { ...field, defaultValue: row.NOMBRES || '' };
        if (field.name === 'APELLIDOS') return { ...field, defaultValue: row.APELLIDOS || '' };
        if (field.name === 'DNI') return { ...field, defaultValue: row.DNI || '' };
        if (field.name === 'ID_USUARIO') return { ...field, defaultValue: row.ID_USUARIO || '' };
        if (field.name === 'ID_GRUPO') return { ...field, defaultValue: row.ID_GRUPO || '' };
        if (field.name === 'ID_CARRERA') return { ...field, defaultValue: row.ID_CARRERA || '' };
        if (field.name === 'ACTIVO') return { ...field, defaultValue: row.POSTULANTE_ACTIVO !== false };
      }
      return field;
    });
  }, [selectedPeriodo, selectedSedeId, selectedGrupoId, postulantesCrud.selectedRow]);

  const splitApellidos = useCallback((apellidos) => {
    const trimmed = (apellidos || '').trim();
    if (!trimmed) return { paterno: null, materno: null };
    const parts = trimmed.split(/\s+/);
    if (parts.length === 1) return { paterno: parts[0].toUpperCase(), materno: null };
    return { paterno: parts[0].toUpperCase(), materno: parts.slice(1).join(' ').toUpperCase() };
  }, []);

  const buildUpsertParams = useCallback((formData, idPostulante = null) => {
    const { paterno, materno } = splitApellidos(formData.APELLIDOS);
    return {
      p_id_postulante: idPostulante,
      p_id_usuario: formData.ID_USUARIO ? Number(formData.ID_USUARIO) : null,
      p_dni: formData.DNI ? String(formData.DNI).trim() : null,
      p_nombres: formData.NOMBRES ? String(formData.NOMBRES).trim().toUpperCase() : null,
      p_apellido_paterno: paterno,
      p_apellido_materno: materno,
      p_sexo: null,
      p_fecha_nacimiento: null,
      p_telefono: null,
      p_email: null,
      p_direccion: null,
      p_departamento: null,
      p_provincia: null,
      p_distrito: null,
      p_codigo_ubigeo_nacimiento: null,
      p_discapacidad: null,
      p_tipo_discapacidad: null,
      p_activo_usuario: true,
      p_id_periodo: formData.ID_PERIODO ? Number(formData.ID_PERIODO) : null,
      p_id_sede: formData.ID_SEDE_EXAMEN ? Number(formData.ID_SEDE_EXAMEN) : null,
      p_id_sede_carrera: formData.ID_SEDE_VACANTE ? Number(formData.ID_SEDE_VACANTE) : null,
      p_id_grupo: formData.ID_GRUPO ? Number(formData.ID_GRUPO) : null,
      p_id_carrera: formData.ID_CARRERA ? Number(formData.ID_CARRERA) : null,
      p_alumno_libre: formData.ALUMNO_LIBRE === true,
      p_fecha_inscripcion: null,
      p_activo_postulante: true
    };
  }, [splitApellidos]);

  const createFunction = useCallback(async (data, id, formData) => {
    const params = buildUpsertParams(formData);
    const result = await db.executeFunction('upsert_postulante', params);
    cacheService.invalidateAll();
    return result;
  }, [buildUpsertParams]);

  const editFunction = useCallback(async (data, id, formData) => {
    const params = buildUpsertParams(formData, id ? Number(id) : null);
    const result = await db.executeFunction('upsert_postulante', params);
    cacheService.invalidateAll();
    return result;
  }, [buildUpsertParams]);

  // ===== Configs =====
  const tableLevelConfigs = getTableLevelConfigs(postulantesCrud, handleAddPostulante, handleOpenAsignar, handleRegenerarAsistenciasPostulante);

  const crudLevels = useMemo(() => [
    {
      crud: postulantesCrud,
      tableName: 'VW_POSTULANTES',
      primaryKey: 'ID_POSTULANTE',
      formFields: dynamicPostulanteFields,
      formLayout: null,
      validation: postulanteValidation,
      confirmSubmit: true,
      modalConfig: postulanteModalConfig,
      createFunction,
      editFunction,
      onCreateClose: handleCreateClose
    }
  ], [postulantesCrud, dynamicPostulanteFields, createFunction, editFunction]);

  return {
    // CSV
    csvModalOpen,
    setCsvModalOpen,
    handleImportSuccess,
    // Selector
    selectedPeriodo,
    handlePeriodoChange,
    // Data
    records,
    loading,
    error,
    refresh,
    // CRUD
    tableLevelConfigs,
    crudLevels,
    // Asignar grupo
    asignarModalOpen,
    asignarTargets,
    asignando,
    handleOpenAsignar,
    handleCloseAsignar,
    handleAsignarGrupo,
    handleAsignarMasivo
  };
}
