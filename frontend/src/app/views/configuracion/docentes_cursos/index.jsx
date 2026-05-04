import React, { useState, useMemo } from 'react';
import { useTableData, useCrudForms, CrudMultiLevelManager } from '@/features/crud';
import LayoutWithSidebar from '@/shared/components/layout/LayoutWithSidebar';
import { tableConfig, getTableLevelConfigs } from './config/tableConfig';
import { docentesFormFields, docentesMultiStep, docentesValidation, docentesModalConfig } from './config/docentesFormConfig';
import { docenteCursoBaseFields, docenteCursoMultiStep, docenteCursoValidation, docenteCursoModalConfig } from './config/docenteCursoFormConfig';
import { headerProps, getHeaderActions } from './config/headerConfig';

/**
 * Configuración de DOCENTES Y CURSOS
 * MultiLevel CRUD con agrupación por docente y CRUD completo en ambos niveles.
 * Usa CrudMultiLevelManager para encapsular modales y layout.
 */
function DocentesYCursosConfig() {
  // ==========================================
  // 1. DATOS
  // ==========================================
  const { records, loading, error, refresh } = useTableData(tableConfig.tableName);

  // ==========================================
  // 2. CRUD HOOKS (dos tablas)
  // ==========================================
  const docentesCrud = useCrudForms({
    tableName: 'DOCENTES',
    primaryKey: 'ID_DOCENTE',
    onRefresh: refresh
  });

  const docenteCursoCrud = useCrudForms({
    tableName: 'DOCENTE_CURSO',
    primaryKey: 'ID_DOCENTE_CURSO',
    onRefresh: refresh
  });

  // Estado para preseleccionar docente al añadir curso desde un docente
  const [selectedDocenteForNewCurso, setSelectedDocenteForNewCurso] = useState(null);

  // ==========================================
  // 3. FORM FIELDS DINÁMICOS (docente-curso con docente preseleccionado)
  // ==========================================
  const docenteCursoFormFields = useMemo(() => {
    if (selectedDocenteForNewCurso === null) return docenteCursoBaseFields;
    return docenteCursoBaseFields.map(field => {
      if (field.name === 'ID_DOCENTE') {
        return { ...field, defaultValue: selectedDocenteForNewCurso, disabled: true };
      }
      return field;
    });
  }, [selectedDocenteForNewCurso]);

  // ==========================================
  // 4. HANDLERS
  // ==========================================
  const handleAddCursoToDocente = (docenteRow) => {
    setSelectedDocenteForNewCurso(docenteRow.ID_DOCENTE);
    docenteCursoCrud.handleCreate();
  };

  // ==========================================
  // 5. CONFIGS PARA CrudMultiLevelManager
  // ==========================================
  const tableLevelConfigs = getTableLevelConfigs(docentesCrud, docenteCursoCrud, handleAddCursoToDocente);

  const crudLevels = [
    {
      crud: docentesCrud,
      tableName: 'DOCENTES',
      primaryKey: 'ID_DOCENTE',
      formFields: docentesFormFields,
      formLayout: null,
      multiStep: docentesMultiStep,
      validation: docentesValidation,
      confirmSubmit: true,
      modalConfig: docentesModalConfig
    },
    {
      crud: docenteCursoCrud,
      tableName: 'DOCENTE_CURSO',
      primaryKey: 'ID_DOCENTE_CURSO',
      formFields: docenteCursoFormFields,
      formLayout: null,
      multiStep: docenteCursoMultiStep,
      validation: docenteCursoValidation,
      confirmSubmit: true,
      modalConfig: {
        ...docenteCursoModalConfig,
        createFormKey: selectedDocenteForNewCurso ?? 'free'
      },
      onCreateSuccess: () => setSelectedDocenteForNewCurso(null),
      onCreateClose: () => setSelectedDocenteForNewCurso(null)
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
          actions: getHeaderActions(docentesCrud)
        }}
        crudLevels={crudLevels}
      />
    </LayoutWithSidebar>
  );
}

export default DocentesYCursosConfig;
