import React, { useState, useMemo } from 'react';
import { useTableData, useCrudForms, CrudMultiLevelManager } from '@/features/crud';
import { EditableTable } from '@/features/table';
import { Modal } from '@/features/modal';
import LayoutWithSidebar from '@/shared/components/layout/LayoutWithSidebar';
import { tableConfig, getTableLevelConfigs } from './config/tableConfig';
import { grupoFormFields, grupoMultiStep, grupoValidation, grupoModalConfig } from './config/formConfig';
import { headerProps, getHeaderActions } from './config/headerConfig';

const PLAZAS_COLUMNS = [
  { field: 'NOMBRE_CURSO',          title: 'Curso',         editable: false },
  { field: 'EJE_TEMATICO',          title: 'Eje Temático',  editable: false },
  { field: 'DESCRIPCION_PLAN',      title: 'Plan',          editable: false },
  { field: 'HORAS_ACADEMICAS_CICLO',title: 'Hrs Ciclo',     editable: false },
  {
    field: 'ID_PLAZA_DOCENTE',
    title: 'Plaza / Docente',
    editable: true,
    type: 'function-select',
    functionName: 'fn_plazas_disponibles_por_curso_periodo_sede',
    functionParams: {
      p_id_periodo:      '{ID_PERIODO}',
      p_id_sede:         '{ID_SEDE}',
      p_id_curso:        '{ID_CURSO}',
      p_id_plaza_actual: '{ID_PLAZA_DOCENTE}'
    },
    optionalParams: ['p_id_plaza_actual'],
    valueField: 'id_plaza_docente',
    labelField: '{identificador_docente} - {nombre_curso}',
    descriptionField: '{docente_nombre_completo}',
    placeholder: 'Seleccione una plaza...',
    searchable: true
  }
];

/**
 * Grupos — CRUD 3 niveles
 * Nivel 1: Periodo (visualización)
 * Nivel 2: Sede (visualización + botón "Añadir Grupo")
 * Nivel 3: Grupo (CRUD completo)
 */
function GruposConfig() {
  // ==========================================
  // 1. DATOS
  // ==========================================
  const { records, loading, error, refresh } = useTableData(tableConfig.tableName);

  // ==========================================
  // 2. CRUD HOOKS
  // ==========================================
  const gruposCrud = useCrudForms({
    tableName: 'GRUPOS',
    primaryKey: 'ID_GRUPO',
    onRefresh: refresh
  });

  // ==========================================
  // 3. ESTADOS PARA CREAR GRUPO DESDE SEDE
  // ==========================================

  const [selectedPeriodoId, setSelectedPeriodoId] = useState(null);
  const [selectedSedeId, setSelectedSedeId] = useState(null);

  const handleAddGrupo = (row) => {
    setSelectedPeriodoId(row.ID_PERIODO);
    setSelectedSedeId(row.ID_SEDE);
    gruposCrud.handleCreate();
  };

  const handleCreateClose = () => {
    setSelectedPeriodoId(null);
    setSelectedSedeId(null);
    gruposCrud.handleCloseCreate();
  };

  // ==========================================
  // 4. FORMULARIO DINÁMICO (prellena Periodo y Sede)
  // ==========================================
  const dynamicGrupoFields = useMemo(() => {
    const isCreatingFromSede = selectedPeriodoId !== null && selectedSedeId !== null;
    return grupoFormFields.map((field) => {
      if (isCreatingFromSede && field.name === 'ID_PERIODO') {
        return {
          ...field,
          defaultValue: selectedPeriodoId,
          disabled: true
        };
      }
      if (isCreatingFromSede && field.name === 'ID_SEDE') {
        return {
          ...field,
          defaultValue: selectedSedeId,
          disabled: true
        };
      }
      return field;
    });
  }, [selectedPeriodoId, selectedSedeId]);

  // ==========================================
  // 5. ASIGNAR PLAZAS — estado y datos
  // ==========================================
  const [selectedGrupoForPlazas, setSelectedGrupoForPlazas] = useState(null);

  const handleAsignarPlazas = (row) => setSelectedGrupoForPlazas(row);
  const handleClosePlazas = () => setSelectedGrupoForPlazas(null);

  const plazasFilters = useMemo(
    () => selectedGrupoForPlazas ? { ID_GRUPO: selectedGrupoForPlazas.ID_GRUPO } : {},
    [selectedGrupoForPlazas]
  );

  const {
    records: plazasData,
    loading: plazasLoading,
    refresh: refreshPlazas
  } = useTableData(
    selectedGrupoForPlazas ? 'VW_GRUPO_PLAN_CURSO' : null,
    plazasFilters
  );

  // ==========================================
  // 6. CONFIGS PARA CrudMultiLevelManager
  // ==========================================
  const tableLevelConfigs = getTableLevelConfigs(gruposCrud, handleAddGrupo, handleAsignarPlazas);

  const crudLevels = [
    {
      crud: gruposCrud,
      tableName: 'GRUPOS',
      primaryKey: 'ID_GRUPO',
      formFields: dynamicGrupoFields,
      formLayout: null,
      multiStep: grupoMultiStep,
      validation: grupoValidation,
      confirmSubmit: true,
      modalConfig: grupoModalConfig,
      onCreateClose: handleCreateClose
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

      {/* Modal Asignar Plazas */}
      <Modal
        isOpen={!!selectedGrupoForPlazas}
        onClose={handleClosePlazas}
        title={`Asignar Plazas — ${selectedGrupoForPlazas?.NOMBRE_GRUPO ?? ''}`}
        widthClass="w-full"
        size="8xl"
        closeOnOutsideClick={false}
      >
        <div className="p-4" style={{ minHeight: '400px' }}>
          <EditableTable
            data={plazasData}
            columns={PLAZAS_COLUMNS}
            tableName="VW_GRUPO_PLAN_CURSO"
            primaryKey="ID_GRUPO_PLAN_CURSO"
            loading={plazasLoading}
            onRefresh={refreshPlazas}
            headerDescription={selectedGrupoForPlazas
              ? `Grupo: ${selectedGrupoForPlazas.CODIGO_GRUPO} · ${selectedGrupoForPlazas.NOMBRE_GRUPO}`
              : ''}
          />
        </div>
      </Modal>
    </LayoutWithSidebar>
  );
}

export default GruposConfig;
