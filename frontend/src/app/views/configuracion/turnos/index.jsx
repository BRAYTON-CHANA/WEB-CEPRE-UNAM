import React, { useState, useMemo } from 'react';
import { useTableData, useCrudForms, CrudMultiLevelManager } from '@/features/crud';
import LayoutWithSidebar from '@/shared/components/layout/LayoutWithSidebar';
import { tableConfig, getTableLevelConfigs } from './config/tableConfig';
import { turnoBaseFields, turnoMultiStep, turnoValidation, turnoModalConfig } from './config/turnosFormConfig';
import { headerProps, getHeaderActions } from './config/headerConfig';

/**
 * Configuración de SEDES Y TURNOS
 * MultiLevel CRUD con agrupación por sede.
 * Nivel 1: SEDES — solo visualización, sin editar ni eliminar
 * Nivel 2: TURNOS — CRUD completo
 * Usa CrudMultiLevelManager para encapsular modales y layout.
 */
function TurnosConfig() {
  // ==========================================
  // 1. DATOS
  // ==========================================
  const { records, loading, error, refresh } = useTableData(tableConfig.tableName);

  // ==========================================
  // 2. CRUD HOOKS
  // ==========================================
  const sedesCrud = useCrudForms({
    tableName: 'SEDES',
    primaryKey: 'ID_SEDE',
    onRefresh: refresh
  });

  const turnosCrud = useCrudForms({
    tableName: 'TURNOS',
    primaryKey: 'ID_TURNO',
    onRefresh: refresh
  });

  // Estado para preseleccionar sede al añadir turno desde una sede
  const [selectedSedeForNewTurno, setSelectedSedeForNewTurno] = useState(null);

  // ==========================================
  // 3. FORM FIELDS DINÁMICOS (turno con sede preseleccionada)
  // ==========================================
  const turnoFormFields = useMemo(() => {
    if (selectedSedeForNewTurno === null) return turnoBaseFields;
    return turnoBaseFields.map(field => {
      if (field.name === 'ID_SEDE') {
        return { ...field, defaultValue: selectedSedeForNewTurno, disabled: true };
      }
      return field;
    });
  }, [selectedSedeForNewTurno]);

  // ==========================================
  // 4. HANDLERS
  // ==========================================
  const handleAddTurnoToSede = (sedeRow) => {
    setSelectedSedeForNewTurno(sedeRow.ID_SEDE);
    turnosCrud.handleCreate();
  };

  // ==========================================
  // 5. CONFIGS PARA CrudMultiLevelManager
  // ==========================================
  const tableLevelConfigs = getTableLevelConfigs(turnosCrud, handleAddTurnoToSede);

  const crudLevels = [
    // Nivel 1 (SEDES) — sin acciones de editar/eliminar en tabla, solo visualización
    {
      crud: sedesCrud,
      tableName: 'SEDES',
      primaryKey: 'ID_SEDE',
      formFields: [],
      formLayout: null,
      multiStep: null,
      validation: {},
      confirmSubmit: false,
      modalConfig: {}
    },
    {
      crud: turnosCrud,
      tableName: 'TURNOS',
      primaryKey: 'ID_TURNO',
      formFields: turnoFormFields,
      formLayout: null,
      multiStep: turnoMultiStep,
      validation: turnoValidation,
      confirmSubmit: true,
      modalConfig: {
        ...turnoModalConfig,
        createFormKey: selectedSedeForNewTurno ?? 'free'
      },
      onCreateSuccess: () => setSelectedSedeForNewTurno(null),
      onCreateClose: () => setSelectedSedeForNewTurno(null)
    }
  ];

  return (
    <LayoutWithSidebar>
      <CrudMultiLevelManager
        data={records}
        loading={loading}
        error={error}
        tableLevelConfigs={tableLevelConfigs}
        headerProps={{
          ...headerProps,
          actions: getHeaderActions()
        }}
        crudLevels={crudLevels}
      />
    </LayoutWithSidebar>
  );
}

export default TurnosConfig;
