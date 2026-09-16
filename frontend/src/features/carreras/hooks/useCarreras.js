import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTableData, useCrudForms } from '@/shared/components/crud';
import { db } from '@/shared/api';
import cacheService from '@/shared/services/cacheService';
import { tableConfig, getTableLevelConfigs } from '@/features/carreras/config/tableConfig';
import {
  carreraFormFields,
  carreraValidation,
  carreraModalConfig
} from '@/features/carreras/config/formConfig';

/**
 * useCarreras — lógica de la página de carreras.
 * State + handlers + CRUD wiring para la tabla CARRERAS.
 */
export function useCarreras() {
  const { records, loading, error, refresh } = useTableData(tableConfig.tableName);
  const [tableRecords, setTableRecords] = useState(records || []);

  const carrerasCrud = useCrudForms({
    tableName: 'CARRERAS',
    primaryKey: 'ID_CARRERA',
    onRefresh: refresh
  });

  const tableLevelConfigs = useMemo(
    () => getTableLevelConfigs(carrerasCrud),
    [carrerasCrud]
  );

  useEffect(() => {
    setTableRecords(records || []);
  }, [records]);

  const handleSaveSuccess = useCallback((recordId, field, newValue) => {
    setTableRecords(prev =>
      prev.map(row => String(row.ID_CARRERA) === String(recordId)
        ? { ...row, [field]: newValue }
        : row
      )
    );
  }, []);

  const transformRecord = useCallback((record) => ({
    ...record,
    ID_SEDES: (record.SEDES || []).map(s => s.id_sede).filter(Boolean)
  }), []);

  const createFunction = useCallback(async (data, id, formData) => {
    const result = await db.executeFunction('upsert_carrera', {
      p_id_carrera: null,
      p_codigo_carrera: data.CODIGO_CARRERA,
      p_id_area: Number(data.ID_AREA),
      p_nombre_carrera: data.NOMBRE_CARRERA,
      p_activo: true,
      p_id_sedes: (formData.ID_SEDES || []).map(Number).filter(Boolean)
    });
    cacheService.invalidateAll();
    return result;
  }, []);

  const editFunction = useCallback(async (data, id, formData) => {
    const result = await db.executeFunction('upsert_carrera', {
      p_id_carrera: Number(id || data.ID_CARRERA),
      p_codigo_carrera: data.CODIGO_CARRERA,
      p_id_area: Number(data.ID_AREA),
      p_nombre_carrera: data.NOMBRE_CARRERA,
      p_activo: carrerasCrud.selectedRow?.ACTIVO ?? true,
      p_id_sedes: (formData.ID_SEDES || []).map(Number).filter(Boolean)
    });
    cacheService.invalidateAll();
    return result;
  }, [carrerasCrud.selectedRow]);

  const crudLevels = useMemo(() => [
    {
      crud: carrerasCrud,
      tableName: 'CARRERAS',
      viewName: 'VW_CARRERAS',
      primaryKey: 'ID_CARRERA',
      formFields: carreraFormFields,
      formLayout: null,
      validation: carreraValidation,
      confirmSubmit: true,
      modalConfig: carreraModalConfig,
      createFunction,
      editFunction,
      transformRecord
    }
  ], [carrerasCrud, createFunction, editFunction, transformRecord]);

  return {
    records,
    tableRecords,
    loading,
    error,
    refresh,
    carrerasCrud,
    tableLevelConfigs,
    crudLevels,
    handleSaveSuccess
  };
}
