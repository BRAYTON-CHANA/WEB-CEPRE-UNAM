import React from 'react';
import { CrudMultiLevelManager } from '@/shared/components/crud';
import { DatabaseTableEditable } from '@/shared/components/table';
import { Modal } from '@/shared/components/modal';
import { ConfigLayout } from '@/features/layout';
import ReferenceSelectInput from '@/shared/components/ui/inputs/ReferenceSelectInput';
import { getHeaderActions } from '@/features/configuracion/grupos/config/headerConfig';
import { PLAZAS_COLUMNS } from '@/features/configuracion/grupos/config/tableConfig';
import { useGrupos } from '@/features/configuracion/grupos/hooks/useGrupos';

/**
 * Grupos — CRUD 2 niveles con selector de período.
 * Nivel 1: Sede → Nivel 2: Grupo (CRUD) + modal de asignación de plazas.
 */
function GruposConfig() {
  const {
    selectedPeriodo, handlePeriodoChange,
    records, loading, error,
    tableLevelConfigs, crudLevels,
    selectedGrupoForPlazas, handleClosePlazas,
    plazasData, plazasLoading, refreshPlazas
  } = useGrupos();

  return (
    <ConfigLayout>
      <div className="px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grupos</h1>
          <p className="text-sm text-gray-600 mt-1">Seleccione un período para ver los grupos</p>
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
            headerProps={{ title: null, actions: getHeaderActions() }}
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
