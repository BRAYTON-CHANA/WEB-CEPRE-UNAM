import React, { useState, useMemo } from 'react';
import { useTableData, useCrudForms, CrudMultiLevelManager } from '@/shared/components/crud';
import { DatabaseTableEditable } from '@/shared/components/table';
import { Modal } from '@/shared/components/modal';
import { ConfigLayout } from '@/features/layout';
import ReferenceSelectInput from '@/shared/components/ui/inputs/ReferenceSelectInput';
import { tableConfig, getTableLevelConfigs } from '@/features/configuracion/grupos/config/tableConfig';
import { grupoFormFields, grupoMultiStep, grupoValidation, grupoModalConfig } from '@/features/configuracion/grupos/config/formConfig';
import { headerProps, getHeaderActions } from '@/features/configuracion/grupos/config/headerConfig';

const PLAZAS_COLUMNS = [
  { field: 'NOMBRE_CURSO',          title: 'Curso',         editable: false },
  //{ field: 'EJE_TEMATICO',          title: 'Eje Temático',  editable: false },
  { field: 'NOMBRE_AREA',          title: 'Nombre Area',  editable: false },
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
    searchable: true,
    freezeParams: true,
    showRefreshButton: true
  }
];

/**
 * Grupos — CRUD 2 niveles con selector de período
 * Selector: Período (antes de cargar datos)
 * Nivel 1: Sede (visualización + botón "Añadir Grupo")
 * Nivel 2: Grupo (CRUD completo)
 */
function GruposConfig() {
  // ==========================================
  // 1. SELECTOR DE PERÍODO
  // ==========================================
  const [selectedPeriodo, setSelectedPeriodo] = useState('');

  const handlePeriodoChange = (_, value) => {
    setSelectedPeriodo(value);
  };

  const filters = useMemo(() => {
    return selectedPeriodo ? { ID_PERIODO: selectedPeriodo } : {};
  }, [selectedPeriodo]);

  // ==========================================
  // 2. DATOS (filtrados por período)
  // ==========================================
  const { records, loading, error, refresh } = useTableData(
    selectedPeriodo ? tableConfig.tableName : null,
    filters
  );

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
  const [selectedSedeId, setSelectedSedeId] = useState(null);

  const handleAddGrupo = (row) => {
    setSelectedSedeId(row.ID_SEDE);
    gruposCrud.handleCreate();
  };

  const handleCreateClose = () => {
    setSelectedSedeId(null);
    gruposCrud.handleCloseCreate();
  };

  // ==========================================
  // 4. FORMULARIO DINÁMICO (prellena Periodo y Sede)
  // ==========================================
  const dynamicGrupoFields = useMemo(() => {
    const isCreatingFromSede = selectedPeriodo !== '' && selectedSedeId !== null;
    return grupoFormFields.map((field) => {
      if (isCreatingFromSede && field.name === 'ID_PERIODO') {
        return {
          ...field,
          defaultValue: selectedPeriodo,
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
  }, [selectedPeriodo, selectedSedeId]);

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
    <ConfigLayout>
      <div className="px-4 py-6 space-y-6">
        {/* Título - siempre visible */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grupos</h1>
          <p className="text-sm text-gray-600 mt-1">
            Seleccione un período para ver los grupos
          </p>
        </div>

        {/* Selector de Período */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex-1 max-w-md">
            <ReferenceSelectInput
              name="id_periodo"
              label="Período Académico"
              referenceTable="PERIODOS"
              referenceField="ID_PERIODO"
              referenceLabelField="NOMBRE_PERIODO"
              placeholder="Seleccione un período..."
              searchable={true}
              value={selectedPeriodo}
              onChange={handlePeriodoChange}
              formData={{}}
            />
          </div>
        </div>

        {/* Tabla o mensaje de selección */}
        {selectedPeriodo ? (
          <CrudMultiLevelManager
            data={records}
            loading={loading}
            error={error}
            tableLevelConfigs={tableLevelConfigs}
            headerProps={{
              title: null,
              actions: getHeaderActions()
            }}
            crudLevels={crudLevels}
          />
        ) : (
          <div className="p-12 bg-white rounded-xl border border-gray-200 shadow-sm text-center">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-3 text-gray-500 font-medium">Seleccione un período</p>
            <p className="mt-1 text-sm text-gray-400">Elija un período académico para ver los grupos disponibles.</p>
          </div>
        )}
      </div>

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
          <DatabaseTableEditable
            data={plazasData}
            headers={PLAZAS_COLUMNS}
            tableName="VW_GRUPO_PLAN_CURSO"
            primaryKey="ID_GRUPO_PLAN_CURSO"
            externalLoading={plazasLoading}
            onSaveSuccess={() => refreshPlazas()}
            headerProps={{
              headerDescription: selectedGrupoForPlazas
                ? `Grupo: ${selectedGrupoForPlazas.CODIGO_GRUPO} · ${selectedGrupoForPlazas.NOMBRE_GRUPO}`
                : ''
            }}
          />
        </div>
      </Modal>
    </ConfigLayout>
  );
}

export default GruposConfig;
