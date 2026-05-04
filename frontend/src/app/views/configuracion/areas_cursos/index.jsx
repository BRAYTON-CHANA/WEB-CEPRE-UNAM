import React, { useState, useMemo } from 'react';
import { useTableData, useCrudForms, CrudMultiLevelManager } from '@/features/crud';
import LayoutWithSidebar from '@/shared/components/layout/LayoutWithSidebar';
import { tableConfig, getTableLevelConfigs } from './config/tableConfig';
import { areasFormFields, areasMultiStep, areasValidation, areasModalConfig } from './config/areasFormConfig';
import { areaCursoBaseFields, areaCursoMultiStep, areaCursoValidation, areaCursoModalConfig } from './config/areaCursoFormConfig';
import { headerProps, getHeaderActions } from './config/headerConfig';

/**
 * Configuración de ÁREAS Y CURSOS
 * MultiLevel CRUD con agrupación por área y CRUD completo en ambos niveles.
 * Usa CrudMultiLevelManager para encapsular modales y layout.
 */
function AreasYCursosConfig() {
  // ==========================================
  // 1. DATOS
  // ==========================================
  const { records, loading, error, refresh } = useTableData(tableConfig.tableName);

  // ==========================================
  // 2. CRUD HOOKS (dos tablas)
  // ==========================================
  const areasCrud = useCrudForms({
    tableName: 'AREAS',
    primaryKey: 'ID_AREA',
    onRefresh: refresh
  });

  const areaCursoCrud = useCrudForms({
    tableName: 'AREA_CURSO',
    primaryKey: 'ID_AREA_CURSO',
    onRefresh: refresh
  });

  // Estado para preseleccionar área al añadir curso desde un área
  const [selectedAreaForNewCurso, setSelectedAreaForNewCurso] = useState(null);

  // ==========================================
  // 3. FORM FIELDS DINÁMICOS (curso-area con área preseleccionada)
  // ==========================================
  const areaCursoFormFields = useMemo(() => {
    if (selectedAreaForNewCurso === null) return areaCursoBaseFields;
    return areaCursoBaseFields.map(field => {
      if (field.name === 'ID_AREA') {
        return { ...field, defaultValue: selectedAreaForNewCurso, disabled: true };
      }
      return field;
    });
  }, [selectedAreaForNewCurso]);

  // ==========================================
  // 4. HANDLERS
  // ==========================================
  const handleAddCursoToArea = (areaRow) => {
    setSelectedAreaForNewCurso(areaRow.ID_AREA);
    areaCursoCrud.handleCreate();
  };

  // ==========================================
  // 5. CONFIGS PARA CrudMultiLevelManager
  // ==========================================
  const tableLevelConfigs = getTableLevelConfigs(areasCrud, areaCursoCrud, handleAddCursoToArea);

  const crudLevels = [
    {
      crud: areasCrud,
      tableName: 'AREAS',
      primaryKey: 'ID_AREA',
      formFields: areasFormFields,
      formLayout: null,
      multiStep: areasMultiStep,
      validation: areasValidation,
      confirmSubmit: true,
      modalConfig: areasModalConfig
    },
    {
      crud: areaCursoCrud,
      tableName: 'AREA_CURSO',
      primaryKey: 'ID_AREA_CURSO',
      formFields: areaCursoFormFields,
      formLayout: null,
      multiStep: areaCursoMultiStep,
      validation: areaCursoValidation,
      confirmSubmit: true,
      modalConfig: {
        ...areaCursoModalConfig,
        createFormKey: selectedAreaForNewCurso ?? 'free'
      },
      onCreateSuccess: () => setSelectedAreaForNewCurso(null),
      onCreateClose: () => setSelectedAreaForNewCurso(null)
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
          actions: getHeaderActions(areasCrud)
        }}
        crudLevels={crudLevels}
      />
    </LayoutWithSidebar>
  );
}

export default AreasYCursosConfig;
