import React, { useState, useMemo } from 'react';
import { useTableData, useCrudForms, CrudMultiLevelManager } from '@/features/crud';
import LayoutWithSidebar from '@/shared/components/layout/LayoutWithSidebar';
import { tableConfig, getTableLevelConfigs } from './config/tableConfig';
import { carreraFormFields, carreraValidation, carreraModalConfig } from './config/formConfig';

/**
 * Carreras — CRUD 2 niveles: Sede → Carreras
 * MultiLevel CRUD con agrupación por sede.
 */
function CarrerasConfig() {
  // ==========================================
  // 1. DATOS
  // ==========================================
  const { records, loading, error, refresh } = useTableData(tableConfig.tableName);

  // ==========================================
  // 2. CRUD HOOKS
  // ==========================================
  const carrerasCrud = useCrudForms({
    tableName: 'CARRERAS',
    primaryKey: 'ID_CARRERA',
    onRefresh: refresh
  });

  // Estado para preseleccionar sede al añadir carrera
  const [selectedSedeForNewCarrera, setSelectedSedeForNewCarrera] = useState(null);

  // ==========================================
  // 3. FORM FIELDS DINÁMICOS (carrera con sede preseleccionada)
  // ==========================================
  const dynamicCarreraFields = useMemo(() => {
    if (selectedSedeForNewCarrera === null) return carreraFormFields;
    return carreraFormFields.map(field => {
      if (field.name === 'ID_SEDE') {
        return { ...field, defaultValue: selectedSedeForNewCarrera, disabled: true };
      }
      return field;
    });
  }, [selectedSedeForNewCarrera]);

  // ==========================================
  // 4. HANDLERS
  // ==========================================
  const handleAddCarrera = (sedeRow) => {
    setSelectedSedeForNewCarrera(sedeRow.ID_SEDE);
    carrerasCrud.handleCreate();
  };

  // ==========================================
  // 5. CONFIGS PARA CrudMultiLevelManager
  // ==========================================
  const tableLevelConfigs = getTableLevelConfigs(null, carrerasCrud, handleAddCarrera);

  const crudLevels = [
    {
      crud: carrerasCrud,
      tableName: 'CARRERAS',
      primaryKey: 'ID_CARRERA',
      formFields: dynamicCarreraFields,
      formLayout: null,
      validation: carreraValidation,
      confirmSubmit: true,
      modalConfig: {
        ...carreraModalConfig,
        createFormKey: selectedSedeForNewCarrera ?? 'free'
      },
      onCreateSuccess: () => setSelectedSedeForNewCarrera(null),
      onCreateClose: () => setSelectedSedeForNewCarrera(null)
    }
  ];

  return (
    <LayoutWithSidebar>
      <div className="px-4 py-6 space-y-6">
        {/* Título */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Carreras</h1>
          <p className="text-sm text-gray-600 mt-1">
            Gestión de carreras por sede
          </p>
        </div>

        <CrudMultiLevelManager
          data={records}
          loading={loading}
          error={error}
          tableLevelConfigs={tableLevelConfigs}
          headerProps={{
            title: null,
            actions: []
          }}
          crudLevels={crudLevels}
        />
      </div>
    </LayoutWithSidebar>
  );
}

export default CarrerasConfig;
